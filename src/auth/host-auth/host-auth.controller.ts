import { Body, Controller, Get, Post, Request, UseGuards, Res } from '@nestjs/common';
import { HostAuthService } from './host-auth.service';
import type { LoginHostDto, RegisterHostDto } from './host-auth.service';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCookieAuth } from '@nestjs/swagger';
import { HostLocalAuthGuard } from './guards/host-local-auth.guard';
import { HostJwtAuthGuard } from './guards/host-jwt-auth.guard';
import { HostGoogleAuthGuard } from './guards/host-google-auth.guard';
import { HostJwtRefreshAuthGuard } from './guards/host-jwt-refresh.guard';

@ApiTags('host-auth')
@Controller('auth/host')
export class HostAuthController {
  constructor(private readonly hostAuthService: HostAuthService) {}

  @ApiOperation({ summary: 'Host login with email and password' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'host@example.com' },
        password: { type: 'string', example: 'password123' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Successfully logged in. Cookies set for access and refresh tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @UseGuards(HostLocalAuthGuard)
  @Post('/login')
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    return await this.hostAuthService.login(req.user, res);
  }

  @ApiOperation({ summary: 'Register new host' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'host@example.com' },
        password: { type: 'string', example: 'password123' },
        username: { type: 'string', example: 'hostuser' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        phone: { type: 'string', example: '1234567890' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Host successfully registered.' })
  @ApiResponse({ status: 400, description: 'Validation failed or host already exists.' })
  @Post('/register')
  async register(@Body() data: RegisterHostDto) {
    return this.hostAuthService.register(data);
  }

  @ApiOperation({ summary: 'Logout host' })
  @ApiCookieAuth('host_access_token')
  @ApiResponse({ status: 200, description: 'Successfully logged out. Cookies cleared.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(HostJwtAuthGuard)
  @Get('/logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return await this.hostAuthService.logout(res);
  }

  @ApiOperation({ summary: 'Refresh host access token' })
  @ApiCookieAuth('host_refresh_token')
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(HostJwtRefreshAuthGuard)
  @Get('/refresh')
  async refresh(@Request() req, @Res({ passthrough: true }) res: Response) {
    return await this.hostAuthService.refreshToken(req.user, res);
  }

  @ApiOperation({ summary: 'Initiate Google OAuth login for host' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth page.' })
  @UseGuards(HostGoogleAuthGuard)
  @Get('/google')
  async googleAuth() {
    // Guard handles the redirect
  }

  @ApiOperation({ summary: 'Google OAuth callback for host' })
  @ApiResponse({ status: 302, description: 'Redirects to host dashboard after successful authentication.' })
  @UseGuards(HostGoogleAuthGuard)
  @Get('/google/callback')
  async googleAuthCallback(@Request() req, @Res({ passthrough: true }) res: Response) {
    return await this.hostAuthService.login(req.user, res, true);
  }

  @ApiOperation({ summary: 'Get current host profile' })
  @ApiCookieAuth('host_access_token')
  @ApiResponse({ status: 200, description: 'Returns current host profile.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(HostJwtAuthGuard)
  @Get('/profile')
  async getProfile(@Request() req) {
    return req.user;
  }
}
