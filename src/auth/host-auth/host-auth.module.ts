import { Module } from '@nestjs/common';
import { HostAuthService } from './host-auth.service';
import { HostAuthController } from './host-auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { createLocalStrategy } from '../strategies/shared-local.strategy';
import { createJwtStrategy } from '../strategies/shared-jwt.strategy';
import { createJwtRefreshStrategy } from '../strategies/shared-jwt-refresh.strategy';
import { createGoogleStrategy } from '../strategies/shared-google.strategy';
import { AuthenticatedHost } from '../types/authenticated-host.type';

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
        HostAuthService,
        {
            provide: 'HOST_LOCAL_STRATEGY',
            useFactory: (authService: HostAuthService) => {
                const Strategy = createLocalStrategy<AuthenticatedHost>(
                    'host-local',
                    authService,
                );
                return new Strategy();
            },
            inject: [HostAuthService],
        },
        {
            provide: 'HOST_JWT_STRATEGY',
            useFactory: (configService: ConfigService) => {
                const Strategy = createJwtStrategy({
                    name: 'host-jwt',
                    cookieName: 'host_access_token',
                    role: 'HOST',
                });
                return new Strategy(configService);
            },
            inject: [ConfigService],
        },
        {
            provide: 'HOST_JWT_REFRESH_STRATEGY',
            useFactory: (configService: ConfigService) => {
                const Strategy = createJwtRefreshStrategy({
                    name: 'host-jwt-refresh',
                    cookieName: 'host_refresh_token',
                    role: 'HOST',
                });
                return new Strategy(configService);
            },
            inject: [ConfigService],
        },
        {
            provide: 'HOST_GOOGLE_STRATEGY',
            useFactory: (
                configService: ConfigService,
                authService: HostAuthService,
            ) => {
                const Strategy = createGoogleStrategy<AuthenticatedHost>(
                    {
                        name: 'host-google',
                        callbackURL:
                            configService.get('GOOGLE_HOST_CALLBACK_URL') ?? '',
                    },
                    authService,
                );
                return new Strategy(configService);
            },
            inject: [ConfigService, HostAuthService],
        },
    ],
    controllers: [HostAuthController],
    exports: [HostAuthService],
})
export class HostAuthModule {}
