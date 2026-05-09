import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReviewModule } from '../review/review.module';
import { StorageModule } from '../storage/storage.module';

@Module({
    imports: [PrismaModule, ReviewModule, StorageModule],
    controllers: [SimulatorController],
    providers: [SimulatorService],
    exports: [SimulatorService],
})
export class SimulatorModule {}
