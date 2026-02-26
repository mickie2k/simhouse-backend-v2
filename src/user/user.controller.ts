import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UseGuards,
    Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { FindUserDto } from './dto/find-user.dto';
import { CustomerJwtAuthGuard } from 'src/auth/customer-auth/guards/customer-jwt-auth.guard';
import {
    ApiBody,
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { CreateUserAvatarUploadDto } from './dto/create-user-avatar-upload.dto';
import { UpdateUserAvatarDto } from './dto/update-user-avatar.dto';
import type { Request as ExpressRequest } from 'express';
import { AuthenticatedCustomer } from 'src/auth/types/authenticated-customer.type';

@ApiTags('user')
@Controller('user')
/**
 * Handles customer user profile and account endpoints.
 */
export class UserController {
    constructor(private readonly userService: UserService) {}

    @ApiOperation({ summary: 'Get current user profile' })
    @ApiCookieAuth('access_token')
    @ApiResponse({
        status: 200,
        description: 'Profile retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('profile')
    getProfile(
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ): Promise<unknown> {
        return this.userService.getProfile(req.user);
    }

    @ApiOperation({ summary: 'Update current user profile' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid profile data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Patch('profile')
    updateProfile(
        @Body() data: UpdateUserProfileDto,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ): Promise<unknown> {
        return this.userService.updateProfile(req.user.id, data);
    }

    @ApiOperation({ summary: 'Change current user password' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'Password updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid password data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Patch('profile/password')
    changePassword(
        @Body() data: ChangeUserPasswordDto,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ): Promise<unknown> {
        return this.userService.changePassword(req.user.id, data);
    }

    @ApiOperation({ summary: 'Create avatar upload URL' })
    @ApiCookieAuth('access_token')
    @ApiBody({ type: CreateUserAvatarUploadDto })
    @ApiResponse({
        status: 200,
        description: 'Upload URL created successfully.',
    })
    @ApiResponse({ status: 400, description: 'Invalid content type.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Post('profile/avatar-upload')
    createAvatarUpload(
        @Body() data: CreateUserAvatarUploadDto,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ): Promise<unknown> {
        return this.userService.createAvatarUpload(
            req.user.id,
            data.contentType,
        );
    }

    @ApiOperation({ summary: 'Update user avatar URL' })
    @ApiCookieAuth('access_token')
    @ApiBody({ type: UpdateUserAvatarDto })
    @ApiResponse({ status: 200, description: 'Avatar updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid object key.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Patch('profile/avatar')
    updateAvatar(
        @Body() data: UpdateUserAvatarDto,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ): Promise<unknown> {
        return this.userService.updateAvatar(req.user.id, data.objectKey);
    }

    @ApiOperation({ summary: 'Find user by email (Admin only)' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'User found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Admin role required.',
    })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('email')
    findUserByEmail(@Body() data: FindUserDto): Promise<unknown> {
        return this.userService.findUser(data);
    }

    @ApiOperation({ summary: 'Get all users (Admin only)' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Admin role required.',
    })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('all')
    findAllUsers(): { message: string } {
        return { message: 'u are admin' };
    }

    @ApiOperation({ summary: 'Get current user username' })
    @ApiCookieAuth('access_token')
    @ApiResponse({
        status: 200,
        description: 'Username retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('username')
    getUser(
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ): Promise<unknown> {
        return this.userService.getUsername(req.user);
    }
}
