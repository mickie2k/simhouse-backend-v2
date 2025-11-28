import { Injectable, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BookingRequestDto } from './dto/booking-request.dto';


@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) { }
  private readonly logger = new Logger(BookingService.name);

  async bookingFromCustomerID(customerId: number) {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId },
      orderBy: { bookingDate: 'desc' },
      include: { bookingStatus: true },
    });
    return bookings;
  }

  async scheduleFromBookingId(bookingId: number, customerId: number) {
    const schedules = await this.prisma.booking.findMany({
      where: { id: bookingId, customerId },
      include: {
        bookingList: {
          include: {
            schedule: true,
          },
          orderBy: { schedule: { startTime: 'asc' } },
        },
        simulator: true,
        host: true,
      },
    });
    return schedules;
  }

  async bookingSim(bookingData: BookingRequestDto, customerId: number) {
      const ok = await this.checkScheduleDB(bookingData);
      if (!ok) {
        this.logger.error(`Failed to book simulator for customer ${customerId}`);
        throw new BadRequestException('The selected time is unavailable. Please try another time.');
      }

      const [resultId, status] = await this.bookingSimDB(bookingData, customerId);
      if (!status) {
        this.logger.error(`Failed to book simulator for customer ${customerId}`);
        throw new InternalServerErrorException('something went wrong');
      }

      return { message: 'Booking Success', bookingId: resultId };

  }

  async requestCancel(bookingId: number, customerId: number) {
    const result = await this.cancelBookByCustomer(bookingId, customerId);
    if (!result) {
      this.logger.error(`Failed to cancel booking ${bookingId} for customer ${customerId}`);
      throw new InternalServerErrorException('something went wrong');
    }
    const message = result.count > 0 ? 'Booking has been canceled.' : 'Booking cannot be canceled.';
    const status = result.count > 0;
    return { status, message };
  }


  private async checkScheduleDB(bookingData: BookingRequestDto) {
    const count = await this.prisma.simulatorSchedule.count({
      where: { simId: bookingData.simId, id: { in: bookingData.scheduleId }, available: true },
    });
    return count === bookingData.scheduleId.length;
  }

  private async bookingSimDB(bookingData: BookingRequestDto, customerId: number): Promise<[number, boolean]>{
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) Attempt to claim schedules atomically by updating those available=true
      const claim = await tx.simulatorSchedule.updateMany({
        where: { simId: bookingData.simId, id: { in: bookingData.scheduleId }, available: true },
        data: { available: false },
      });

      if ((claim.count ?? (claim as any).affected ?? 0) !== bookingData.scheduleId.length) {
        // could not claim every requested slot
        throw new Error('Not all schedule slots available');
      }

      // 2) Sum prices
      const agg = await tx.simulatorSchedule.aggregate({
        _sum: { price: true },
        where: { simId: bookingData.simId, id: { in: bookingData.scheduleId } },
      });

      const total = agg._sum?.price ?? null;
      if (total == null) throw new Error('Price calculation failed');

      // 3) Insert booking
      const booking = await tx.booking.create({
        data: { simId: bookingData.simId, customerId: customerId, totalPrice: total },
      });

      // 4) Insert bookinglist entries
      const bookingListRows = bookingData.scheduleId.map((sid) => ({ bookingId: booking.id, scheduleId: sid }));
      await tx.bookingList.createMany({ data: bookingListRows });

      return [booking.id, true] as const;
    });

    return result;
  }

  private async cancelBookByCustomer(bookingId: number, customerID: number) {
    const result = await this.prisma.booking.updateMany({ where: { id: bookingId, customerId: customerID, statusId: 1 }, data: { statusId: 3 } });
    return result;
  }
}
