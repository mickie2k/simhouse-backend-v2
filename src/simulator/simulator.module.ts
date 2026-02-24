import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SimulatorController],
    providers: [SimulatorService],
    exports: [SimulatorService],
})
export class SimulatorModule {}
