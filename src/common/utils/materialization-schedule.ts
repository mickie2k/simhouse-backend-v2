import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

async function materializeSchedule(
    prisma: PrismaService,
    ADVANCE_DAYS = 60,
    logger: Logger,
): Promise<void> {
    logger.log('Starting schedule materialization...');

    const templates = await prisma.scheduleTemplate.findMany({
        where: { isActive: true },
    });

    if (templates.length === 0) {
        logger.log('No active templates found. Skipping.');
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
            const dates = getDatesForDayOfWeek(
                tomorrow,
                ADVANCE_DAYS,
                template.dayOfWeek,
            );

            const hourlySlots = splitIntoHourlySlots(
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
            const result = await prisma.simulatorSchedule.createMany({
                data: slots,
                skipDuplicates: true,
            });
            totalCreated += result.count;
        }
    }

    logger.log(
        `Materialization complete: ${templates.length} templates processed, ${totalCreated} new slots created.`,
    );
}

function getDatesForDayOfWeek(
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
function splitIntoHourlySlots(
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

export { materializeSchedule, getDatesForDayOfWeek, splitIntoHourlySlots };
