import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { ReviewModule } from '../review/review.module';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [ReviewModule, PrismaModule, StorageModule],
    controllers: [BookingController],
    providers: [BookingService],
})
export class BookingModule {}
