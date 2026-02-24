import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { SignOptions } from 'jsonwebtoken';
import { LoginUserDto, RegisterUserDto } from '../dto/auth.dto';

@Injectable()
export class CustomerAuthService {
    private readonly secret: Buffer;

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) {
        this.secret = this.getSecret();
    }

    private getSecret(): Buffer {
        const secret = process.env.AUTH_SECRET;
        if (!secret) {
            throw new InternalServerErrorException(
                'AUTH_SECRET is not defined in environment variables.',
            );
        }
        return Buffer.from(secret, 'base64');
    }

    async validateUser(email: string, password: string) {
        if (!email || !password) {
            throw new UnauthorizedException('Email and password are required');
        }

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (
            user.password &&
            (await argon2.verify(user.password, password, {
                secret: this.secret,
            }))
        ) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { password: _, ...result } = user;
            return result;
        }

        throw new UnauthorizedException('Invalid credentials');
    }

    async validateOrCreateGoogleUser(profile: any) {
        const email = profile.emails?.[0]?.value;
        if (!email) {
            throw new UnauthorizedException('Email not provided by Google');
        }

        let user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Create new customer from Google profile
            user = await this.prisma.user.create({
                data: {
                    email,
                    firstName: profile.name?.givenName || '',
                    lastName: profile.name?.familyName || '',
                    username: email.split('@')[0] + '_' + Date.now(),
                    googleId: profile.id,
                },
            });
        } else if (!user.googleId) {
            // Link existing account with Google
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id },
            });
        }

        const { password: _, ...result } = user;
        return result;
    }

    async login(user: any, res: Response, redirect: boolean = false) {
        const payload = { sub: user.id, email: user.email, role: 'CUSTOMER' };

        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXP ?? '30d',
            secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        } as SignOptions);

        const cookieAccessTokenExp =
            Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1;
        const cookieRefreshTokenExp =
            Number(process.env.COOKIE_JWT_REFRESH_TOKEN_EXP) || 30;

        res.cookie('customer_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(
                Date.now() + cookieAccessTokenExp * 1000 * 60 * 60,
            ),
        });

        res.cookie('customer_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(
                Date.now() + cookieRefreshTokenExp * 1000 * 60 * 60 * 24,
            ),
        });

        if (redirect) {
            res.redirect(process.env.FRONTEND_URL + '/customer/dashboard');
        } else {
            return {
                message: 'Login successful',
                user: { id: user.id, email: user.email, role: 'CUSTOMER' },
            };
        }
    }

    async register(data: RegisterUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await argon2.hash(data.password, {
            secret: this.secret,
        });

        const user = await this.prisma.user.create({
            data: {
                ...data,
                password: hashedPassword,
            },
        });

        const { password: _, ...result } = user;
        return result;
    }

    async logout(res: Response) {
        res.clearCookie('customer_access_token');
        res.clearCookie('customer_refresh_token');
        return { message: 'Logout successful' };
    }

    async refreshToken(user: any, res: Response) {
        const payload = { sub: user.id, email: user.email, role: 'CUSTOMER' };
        const accessToken = await this.jwtService.signAsync(payload);

        const cookieAccessTokenExp =
            Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1;

        res.cookie('customer_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(
                Date.now() + cookieAccessTokenExp * 1000 * 60 * 60,
            ),
        });

        return { message: 'Token refreshed successfully' };
    }
}
