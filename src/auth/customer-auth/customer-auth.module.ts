import { Module } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { createLocalStrategy } from '../strategies/shared-local.strategy';
import { createJwtStrategy } from '../strategies/shared-jwt.strategy';
import { createJwtRefreshStrategy } from '../strategies/shared-jwt-refresh.strategy';
import { createGoogleStrategy } from '../strategies/shared-google.strategy';
import { AuthenticatedCustomer } from '../types/authenticated-customer.type';

@Module({
    imports: [
        PrismaModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: {
                    expiresIn:
                        configService.get('JWT_ACCESS_TOKEN_EXP') ?? '60m',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        CustomerAuthService,
        {
            provide: 'CUSTOMER_LOCAL_STRATEGY',
            useFactory: (authService: CustomerAuthService) => {
                const Strategy = createLocalStrategy<AuthenticatedCustomer>(
                    'customer-local',
                    authService,
                );
                return new Strategy();
            },
            inject: [CustomerAuthService],
        },
        {
            provide: 'CUSTOMER_JWT_STRATEGY',
            useFactory: (configService: ConfigService) => {
                const Strategy = createJwtStrategy({
                    name: 'customer-jwt',
                    cookieName: 'customer_access_token',
                    role: 'CUSTOMER',
                });
                return new Strategy(configService);
            },
            inject: [ConfigService],
        },
        {
            provide: 'CUSTOMER_JWT_REFRESH_STRATEGY',
            useFactory: (configService: ConfigService) => {
                const Strategy = createJwtRefreshStrategy({
                    name: 'customer-jwt-refresh',
                    cookieName: 'customer_refresh_token',
                    role: 'CUSTOMER',
                });
                return new Strategy(configService);
            },
            inject: [ConfigService],
        },
        {
            provide: 'CUSTOMER_GOOGLE_STRATEGY',
            useFactory: (
                configService: ConfigService,
                authService: CustomerAuthService,
            ) => {
                const Strategy = createGoogleStrategy<AuthenticatedCustomer>(
                    {
                        name: 'customer-google',
                        callbackURL:
                            configService.get('GOOGLE_CUSTOMER_CALLBACK_URL') ??
                            configService.get('BACKEND_URL') +
                                '/auth/customer/google/callback',
                    },
                    authService,
                );
                return new Strategy(configService);
            },
            inject: [ConfigService, CustomerAuthService],
        },
    ],
    controllers: [CustomerAuthController],
    exports: [CustomerAuthService],
})
export class CustomerAuthModule {}
