import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SimulatorModule } from '../simulator/simulator.module';
import { StorageModule } from '../storage/storage.module';
import { ScheduleJobModule } from '../schedule-job/schedule-job.module';
import { ReviewModule } from '../review/review.module';

@Module({
    imports: [
        PrismaModule,
        SimulatorModule,
        StorageModule,
        ScheduleJobModule,
        ReviewModule,
    ],
    controllers: [HostController],
    providers: [HostService],
})
export class HostModule {}
