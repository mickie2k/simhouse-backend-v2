import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

export interface LocalAuthService {
    validateUser(email: string, password: string): Promise<any>;
}

export function createLocalStrategy(
    name: string,
    authService: LocalAuthService,
) {
    @Injectable()
    class LocalStrategy extends PassportStrategy(Strategy, name) {
        constructor() {
            super({
                usernameField: 'email',
                passwordField: 'password',
            });
        }

        async validate(email: string, password: string): Promise<any> {
            const user = await authService.validateUser(email, password);
            if (!user) {
                throw new UnauthorizedException('Invalid credentials');
            }
            return user;
        }
    }
    return LocalStrategy as any;
}
