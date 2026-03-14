import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReviewModule } from 'src/review/review.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
    imports: [PrismaModule, ReviewModule, StorageModule],
    controllers: [SimulatorController],
    providers: [SimulatorService],
    exports: [SimulatorService],
})
export class SimulatorModule {}
