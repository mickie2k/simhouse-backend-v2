import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

export interface LocalAuthService<TUser extends object> {
    validateUser(email: string, password: string): Promise<TUser | null>;
}

export function createLocalStrategy<TUser extends object>(
    name: string,
    authService: LocalAuthService<TUser>,
): Type<unknown> {
    @Injectable()
    class LocalStrategy extends PassportStrategy(Strategy, name) {
        constructor() {
            super({
                usernameField: 'email',
                passwordField: 'password',
            });
        }

        async validate(email: string, password: string): Promise<TUser> {
            const user = await authService.validateUser(email, password);
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }
            return user;
        }
    }
    return LocalStrategy as Type<unknown>;
}
