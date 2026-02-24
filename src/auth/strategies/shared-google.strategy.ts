import { Injectable } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
    id: string;
    emails?: Array<{ value?: string }>;
    name?: {
        givenName?: string;
        familyName?: string;
    };
}

export interface GoogleAuthService<TUser extends object> {
    validateOrCreateGoogleUser(profile: GoogleProfile): Promise<TUser>;
}

export interface GoogleStrategyConfig {
    name: string;
    callbackURL: string;
}

export function createGoogleStrategy<TUser extends object>(
    config: GoogleStrategyConfig,
    authService: GoogleAuthService<TUser>,
): Type<unknown> {
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
            profile: GoogleProfile,
            done: VerifyCallback,
        ): Promise<void> {
            try {
                const user =
                    await authService.validateOrCreateGoogleUser(profile);
                done(null, user);
            } catch (error) {
                done(error, false);
            }
        }
    }
    return GoogleStrategy as Type<unknown>;
}
