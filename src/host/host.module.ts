import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';

@Module({
  controllers: [HostController],
  providers: [HostService],
})
export class HostModule {}
