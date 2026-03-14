import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ReviewService],
    exports: [ReviewService],
})
export class ReviewModule {}
