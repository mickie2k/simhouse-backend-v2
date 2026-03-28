import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerAuthModule } from './auth/customer-auth/customer-auth.module';
import { HostAuthModule } from './auth/host-auth/host-auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BookingModule } from './booking/booking.module';
import { HostModule } from './host/host.module';
import { PrismaModule } from './prisma/prisma.module';
import { SimulatorModule } from './simulator/simulator.module';
import { StorageModule } from './storage/storage.module';
import { ScheduleJobModule } from './schedule-job/schedule-job.module';
import { ReviewModule } from './review/review.module';
import { AdminModule } from './admin/admin.module';
import { LocationModule } from './location/location.module';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }), // Makes the config accessible throughout the app
        ScheduleModule.forRoot(),
        PrismaModule,
        UserModule,
        CustomerAuthModule,
        HostAuthModule,
        BookingModule,
        HostModule,
        SimulatorModule,
        StorageModule,
        ScheduleJobModule,
        ReviewModule,
        AdminModule,
        LocationModule,
        HealthModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
