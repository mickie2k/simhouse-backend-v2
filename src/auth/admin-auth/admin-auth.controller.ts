import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    UseGuards,
    Res,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import type { Request as ExpressRequest, Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiCookieAuth,
} from '@nestjs/swagger';
import { AdminLocalAuthGuard } from './guards/admin-local-auth.guard';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { AdminJwtRefreshAuthGuard } from './guards/admin-jwt-refresh.guard';
import { AdminRoleGuard, AdminRoles } from 'src/admin/guards/admin-role.guard';
import { AdminRole } from 'src/generated/prisma/enums';
import { AuthenticatedAdmin } from '../types/authenticated-admin.type';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('admin-auth')
@Controller('auth/admin')
export class AdminAuthController {
    constructor(private readonly adminAuthService: AdminAuthService) {}

    @ApiOperation({ summary: 'Admin login with email and password' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'admin@example.com' },
                password: { type: 'string', example: 'password123' },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description:
            'Successfully logged in. Cookies set for access and refresh tokens.',
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    @UseGuards(AdminLocalAuthGuard)
    @Post('/login')
    async login(
        @Request() req: ExpressRequest & { user: AuthenticatedAdmin },
        @Res({ passthrough: true }) res: Response,
    ) {
        return await this.adminAuthService.login(req.user, res);
    }

    @ApiOperation({ summary: 'Register new admin (Super admin only)' })
    @ApiCookieAuth('admin_access_token')
    @ApiBody({ type: CreateAdminDto })
    @ApiResponse({ status: 201, description: 'Admin successfully registered.' })
    @ApiResponse({
        status: 400,
        description: 'Validation failed or admin already exists.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(AdminJwtAuthGuard, AdminRoleGuard)
    @AdminRoles(AdminRole.SUPER_ADMIN)
    @Post('/register')
    async register(@Body() data: CreateAdminDto) {
        return this.adminAuthService.register(data);
    }

    @ApiOperation({ summary: 'Logout admin' })
    @ApiCookieAuth('admin_access_token')
    @ApiResponse({
        status: 200,
        description: 'Successfully logged out. Cookies cleared.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(AdminJwtAuthGuard)
    @Get('/logout')
    logout(@Res({ passthrough: true }) res: Response) {
        return this.adminAuthService.logout(res);
    }

    @ApiOperation({ summary: 'Refresh admin access token' })
    @ApiCookieAuth('admin_refresh_token')
    @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(AdminJwtRefreshAuthGuard)
    @Get('/refresh')
    async refresh(
        @Request() req: ExpressRequest & { user: AuthenticatedAdmin },
        @Res({ passthrough: true }) res: Response,
    ) {
        return await this.adminAuthService.refreshToken(req.user, res);
    }

    @ApiOperation({ summary: 'Ensure initial admin exists' })
    @ApiResponse({ status: 200, description: 'Admin seed verified.' })
    @Post('/seed')
    async seedAdmin() {
        await this.adminAuthService.ensureAdminExists();
        return { message: 'Admin seed verified' };
    }
}
