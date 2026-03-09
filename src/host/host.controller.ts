import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
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
    ApiBody,
} from '@nestjs/swagger';
import { UpdateHostProfileDto } from './dto/update-host-profile.dto';
import { ChangeHostPasswordDto } from './dto/change-host-password.dto';
import { CreateHostAvatarUploadDto } from './dto/create-host-avatar-upload.dto';
import { UpdateHostAvatarDto } from './dto/update-host-avatar.dto';
import { AuthenticatedHost } from 'src/auth/types/authenticated-host.type';
import { CreateSimulatorImageUploadDto } from 'src/simulator/dto/create-simulator-image-upload.dto';
import { UpdateSimulatorDto } from 'src/host/dto/update-simulator.dto';
import {
    CreateScheduleTemplateDto,
    BulkCreateScheduleTemplateDto,
} from './dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from './dto/update-schedule-template.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { CreateAdHocScheduleDto } from './dto/create-adhoc-schedule.dto';
import { ScheduleSlotQueryDto } from './dto/schedule-slot-query.dto';

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
    @Get('profile')
    getProfile(
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.getProfile(req.user.id);
    }

    @ApiOperation({ summary: 'Update current host profile' })
    @Patch('profile')
    updateProfile(
        @Body() data: UpdateHostProfileDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.updateProfile(req.user.id, data);
    }

    @ApiOperation({ summary: 'Change current host password' })
    @Patch('profile/password')
    changePassword(
        @Body() data: ChangeHostPasswordDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.changePassword(req.user.id, data);
    }

    @ApiOperation({ summary: 'Create avatar upload URL' })
    @ApiBody({ type: CreateHostAvatarUploadDto })
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
    @Patch('profile/avatar')
    updateAvatar(
        @Body() data: UpdateHostAvatarDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.updateAvatar(req.user.id, data.objectKey);
    }

    @ApiOperation({ summary: 'Get all bookings for a specific simulator' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
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
    @Post('booking/:simid/:bookingid/confirm')
    async confirmBooking(
        @Param('simid') simid: string,
        @Param('bookingid') bookingid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.confirmBooking(+bookingid, +simid, req.user.id);
    }

    @ApiOperation({ summary: 'Upload a new simulator with images' })
    @ApiBody({ type: CreateSimulatorDto })
    @Post('simulator')
    async uploadSimulator(
        @Body() createSimulatorDto: CreateSimulatorDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.uploadSimulator(
            createSimulatorDto,
            req.user.id,
        );
    }

    @ApiOperation({ summary: 'Create simulator image upload URL' })
    @ApiBody({ type: CreateSimulatorImageUploadDto })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Upload URL created successfully.',
    })
    @Post('simulator/:simid/image-upload')
    createSimulatorImageUpload(
        @Param('simid') simid: string,
        @Body() data: CreateSimulatorImageUploadDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.createSimulatorImageUpload(
            req.user.id,
            +simid,
            data.contentType,
        );
    }

    @ApiOperation({ summary: 'Update a simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiBody({ type: UpdateSimulatorDto })
    @UseGuards(HostJwtAuthGuard)
    @Patch('simulator/:simid')
    update(
        @Param('simid') simid: string,
        @Body() updateSimulatorDto: UpdateSimulatorDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ) {
        return this.hostService.updateSimulator(
            +simid,
            updateSimulatorDto,
            req.user.id,
        );
    }

    @ApiOperation({ summary: 'Confirm simulator image uploads' })
    @ApiBody({ type: UpdateSimulatorDto })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @Patch('simulator/:simid/images/confirm')
    confirmSimulatorImages(
        @Param('simid') simid: string,
        @Body() data: UpdateSimulatorDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.confirmSimulatorImages(
            +simid,
            data,
            req.user.id,
        );
    }

    // ─── Schedule Template Endpoints ──────────────────────────────

    @ApiOperation({ summary: 'Create a schedule template for a simulator' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiBody({ type: CreateScheduleTemplateDto })
    @Post('simulator/:simid/schedule-template')
    createScheduleTemplate(
        @Param('simid') simid: string,
        @Body() dto: CreateScheduleTemplateDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.createScheduleTemplate(
            +simid,
            req.user.id,
            dto,
        );
    }

    @ApiOperation({ summary: 'Bulk create schedule templates (multiple days)' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiBody({ type: BulkCreateScheduleTemplateDto })
    @Post('simulator/:simid/schedule-template/bulk')
    bulkCreateScheduleTemplates(
        @Param('simid') simid: string,
        @Body() dto: BulkCreateScheduleTemplateDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.bulkCreateScheduleTemplates(
            +simid,
            req.user.id,
            dto,
        );
    }

    @ApiOperation({ summary: 'Get all schedule templates for a simulator' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @Get('simulator/:simid/schedule-template')
    getScheduleTemplates(
        @Param('simid') simid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.getScheduleTemplates(+simid, req.user.id);
    }

    @ApiOperation({ summary: 'Update a schedule template' })
    @ApiParam({
        name: 'templateid',
        description: 'Template ID',
        type: 'number',
    })
    @ApiBody({ type: UpdateScheduleTemplateDto })
    @Patch('schedule-template/:templateid')
    updateScheduleTemplate(
        @Param('templateid') templateid: string,
        @Body() dto: UpdateScheduleTemplateDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.updateScheduleTemplate(
            +templateid,
            req.user.id,
            dto,
        );
    }

    @ApiOperation({ summary: 'Delete (deactivate) a schedule template' })
    @ApiParam({
        name: 'templateid',
        description: 'Template ID',
        type: 'number',
    })
    @Delete('schedule-template/:templateid')
    deleteScheduleTemplate(
        @Param('templateid') templateid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.deleteScheduleTemplate(
            +templateid,
            req.user.id,
        );
    }

    // ─── Schedule Slot Override Endpoints ─────────────────────────

    @ApiOperation({
        summary: 'Get materialized schedule slots for a simulator',
    })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @Get('schedule/:simid/slots')
    getScheduleSlots(
        @Param('simid') simid: string,
        @Query() query: ScheduleSlotQueryDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.getScheduleSlots(
            +simid,
            req.user.id,
            query.startDate,
            query.endDate,
        );
    }

    @ApiOperation({
        summary: 'Override a specific schedule slot (price/availability)',
    })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiParam({
        name: 'scheduleid',
        description: 'Schedule slot ID',
        type: 'number',
    })
    @ApiBody({ type: UpdateScheduleSlotDto })
    @Patch('schedule/:simid/slot/:scheduleid')
    updateScheduleSlot(
        @Param('simid') simid: string,
        @Param('scheduleid') scheduleid: string,
        @Body() dto: UpdateScheduleSlotDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.updateScheduleSlot(
            +scheduleid,
            +simid,
            req.user.id,
            dto,
        );
    }

    @ApiOperation({ summary: 'Create an ad-hoc (one-off) schedule slot' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiBody({ type: CreateAdHocScheduleDto })
    @Post('schedule/:simid/slot')
    createAdHocSlot(
        @Param('simid') simid: string,
        @Body() dto: CreateAdHocScheduleDto,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.createAdHocSlot(+simid, req.user.id, dto);
    }

    @ApiOperation({ summary: 'Delete an unbooked schedule slot' })
    @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
    @ApiParam({
        name: 'scheduleid',
        description: 'Schedule slot ID',
        type: 'number',
    })
    @Delete('schedule/:simid/slot/:scheduleid')
    deleteScheduleSlot(
        @Param('simid') simid: string,
        @Param('scheduleid') scheduleid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ): Promise<unknown> {
        return this.hostService.deleteScheduleSlot(
            +scheduleid,
            +simid,
            req.user.id,
        );
    }
}
