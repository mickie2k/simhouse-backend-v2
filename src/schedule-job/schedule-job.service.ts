import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    materializeSchedule,
    getDatesForDayOfWeek,
    splitIntoHourlySlots,
} from 'src/common/utils/materialization-schedule';

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
    @Cron('0 2 * * *', {
        name: 'materializeSchedules',
        timeZone: 'Asia/Bangkok',
    })
    async materializeSchedules(): Promise<void> {
        await materializeSchedule(this.prisma, ADVANCE_DAYS, this.logger);
    }

    /**
     * Cleanup cron: removes past-date unbooked slots to keep table lean.
     * Runs at 03:00 daily.
     */
    @Cron('0 3 * * *', {
        name: 'cleanupPastSlots',
        timeZone: 'Asia/Bangkok',
    })
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

        const dates = getDatesForDayOfWeek(
            tomorrow,
            ADVANCE_DAYS,
            template.dayOfWeek,
        );

        const hourlySlots = splitIntoHourlySlots(
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
}
