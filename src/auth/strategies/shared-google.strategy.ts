import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleAuthService {
  validateOrCreateGoogleUser(profile: any): Promise<any>;
}

export interface GoogleStrategyConfig {
  name: string;
  callbackURL: string;
}

export function createGoogleStrategy(config: GoogleStrategyConfig, authService: GoogleAuthService) {
  @Injectable()
  class GoogleStrategy extends PassportStrategy(Strategy, config.name) {
    constructor(public readonly configService: ConfigService) {
      super({
        clientID: configService.get('GOOGLE_CLIENT_ID') ?? '',
        clientSecret: configService.get('GOOGLE_CLIENT_SECRET') ?? '',
        callbackURL: config.callbackURL,
        scope: ['email', 'profile'],
      });
    }

    async validate(
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: VerifyCallback,
    ): Promise<any> {
      try {
        const user = await authService.validateOrCreateGoogleUser(profile);
        done(null, user);
      } catch (error) {
        done(error, false);
      }
    }
  }
  return GoogleStrategy as any;
}
