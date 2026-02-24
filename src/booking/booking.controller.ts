import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Request,
    UseGuards,
    HttpStatus,
    Res,
    Delete,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CustomerJwtAuthGuard } from '../auth/customer-auth/guards/customer-jwt-auth.guard';
import { BookingRequestDto } from './dto/booking-request.dto';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiCookieAuth,
} from '@nestjs/swagger';

@ApiTags('booking')
@ApiCookieAuth('access_token')
@Controller('booking')
export class BookingController {
    constructor(private readonly bookingService: BookingService) {}

    @ApiOperation({ summary: 'Create a new booking' })
    @ApiResponse({ status: 201, description: 'Booking created successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid booking data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Time slot not available.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Post()
    async bookingSim(@Body() body: BookingRequestDto, @Request() req) {
        const customerId = req.user.id;
        return this.bookingService.bookingSim(body, customerId);
    }

    @ApiOperation({ summary: 'Get all bookings for current user' })
    @ApiResponse({
        status: 200,
        description: 'Bookings retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get()
    async bookingFromCustomerID(@Request() req) {
        // req.user is set by JwtStrategy validate
        const customerId = req.user.id;
        return this.bookingService.bookingFromCustomerID(customerId);
    }

    @ApiOperation({ summary: 'Get schedule for a specific booking' })
    @ApiParam({ name: 'bookingid', description: 'Booking ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Schedule retrieved successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Booking not found.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get(':bookingid/schedule')
    async scheduleFromBookingID(
        @Param('bookingid') bookingid: string,
        @Request() req,
    ) {
        const customerId = req.user.id;
        return this.bookingService.scheduleFromBookingId(
            +bookingid,
            customerId,
        );
    }

    @ApiOperation({ summary: 'Cancel a booking' })
    @ApiParam({
        name: 'bookingid',
        description: 'Booking ID to cancel',
        type: 'number',
    })
    @ApiResponse({
        status: 200,
        description: 'Booking cancelled successfully.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 404, description: 'Booking not found.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Delete(':bookingid')
    async requestCancel(@Param('bookingid') bookingid: string, @Request() req) {
        const customerId = req.user.id;
        return this.bookingService.requestCancel(+bookingid, +customerId);
    }
}
