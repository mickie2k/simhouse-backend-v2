import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingRequestDto } from './dto/booking-request.dto';
import { ReviewService } from '../review/review.service';
import { formatTime } from 'src/common/utils/formatTime';

@Injectable()
export class BookingService {
    constructor(private readonly prisma: PrismaService) {}
    private readonly logger = new Logger(BookingService.name);
    private readonly reviewService: ReviewService;

    async getBookingById(bookingId: number) {
        return await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                bookingList: {
                    include: {
                        schedule: true,
                    },
                    orderBy: { schedule: { startTime: 'asc' } },
                },
            },
        });
    }

    async bookingFromCustomerID(customerId: number) {
        const bookings = await this.prisma.booking.findMany({
            where: { customerId },
            orderBy: { bookingDate: 'desc' },
            include: { bookingStatus: true },
        });
        return bookings;
    }

    async scheduleFromBookingId(bookingId: number, customerId: number) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId, customerId },
            include: {
                bookingList: {
                    include: {
                        schedule: true,
                    },
                    orderBy: { schedule: { startTime: 'asc' } },
                },
                simulator: {
                    include: {
                        host: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        const format = {
            ...booking,
            bookingList: booking.bookingList.map((s) => ({
                ...s,
                schedule: {
                    ...s.schedule,
                    startTime: formatTime(s.schedule.startTime),
                    endTime: formatTime(s.schedule.endTime),
                },
            })),
        };

        return format;
    }

    async bookingSim(bookingData: BookingRequestDto, customerId: number) {
        const ok = await this.checkScheduleDB(bookingData);
        if (!ok) {
            this.logger.error(
                `Failed to book simulator for customer ${customerId}`,
            );
            throw new BadRequestException(
                'The selected time is unavailable. Please try another time.',
            );
        }

        const [resultId, status] = await this.bookingSimDB(
            bookingData,
            customerId,
        );
        if (!status) {
            this.logger.error(
                `Failed to book simulator for customer ${customerId}`,
            );
            throw new InternalServerErrorException('something went wrong');
        }

        return { message: 'Booking Success', bookingId: resultId };
    }

    async requestCancel(bookingId: number, customerId: number) {
        const result = await this.cancelBookByCustomer(bookingId, customerId);
        if (!result) {
            this.logger.error(
                `Failed to cancel booking ${bookingId} for customer ${customerId}`,
            );
            throw new InternalServerErrorException('something went wrong');
        }
        const message =
            result.count > 0
                ? 'Booking has been canceled.'
                : 'Booking cannot be canceled.';
        const status = result.count > 0;
        return { status, message };
    }

    private async checkScheduleDB(bookingData: BookingRequestDto) {
        const count = await this.prisma.simulatorSchedule.count({
            where: {
                simId: bookingData.simId,
                id: { in: bookingData.scheduleId },
                available: true,
            },
        });
        return count === bookingData.scheduleId.length;
    }

    private async bookingSimDB(
        bookingData: BookingRequestDto,
        customerId: number,
    ): Promise<[number, boolean]> {
        return await this.prisma.$transaction(async (tx) => {
            // 1) Attempt to claim schedules atomically by updating those available=true
            const claim = await tx.simulatorSchedule.updateMany({
                where: {
                    simId: bookingData.simId,
                    id: { in: bookingData.scheduleId },
                    available: true,
                },
                data: { available: false },
            });

            if (
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                (claim.count ?? (claim as any).affected ?? 0) !==
                bookingData.scheduleId.length
            ) {
                // could not claim every requested slot
                throw new Error('Not all schedule slots available');
            }

            // 2) Sum prices
            const agg = await tx.simulatorSchedule.aggregate({
                _sum: { price: true },
                where: {
                    simId: bookingData.simId,
                    id: { in: bookingData.scheduleId },
                },
            });

            const total = agg._sum?.price ?? null;
            if (total == null) throw new Error('Price calculation failed');

            // 3) Insert booking
            const booking = await tx.booking.create({
                data: {
                    simId: bookingData.simId,
                    customerId: customerId,
                    totalPrice: total,
                },
            });

            // 4) Insert bookinglist entries
            const bookingListRows = bookingData.scheduleId.map((sid) => ({
                bookingId: booking.id,
                scheduleId: sid,
            }));
            await tx.bookingList.createMany({ data: bookingListRows });

            return [booking.id, true] as const;
        });
    }

    private async cancelBookByCustomer(bookingId: number, customerID: number) {
        const result = await this.prisma.booking.updateMany({
            where: { id: bookingId, customerId: customerID, statusId: 1 },
            data: { statusId: 3 },
        });

        // Release linked schedule slots back to available
        if (result.count > 0) {
            const bookingListItems = await this.prisma.bookingList.findMany({
                where: { bookingId },
                select: { scheduleId: true },
            });

            const scheduleIds = bookingListItems.map((item) => item.scheduleId);
            if (scheduleIds.length > 0) {
                await this.prisma.simulatorSchedule.updateMany({
                    where: { id: { in: scheduleIds } },
                    data: { available: true },
                });
            }
        }

        return result;
    }

    async getBookingReview(bookingId: number, customerId: number) {
        const checkBooking = await this.getBookingById(bookingId);
        if (!checkBooking) {
            throw new NotFoundException('Booking not found');
        }
        if (checkBooking.customerId !== customerId) {
            throw new NotFoundException('Booking not found for this customer');
        }

        return await this.reviewService.getSimulatorReviewByBookingId(
            bookingId,
        );
    }
}
