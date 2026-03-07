import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface JwtStrategyConfig {
    name: string;
    cookieName: string;
    role: string;
}

interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}

interface AuthenticatedPayload {
    id: number;
    email: string;
    role: string;
}

export function createJwtStrategy(config: JwtStrategyConfig): Type<unknown> {
    const extractCookie = (request: Request): string | null => {
        const cookies = request?.cookies as
            | Record<string, string | undefined>
            | undefined;
        return cookies?.[config.cookieName] ?? null;
    };

    @Injectable()
    class JwtStrategy extends PassportStrategy(Strategy, config.name) {
        constructor(public configService: ConfigService) {
            super({
                jwtFromRequest: ExtractJwt.fromExtractors([extractCookie]),
                ignoreExpiration: false,
                secretOrKey: configService.get('JWT_SECRET') as string,
            });
        }

        validate(payload: JwtPayload): Promise<AuthenticatedPayload> {
            if (payload.role !== config.role) {
                throw new UnauthorizedException(
                    `Invalid token for ${config.role.toLowerCase()}`,
                );
            }
            return Promise.resolve({
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            });
        }
    }
    return JwtStrategy as Type<unknown>;
}
