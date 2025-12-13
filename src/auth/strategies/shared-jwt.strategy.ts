import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

export interface JwtStrategyConfig {
  name: string;
  cookieName: string;
  role: string;
}

export function createJwtStrategy(config: JwtStrategyConfig) {
  @Injectable()
  class JwtStrategy extends PassportStrategy(Strategy, config.name) {
    constructor(public configService: ConfigService) {
      super({
        jwtFromRequest: ExtractJwt.fromExtractors([
          (request: Request) => {
            return request?.cookies?.[config.cookieName];
          },
          ExtractJwt.fromAuthHeaderAsBearerToken(),
        ]),
        ignoreExpiration: false,
        secretOrKey: configService.get('JWT_SECRET') as string,
      });
    }

    async validate(payload: any) {
      if (payload.role !== config.role) {
        throw new UnauthorizedException(`Invalid token for ${config.role.toLowerCase()}`);
      }
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    }
  }
  return JwtStrategy as any;
}
