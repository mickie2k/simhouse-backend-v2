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

export interface LoginHostDto {
  email: string;
  password: string;
}

export interface RegisterHostDto {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
}

@Injectable()
export class HostAuthService {
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

    const host = await this.prisma.host.findUnique({
      where: { email },
    });

    if (!host) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      host.password &&
      (await argon2.verify(host.password, password, { secret: this.secret }))
    ) {
      const { password: _, ...result } = host;
      return result;
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async validateOrCreateGoogleUser(profile: any) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Email not provided by Google');
    }

    let host = await this.prisma.host.findUnique({
      where: { email },
    });

    if (!host) {
      // Create new host from Google profile
      host = await this.prisma.host.create({
        data: {
          email,
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          username: email.split('@')[0] + '_' + Date.now(),
          password: '', // Empty password for Google OAuth users
          phone: '',
          googleId: profile.id,
        },
      });
    } else if (!host.googleId) {
      // Link existing account with Google
      host = await this.prisma.host.update({
        where: { id: host.id },
        data: { googleId: profile.id },
      });
    }

    const { password: _, ...result } = host;
    return result;
  }

  async login(host: any, res: Response, redirect: boolean = false) {
    const payload = { sub: host.id, email: host.email, role: 'HOST' };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXP ?? '30d',
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    } as SignOptions);

    const cookieAccessTokenExp =
      Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1;
    const cookieRefreshTokenExp =
      Number(process.env.COOKIE_JWT_REFRESH_TOKEN_EXP) || 30;

    res.cookie('host_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + cookieAccessTokenExp * 1000 * 60 * 60),
    });

    res.cookie('host_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(
        Date.now() + cookieRefreshTokenExp * 1000 * 60 * 60 * 24,
      ),
    });

    if (redirect) {
      res.redirect(process.env.FRONTEND_URL + '/host/dashboard');
    } else {
      return {
        message: 'Login successful',
        user: { id: host.id, email: host.email, role: 'HOST' },
      };
    }
  }

  async register(data: RegisterHostDto) {
    const existingHost = await this.prisma.host.findUnique({
      where: { email: data.email },
    });

    if (existingHost) {
      throw new ConflictException('Host with this email already exists');
    }

    const hashedPassword = await argon2.hash(data.password, {
      secret: this.secret,
    });

    const host = await this.prisma.host.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = host;
    return result;
  }

  async logout(res: Response) {
    res.clearCookie('host_access_token');
    res.clearCookie('host_refresh_token');
    return { message: 'Logout successful' };
  }

  async refreshToken(host: any, res: Response) {
    const payload = { sub: host.id, email: host.email, role: 'HOST' };
    const accessToken = await this.jwtService.signAsync(payload);

    const cookieAccessTokenExp =
      Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1;

    res.cookie('host_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(Date.now() + cookieAccessTokenExp * 1000 * 60 * 60),
    });

    return { message: 'Token refreshed successfully' };
  }
}
