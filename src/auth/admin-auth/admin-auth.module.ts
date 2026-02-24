import { Module } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { createLocalStrategy } from '../strategies/shared-local.strategy';
import { createJwtStrategy } from '../strategies/shared-jwt.strategy';
import { createJwtRefreshStrategy } from '../strategies/shared-jwt-refresh.strategy';
import { AuthenticatedAdmin } from '../types/authenticated-admin.type';

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
        AdminAuthService,
        {
            provide: 'ADMIN_LOCAL_STRATEGY',
            useFactory: (authService: AdminAuthService) => {
                const Strategy = createLocalStrategy<AuthenticatedAdmin>(
                    'admin-local',
                    authService,
                );
                return new Strategy();
            },
            inject: [AdminAuthService],
        },
        {
            provide: 'ADMIN_JWT_STRATEGY',
            useFactory: (configService: ConfigService) => {
                const Strategy = createJwtStrategy({
                    name: 'admin-jwt',
                    cookieName: 'admin_access_token',
                    role: 'ADMIN',
                });
                return new Strategy(configService);
            },
            inject: [ConfigService],
        },
        {
            provide: 'ADMIN_JWT_REFRESH_STRATEGY',
            useFactory: (configService: ConfigService) => {
                const Strategy = createJwtRefreshStrategy({
                    name: 'admin-jwt-refresh',
                    cookieName: 'admin_refresh_token',
                    role: 'ADMIN',
                });
                return new Strategy(configService);
            },
            inject: [ConfigService],
        },
    ],
    controllers: [AdminAuthController],
    exports: [AdminAuthService],
})
export class AdminAuthModule {}
