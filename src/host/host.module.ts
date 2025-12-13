import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SimulatorModule } from 'src/simulator/simulator.module';

@Module({
  imports: [PrismaModule, SimulatorModule],
  controllers: [HostController],
  providers: [HostService],
})
export class HostModule {}
