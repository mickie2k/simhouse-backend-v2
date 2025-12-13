import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerAuthModule } from './auth/customer-auth/customer-auth.module';
import { HostAuthModule } from './auth/host-auth/host-auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { HostModule } from './host/host.module';
import { PrismaModule } from './prisma/prisma.module';
import { SimulatorModule } from './simulator/simulator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Makes the config accessible throughout the app
    PrismaModule,
    UserModule,
    CustomerAuthModule,
    HostAuthModule,
    BookingModule,
    HostModule,
    SimulatorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
