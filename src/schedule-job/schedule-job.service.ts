import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

const ADVANCE_DAYS = 60;

@Injectable()
export class ScheduleJobService {
    private readonly logger = new Logger(ScheduleJobService.name);

    constructor(private readonly prisma: PrismaService) {}

    /**
     * Daily cron: materializes active schedule templates into concrete
     * 1-hour SimulatorSchedule slots for the next 60 days.
     * Runs at 02:00 daily. Idempotent via unique index + skipDuplicates.
     */
    @Cron('0 2 * * *')
    async materializeSchedules(): Promise<void> {
        this.logger.log('Starting schedule materialization...');

        const templates = await this.prisma.scheduleTemplate.findMany({
            where: { isActive: true },
        });

        if (templates.length === 0) {
            this.logger.log('No active templates found. Skipping.');
            return;
        }

        let totalCreated = 0;

        // Group templates by simId for batch processing
        const templatesBySimId = new Map<number, typeof templates>();
        for (const t of templates) {
            const group = templatesBySimId.get(t.simId) ?? [];
            group.push(t);
            templatesBySimId.set(t.simId, group);
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        for (const [simId, simTemplates] of templatesBySimId) {
            const slots: {
                price: number;
                date: Date;
                startTime: Date;
                endTime: Date;
                available: boolean;
                simId: number;
                templateId: number;
            }[] = [];

            for (const template of simTemplates) {
                const dates = this.getDatesForDayOfWeek(
                    tomorrow,
                    ADVANCE_DAYS,
                    template.dayOfWeek,
                );

                const hourlySlots = this.splitIntoHourlySlots(
                    template.startTime,
                    template.endTime,
                );

                for (const date of dates) {
                    for (const slot of hourlySlots) {
                        slots.push({
                            price: Number(template.pricePerHour),
                            date,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            available: true,
                            simId,
                            templateId: template.id,
                        });
                    }
                }
            }

            if (slots.length > 0) {
                const result = await this.prisma.simulatorSchedule.createMany({
                    data: slots,
                    skipDuplicates: true,
                });
                totalCreated += result.count;
            }
        }

        this.logger.log(
            `Materialization complete: ${templates.length} templates processed, ${totalCreated} new slots created.`,
        );
    }

    /**
     * Cleanup cron: removes past-date unbooked slots to keep table lean.
     * Runs at 03:00 daily.
     */
    @Cron('0 3 * * *')
    async cleanupPastSlots(): Promise<void> {
        this.logger.log('Starting past slot cleanup...');

        const cutoff = new Date();
        cutoff.setUTCDate(cutoff.getUTCDate() - 7);
        cutoff.setUTCHours(0, 0, 0, 0);

        const result = await this.prisma.simulatorSchedule.deleteMany({
            where: {
                date: { lt: cutoff },
                available: true,
            },
        });

        this.logger.log(
            `Cleanup complete: ${result.count} past unbooked slots removed.`,
        );
    }

    /**
     * On-demand materialization for a single template.
     * Called immediately when a host creates/updates a template.
     */
    async materializeForTemplate(templateId: number): Promise<number> {
        const template = await this.prisma.scheduleTemplate.findUnique({
            where: { id: templateId },
        });

        if (!template || !template.isActive) return 0;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const dates = this.getDatesForDayOfWeek(
            tomorrow,
            ADVANCE_DAYS,
            template.dayOfWeek,
        );

        const hourlySlots = this.splitIntoHourlySlots(
            template.startTime,
            template.endTime,
        );

        const slots: {
            price: number;
            date: Date;
            startTime: Date;
            endTime: Date;
            available: boolean;
            simId: number;
            templateId: number;
        }[] = [];
        for (const date of dates) {
            for (const slot of hourlySlots) {
                slots.push({
                    price: Number(template.pricePerHour),
                    date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    available: true,
                    simId: template.simId,
                    templateId: template.id,
                });
            }
        }

        if (slots.length === 0) return 0;

        const result = await this.prisma.simulatorSchedule.createMany({
            data: slots,
            skipDuplicates: true,
        });

        this.logger.log(
            `On-demand materialization for template ${templateId}: ${result.count} slots created.`,
        );
        return result.count;
    }

    /**
     * Returns all dates from `start` within `days` range that match the given dayOfWeek.
     */
    private getDatesForDayOfWeek(
        start: Date,
        days: number,
        dayOfWeek: number,
    ): Date[] {
        const dates: Date[] = [];
        const current = new Date(start);

        for (let i = 0; i < days; i++) {
            if (current.getUTCDay() === dayOfWeek) {
                dates.push(new Date(current));
            }
            current.setUTCDate(current.getUTCDate() + 1);
        }

        return dates;
    }

    /**
     * Splits a time range into 1-hour slots.
     * e.g., 09:00-12:00 → [{09:00-10:00}, {10:00-11:00}, {11:00-12:00}]
     */
    private splitIntoHourlySlots(
        startTime: Date,
        endTime: Date,
    ): { startTime: Date; endTime: Date }[] {
        const slots: { startTime: Date; endTime: Date }[] = [];
        const startMinutes =
            startTime.getUTCHours() * 60 + startTime.getUTCMinutes();
        const endMinutes = endTime.getUTCHours() * 60 + endTime.getUTCMinutes();

        for (let m = startMinutes; m + 60 <= endMinutes; m += 60) {
            const sh = Math.floor(m / 60);
            const sm = m % 60;
            const eh = Math.floor((m + 60) / 60);
            const em = (m + 60) % 60;

            slots.push({
                startTime: new Date(
                    `1970-01-01T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00.000Z`,
                ),
                endTime: new Date(
                    `1970-01-01T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00.000Z`,
                ),
            });
        }

        return slots;
    }
}
