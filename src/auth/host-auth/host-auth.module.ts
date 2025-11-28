import { Module } from '@nestjs/common';
import { HostAuthService } from './host-auth.service';
import { HostAuthController } from './host-auth.controller';

@Module({
  controllers: [HostAuthController],
  providers: [HostAuthService],
})
export class HostAuthModule {}
