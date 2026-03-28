import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { ReviewModule } from '../review/review.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
    imports: [ReviewModule, PrismaModule, StorageModule],
    controllers: [BookingController],
    providers: [BookingService],
})
export class BookingModule {}
