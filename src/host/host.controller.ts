import { Controller, Get, Post, Body, Param, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { HostService } from './host.service';
import { CreateSimulatorDto } from './dto/create-simulator.dto';
import { HostJwtAuthGuard } from 'src/auth/host-auth/guards/host-jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiCookieAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

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
export class HostController {
  constructor(private readonly hostService: HostService) {}

  @ApiOperation({ summary: 'Get all bookings for a specific simulator' })
  @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner of this simulator.' })
  @Get('booking/:simid')
  async bookingFromSimID(@Param('simid') simid: string, @Request() req: ExpressRequest & { user: any }) {
    return this.hostService.getBookingFromSimID(+simid, req.user.id);
  }

  @ApiOperation({ summary: 'Get schedule details for a specific booking' })
  @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
  @ApiParam({ name: 'bookingid', description: 'Booking ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Get('booking/:simid/:bookingid/schedule')
  async scheduleFromBookingID(
    @Param('simid') simid: string,
    @Param('bookingid') bookingid: string,
    @Request() req: ExpressRequest & { user: any }
  ) {
    return this.hostService.scheduleFromBookingID(+bookingid, +simid, req.user.id);
  }

  @ApiOperation({ summary: 'Get all schedules for a specific simulator' })
  @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Get('schedule/:simid')
  async scheduleFromSimID(@Param('simid') simid: string, @Request() req: ExpressRequest & { user: any }) {
    return this.hostService.scheduleFromSimID(+simid, req.user.id);
  }

  @ApiOperation({ summary: 'Confirm a booking' })
  @ApiParam({ name: 'simid', description: 'Simulator ID', type: 'number' })
  @ApiParam({ name: 'bookingid', description: 'Booking ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post('booking/:simid/:bookingid/confirm')
  async confirmBooking(
    @Param('simid') simid: string,
    @Param('bookingid') bookingid: string,
    @Request() req: ExpressRequest & { user: any }
  ) {
    return this.hostService.confirmBooking(+bookingid, +simid, req.user.id);
  }

  @ApiOperation({ summary: 'Upload a new simulator with images' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        simlistname: { type: 'string', example: 'Logitech G29 Racing Setup' },
        listdescription: { type: 'string', example: 'Professional racing simulator setup' },
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
  @ApiResponse({ status: 201, description: 'Simulator uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @Post('simulator')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file1', maxCount: 1 },
      { name: 'file2', maxCount: 1 },
      { name: 'file3', maxCount: 1 },
    ])
  )
  async uploadSimulator(
    @Body() createSimulatorDto: CreateSimulatorDto,
    @UploadedFiles() files: { file1?: MulterFile[]; file2?: MulterFile[]; file3?: MulterFile[] },
    @Request() req: ExpressRequest & { user: any }
  ) {
    return this.hostService.uploadSimulator(createSimulatorDto, files, req.user.id);
  }
}
