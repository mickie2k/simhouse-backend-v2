import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SimulatorService } from 'src/simulator/simulator.service';
import { CreateSimulatorDto } from './dto/create-simulator.dto';

interface MulterFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
}

@Injectable()
export class HostService {
  private readonly logger = new Logger(HostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly simulatorService: SimulatorService
  ) {}

  async getBookingFromSimID(simId: number, hostId: number) {
    // Get all bookings for a simulator owned by this host
    const bookings = await this.prisma.booking.findMany({
      where: {
        simId,
        simulator: {
          hostId
        }
      },
      include: {
        bookingStatus: true,
        customer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { bookingDate: 'desc' }
    });
    return bookings;
  }

  async scheduleFromBookingID(bookingId: number, simId: number, hostId: number) {
    // Get schedule details for a specific booking
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        simId,
        simulator: {
          hostId
        }
      },
      include: {
        bookingList: {
          include: {
            schedule: true
          },
          orderBy: { schedule: { startTime: 'asc' } }
        },
        simulator: true,
        customer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        bookingStatus: true
      }
    });
    return booking;
  }

  async scheduleFromSimID(simId: number, hostId: number) {
    // Get all schedules for a simulator owned by this host
    const schedules = await this.prisma.simulatorSchedule.findMany({
      where: {
        simId,
        simulator: {
          hostId
        }
      },
      orderBy: { startTime: 'asc' }
    });
    return schedules;
  }

  async confirmBooking(bookingId: number, simId: number, hostId: number) {
    // Confirm a booking (change status from pending to confirmed)
    const result = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        simId,
        simulator: {
          hostId
        },
        statusId: 1 // Assuming 1 is pending
      },
      data: {
        statusId: 2 // Assuming 2 is confirmed
      }
    });

    const message = result.count > 0
      ? 'Booking has been confirmed.'
      : 'Booking cannot be confirmed.';
    const status = result.count > 0;
    return { status, message };
  }

  async uploadSimulator(
    createSimulatorDto: CreateSimulatorDto,
    files: { file1?: MulterFile[]; file2?: MulterFile[]; file3?: MulterFile[] },
    hostId: number
  ) {
    // Delegate to SimulatorService for business logic
    return this.simulatorService.create(createSimulatorDto, files, hostId);
  }
}
