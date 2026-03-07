import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SimulatorModule } from 'src/simulator/simulator.module';
import { StorageModule } from 'src/storage/storage.module';
import { ScheduleJobModule } from 'src/schedule-job/schedule-job.module';

@Module({
    imports: [PrismaModule, SimulatorModule, StorageModule, ScheduleJobModule],
    controllers: [HostController],
    providers: [HostService],
})
export class HostModule {}
