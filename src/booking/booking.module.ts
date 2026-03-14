import { Module } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { ReviewModule } from '../review/review.module';

@Module({
    imports: [ReviewModule],
    controllers: [BookingController],
    providers: [BookingService],
})
export class BookingModule {}
