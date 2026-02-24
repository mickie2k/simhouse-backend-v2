import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HostService } from './host.service';
import { CreateSimulatorDto } from './dto/create-simulator.dto';
import { HostJwtAuthGuard } from 'src/auth/host-auth/guards/host-jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiCookieAuth,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { UpdateHostProfileDto } from './dto/update-host-profile.dto';
import { ChangeHostPasswordDto } from './dto/change-host-password.dto';
import { CreateHostAvatarUploadDto } from './dto/create-host-avatar-upload.dto';
import { UpdateHostAvatarDto } from './dto/update-host-avatar.dto';
import { AuthenticatedHost } from 'src/auth/types/authenticated-host.type';

interface MulterFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
}

@ApiTags('host')
@ApiCookieAuth('access_token')
@Controller('host')
// @Roles(Role.HOST)
@UseGuards(HostJwtAuthGuard)
/**
 * Handles host profile and simulator management endpoints.
 */
export class HostController {
    constructor(private readonly hostService: HostService) {}

    @ApiOperation({ summary: 'Get current host profile' })
    @ApiResponse({
        status: 200,
        description: 'Profile retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Get('profile')
    getProfile(
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.getProfile(req.user.id);
    }

    @ApiOperation({ summary: 'Update current host profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid profile data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Patch('profile')
    updateProfile(
        @Body() data: UpdateHostProfileDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.updateProfile(req.user.id, data);
    }

    @ApiOperation({ summary: 'Change current host password' })
    @ApiResponse({ status: 200, description: 'Password updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid password data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Patch('profile/password')
    changePassword(
        @Body() data: ChangeHostPasswordDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.changePassword(req.user.id, data);
    }

    @ApiOperation({ summary: 'Create avatar upload URL' })
    @ApiBody({ type: CreateHostAvatarUploadDto })
    @ApiResponse({
        status: 200,
        description: 'Upload URL created successfully.',
    })
    @ApiResponse({ status: 400, description: 'Invalid content type.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Post('profile/avatar-upload')
    createAvatarUpload(
        @Body() data: CreateHostAvatarUploadDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.createAvatarUpload(
            req.user.id,
            data.contentType,
        );
    }

    @ApiOperation({ summary: 'Update host avatar URL' })
    @ApiBody({ type: UpdateHostAvatarDto })
    @ApiResponse({ status: 200, description: 'Avatar updated successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid object key.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Patch('profile/avatar')
    updateAvatar(
        @Body() data: UpdateHostAvatarDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.updateAvatar(req.user.id, data.objectKey);
    }

    @ApiOperation({ summary: 'Get all bookings for a specific simulator' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Bookings retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({
        status: 403,
        description: 'Forbidden - Not the owner of this simulator.',
    })
    @Get('booking/:simid')
    async bookingFromSimID(
        @Param('simid') simid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.getBookingFromSimID(+simid, req.user.id);
    }

    @ApiOperation({ summary: 'Get schedule details for a specific booking' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiParam({ name: 'bookingid', description: 'Booking ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Schedule retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @Get('booking/:simid/:bookingid/schedule')
    async scheduleFromBookingID(
        @Param('simid') simid: string,
        @Param('bookingid') bookingid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.scheduleFromBookingID(
            +bookingid,
            +simid,
            req.user.id,
        );
    }

    @ApiOperation({ summary: 'Get all schedules for a specific simulator' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Schedules retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @Get('schedule/:simid')
    async scheduleFromSimID(
        @Param('simid') simid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.scheduleFromSimID(+simid, req.user.id);
    }

    @ApiOperation({ summary: 'Confirm a booking' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiParam({ name: 'bookingid', description: 'Booking ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Booking confirmed successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @Post('booking/:simid/:bookingid/confirm')
    async confirmBooking(
        @Param('simid') simid: string,
        @Param('bookingid') bookingid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.confirmBooking(+bookingid, +simid, req.user.id);
    }

    @ApiOperation({ summary: 'Upload a new simulator with images' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                simlistname: {
                    type: 'string',
                    example: 'Logitech G29 Racing Setup',
                },
                listdescription: {
                    type: 'string',
                    example: 'Professional racing simulator setup',
                },
                simtypeid: { type: 'number', example: 1 },
                priceperhour: { type: 'number', example: 200 },
                modid: { type: 'number', example: 1 },
                file1: { type: 'string', format: 'binary' },
                file2: { type: 'string', format: 'binary' },
                file3: { type: 'string', format: 'binary' },
            },
            required: ['simlistname', 'simtypeid', 'priceperhour', 'modid'],
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Simulator uploaded successfully.',
    })
    @ApiResponse({ status: 400, description: 'Invalid data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @Post('simulator')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'file1', maxCount: 1 },
            { name: 'file2', maxCount: 1 },
            { name: 'file3', maxCount: 1 },
        ]),
    )
    async uploadSimulator(
        @Body() createSimulatorDto: CreateSimulatorDto,
        @UploadedFiles()
        files: {
            file1?: MulterFile[];
            file2?: MulterFile[];
            file3?: MulterFile[];
        },
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.uploadSimulator(
            createSimulatorDto,
            files,
            req.user.id,
        );
    }
}
