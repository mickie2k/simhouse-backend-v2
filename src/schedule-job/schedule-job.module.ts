import { Module } from '@nestjs/common';
import { ScheduleJobService } from './schedule-job.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    providers: [ScheduleJobService],
    exports: [ScheduleJobService],
})
export class ScheduleJobModule {}
