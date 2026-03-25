import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Request,
    UseGuards,
    Delete,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CustomerJwtAuthGuard } from '../auth/customer-auth/guards/customer-jwt-auth.guard';
import { BookingRequestDto } from './dto/booking-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AuthenticatedCustomer } from '../auth/types/authenticated-customer.type';
import { ReviewService } from '../review/review.service';
import { CreateSimulatorReviewDto } from '../review/dto/create-simulator-review.dto';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
    constructor(
        private readonly bookingService: BookingService,
        private readonly reviewService: ReviewService,
    ) {}

    @ApiOperation({ summary: 'Create a new booking' })
    @ApiResponse({ status: 201, description: 'Booking created successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid booking data.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 409, description: 'Time slot not available.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Post()
    async bookingSim(
        @Body() body: BookingRequestDto,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ) {
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
    async bookingFromCustomerID(
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ) {
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
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
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
    async requestCancel(
        @Param('bookingid') bookingid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ) {
        const customerId = req.user.id;
        return this.bookingService.requestCancel(+bookingid, +customerId);
    }

    // ─── Review Endpoints (Customer reviews Simulator) ───────────────

    @ApiOperation({
        summary: 'Create a review for a simulator after completing a booking',
    })
    @ApiParam({
        name: 'bookingid',
        description: 'Booking ID',
        type: 'number',
    })
    @ApiResponse({
        status: 201,
        description: 'Review created successfully.',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid data or booking not completed.',
    })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({
        status: 404,
        description: 'Booking not found or not owned by customer.',
    })
    @ApiResponse({ status: 409, description: 'Review already exists.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Post(':bookingid/review')
    async createSimulatorReview(
        @Param('bookingid') bookingid: string,
        @Body() createReviewDto: CreateSimulatorReviewDto,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ) {
        return this.reviewService.createSimulatorReview(
            req.user.id,
            +bookingid,
            createReviewDto,
        );
    }

    @ApiOperation({
        summary: 'Get review for a specific booking',
    })
    @ApiParam({
        name: 'bookingid',
        description: 'Booking ID',
        type: 'number',
    })
    @ApiResponse({
        status: 200,
        description: 'Review retrieved successfully.',
    })
    @ApiResponse({ status: 404, description: 'Review not found.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get(':bookingid/review')
    async getBookingReview(
        @Param('bookingid') bookingid: string,
        @Request() req: ExpressRequest & { user: AuthenticatedCustomer },
    ) {
        return this.bookingService.getBookingReview(+bookingid, req.user.id);
    }
}
