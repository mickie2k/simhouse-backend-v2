import {
    Body,
    Controller,
    Get,
    Post,
    Request,
    UseGuards,
    Res,
} from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { LoginUserDto, RegisterUserDto } from '../dto/auth.dto';
import type { Request as ExpressRequest, Response } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBody,
    ApiCookieAuth,
} from '@nestjs/swagger';
import { CustomerLocalAuthGuard } from './guards/customer-local-auth.guard';
import { CustomerJwtAuthGuard } from './guards/customer-jwt-auth.guard';
import { CustomerGoogleAuthGuard } from './guards/customer-google-auth.guard';
import { CustomerJwtRefreshAuthGuard } from './guards/customer-jwt-refresh.guard';
import { AuthenticatedCustomer } from '../types/authenticated-customer.type';

@ApiTags('customer-auth')
@Controller('auth/customer')
export class CustomerAuthController {
    constructor(private readonly customerAuthService: CustomerAuthService) {}

    @ApiOperation({ summary: 'Customer login with email and password' })
    @ApiBody({ type: LoginUserDto })
    @ApiResponse({
        status: 200,
        description:
            'Successfully logged in. Cookies set for access and refresh tokens.',
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    @UseGuards(CustomerLocalAuthGuard)
    @Post('/login')
    async login(
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
        @Res({ passthrough: true }) res: Response,
    ) {
        return await this.customerAuthService.login(req.user, res);
    }

    @ApiOperation({ summary: 'Register new customer' })
    @ApiBody({ type: RegisterUserDto })
    @ApiResponse({
        status: 201,
        description: 'Customer successfully registered.',
    })
    @ApiResponse({
        status: 400,
        description: 'Validation failed or customer already exists.',
    })
    @Post('/register')
    async register(@Body() data: RegisterUserDto) {
        return this.customerAuthService.register(data);
    }

    @ApiOperation({ summary: 'Logout customer' })
    @ApiCookieAuth('customer_access_token')
    @ApiResponse({
        status: 200,
        description: 'Successfully logged out. Cookies cleared.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('/logout')
    logout(@Res({ passthrough: true }) res: Response) {
        return this.customerAuthService.logout(res);
    }

    @ApiOperation({ summary: 'Refresh customer access token' })
    @ApiCookieAuth('customer_refresh_token')
    @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtRefreshAuthGuard)
    @Get('/refresh')
    async refresh(
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
        @Res({ passthrough: true }) res: Response,
    ) {
        return await this.customerAuthService.refreshToken(req.user, res);
    }

    @ApiOperation({ summary: 'Initiate Google OAuth login for customer' })
    @ApiResponse({
        status: 302,
        description: 'Redirects to Google OAuth page.',
    })
    @UseGuards(CustomerGoogleAuthGuard)
    @Get('/google')
    async googleAuth() {
        // Guard handles the redirect
    }

    @ApiOperation({ summary: 'Google OAuth callback for customer' })
    @ApiResponse({
        status: 302,
        description:
            'Redirects to customer dashboard after successful authentication.',
    })
    @UseGuards(CustomerGoogleAuthGuard)
    @Get('/google/callback')
    async googleAuthCallback(
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
        @Res({ passthrough: true }) res: Response,
    ) {
        return await this.customerAuthService.login(req.user, res, true);
    }
}
