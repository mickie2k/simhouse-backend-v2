import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UseGuards,
    Request,
    Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CustomerJwtAuthGuard } from 'src/auth/customer-auth/guards/customer-jwt-auth.guard';
import {
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
    ApiParam,
} from '@nestjs/swagger';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import { CreateUserAvatarUploadDto } from './dto/create-user-avatar-upload.dto';
import { UpdateUserAvatarDto } from './dto/update-user-avatar.dto';
import type { Request as ExpressRequest } from 'express';
import { AuthenticatedCustomer } from 'src/auth/types/authenticated-customer.type';
import { ReviewService } from 'src/review/review.service';

@ApiTags('user')
@Controller('user')
/**
 * Handles customer user profile and account endpoints.
 */
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly reviewService: ReviewService,
    ) {}

    @ApiOperation({ summary: 'Get current user profile' })
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

    // @ApiOperation({ summary: 'Find user by email (Admin only)' })
    // @ApiResponse({ status: 200, description: 'User found.' })
    // @ApiResponse({ status: 401, description: 'Unauthorized.' })
    // @ApiResponse({
    //     status: 403,
    //     description: 'Forbidden - Admin role required.',
    // })
    // @UseGuards(CustomerJwtAuthGuard)
    // @Get('email')
    // findUserByEmail(@Body() data: FindUserDto): Promise<unknown> {
    //     return this.userService.findUser(data);
    // }

    // @ApiOperation({ summary: 'Get all users (Admin only)' })
    // @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
    // @ApiResponse({ status: 401, description: 'Unauthorized.' })
    // @ApiResponse({
    //     status: 403,
    //     description: 'Forbidden - Admin role required.',
    // })
    // @UseGuards(CustomerJwtAuthGuard)
    // @Get('all')
    // findAllUsers(): { message: string } {
    //     return { message: 'u are admin' };
    // }

    @ApiOperation({ summary: 'Get current user username' })
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

    @ApiOperation({ summary: 'Get reviews for a specific customer' })
    @ApiParam({
        name: 'userId',
        description: 'Customer User ID',
        type: 'number',
    })
    @ApiResponse({
        status: 200,
        description: 'Customer reviews retrieved successfully.',
    })
    @ApiResponse({ status: 404, description: 'Customer not found.' })
    @Get(':userId/reviews')
    getCustomerReviews(@Param('userId') userId: string): Promise<unknown> {
        return this.reviewService.getCustomerReviews(+userId);
    }
}
