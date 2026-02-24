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

// Create customer-specific strategy classes
const CustomerLocalStrategy = createLocalStrategy('customer-local', {} as any);
const CustomerJwtStrategy = createJwtStrategy({
    name: 'customer-jwt',
    cookieName: 'customer_access_token',
    role: 'CUSTOMER',
});
const CustomerJwtRefreshStrategy = createJwtRefreshStrategy({
    name: 'customer-jwt-refresh',
    cookieName: 'customer_refresh_token',
    role: 'CUSTOMER',
});
const CustomerGoogleStrategy = createGoogleStrategy(
    {
        name: 'customer-google',
        callbackURL:
            process.env.GOOGLE_CUSTOMER_CALLBACK_URL ??
            process.env.BACKEND_URL + '/auth/customer/google/callback',
    },
    {} as any,
);

@Module({
    imports: [
        PrismaModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
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
            provide: CustomerLocalStrategy,
            useFactory: (authService: CustomerAuthService) => {
                const Strategy = createLocalStrategy(
                    'customer-local',
                    authService,
                );
                return new Strategy();
            },
            inject: [CustomerAuthService],
        },
        {
            provide: CustomerJwtStrategy,
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
            provide: CustomerJwtRefreshStrategy,
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
            provide: CustomerGoogleStrategy,
            useFactory: (
                configService: ConfigService,
                authService: CustomerAuthService,
            ) => {
                const Strategy = createGoogleStrategy(
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
