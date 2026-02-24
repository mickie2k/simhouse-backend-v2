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

// Create host-specific strategy classes
const HostLocalStrategy = createLocalStrategy('host-local', {} as any);
const HostJwtStrategy = createJwtStrategy({
    name: 'host-jwt',
    cookieName: 'host_access_token',
    role: 'HOST',
});
const HostJwtRefreshStrategy = createJwtRefreshStrategy({
    name: 'host-jwt-refresh',
    cookieName: 'host_refresh_token',
    role: 'HOST',
});
const HostGoogleStrategy = createGoogleStrategy(
    {
        name: 'host-google',
        callbackURL:
            process.env.GOOGLE_HOST_CALLBACK_URL ??
            process.env.BACKEND_URL + '/auth/host/google/callback',
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
        HostAuthService,
        {
            provide: HostLocalStrategy,
            useFactory: (authService: HostAuthService) => {
                const Strategy = createLocalStrategy('host-local', authService);
                return new Strategy();
            },
            inject: [HostAuthService],
        },
        {
            provide: HostJwtStrategy,
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
            provide: HostJwtRefreshStrategy,
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
            provide: HostGoogleStrategy,
            useFactory: (
                configService: ConfigService,
                authService: HostAuthService,
            ) => {
                const Strategy = createGoogleStrategy(
                    {
                        name: 'host-google',
                        callbackURL:
                            configService.get('GOOGLE_HOST_CALLBACK_URL') ??
                            configService.get('BACKEND_URL') +
                                '/auth/host/google/callback',
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
