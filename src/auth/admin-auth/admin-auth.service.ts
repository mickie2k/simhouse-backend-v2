import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    InternalServerErrorException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';
import * as argon2 from 'argon2';
import { SignOptions } from 'jsonwebtoken';
import { AuthenticatedAdmin } from '../types/authenticated-admin.type';
import { CreateAdminDto } from './dto/create-admin.dto';
import { AdminRole } from 'src/generated/prisma/enums';

type AuthLoginResponse = {
    message: string;
    user: AuthenticatedAdmin;
};

@Injectable()
export class AdminAuthService {
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

    async validateUser(
        email: string,
        password: string,
    ): Promise<AuthenticatedAdmin> {
        if (!email || !password) {
            throw new UnauthorizedException('Email and password are required');
        }

        const admin = await this.prisma.admin.findUnique({
            where: { email },
        });

        if (!admin || !admin.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (
            admin.password &&
            (await argon2.verify(admin.password, password, {
                secret: this.secret,
            }))
        ) {
            return {
                id: admin.id,
                email: admin.email,
                role: 'ADMIN',
                adminRole: admin.role,
            };
        }

        throw new UnauthorizedException('Invalid credentials');
    }

    async login(
        admin: AuthenticatedAdmin,
        res: Response,
    ): Promise<AuthLoginResponse> {
        const payload = {
            sub: admin.id,
            email: admin.email,
            role: 'ADMIN',
            adminRole: admin.adminRole,
        };

        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXP ?? '30d',
            secret: process.env.JWT_REFRESH_TOKEN_SECRET,
        } as SignOptions);

        const cookieAccessTokenExp =
            Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1;
        const cookieRefreshTokenExp =
            Number(process.env.COOKIE_JWT_REFRESH_TOKEN_EXP) || 30;

        res.cookie('admin_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(
                Date.now() + cookieAccessTokenExp * 1000 * 60 * 60,
            ),
        });

        res.cookie('admin_refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(
                Date.now() + cookieRefreshTokenExp * 1000 * 60 * 60 * 24,
            ),
        });

        return {
            message: 'Login successful',
            user: {
                id: admin.id,
                email: admin.email,
                role: 'ADMIN',
                adminRole: admin.adminRole,
            },
        };
    }

    async register(data: CreateAdminDto) {
        const existingAdmin = await this.prisma.admin.findUnique({
            where: { email: data.email },
        });

        if (existingAdmin) {
            throw new ConflictException('Admin with this email already exists');
        }

        const hashedPassword = await argon2.hash(data.password, {
            secret: this.secret,
        });

        const admin = await this.prisma.admin.create({
            data: {
                username: data.username,
                email: data.email,
                password: hashedPassword,
                role: data.role,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return admin;
    }

    async refreshToken(
        admin: AuthenticatedAdmin,
        res: Response,
    ): Promise<{ message: string }> {
        const payload = {
            sub: admin.id,
            email: admin.email,
            role: 'ADMIN',
            adminRole: admin.adminRole,
        };
        const accessToken = await this.jwtService.signAsync(payload);

        const cookieAccessTokenExp =
            Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1;

        res.cookie('admin_access_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(
                Date.now() + cookieAccessTokenExp * 1000 * 60 * 60,
            ),
        });

        return { message: 'Token refreshed successfully' };
    }

    logout(res: Response) {
        res.clearCookie('admin_access_token');
        res.clearCookie('admin_refresh_token');
        return { message: 'Logout successful' };
    }

    async ensureAdminExists(): Promise<void> {
        const count = await this.prisma.admin.count();
        if (count > 0) {
            return;
        }

        const seedEmail = process.env.ADMIN_SEED_EMAIL;
        const seedPassword = process.env.ADMIN_SEED_PASSWORD;
        const seedUsername = process.env.ADMIN_SEED_USERNAME ?? 'admin';
        if (!seedEmail || !seedPassword) {
            throw new ForbiddenException(
                'Admin seed credentials not configured',
            );
        }

        const hashedPassword = await argon2.hash(seedPassword, {
            secret: this.secret,
        });

        await this.prisma.admin.create({
            data: {
                email: seedEmail,
                username: seedUsername,
                password: hashedPassword,
                role: AdminRole.SUPER_ADMIN,
            },
        });
    }
}
