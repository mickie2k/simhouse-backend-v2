import { Controller, Get, Post, Body, Param, Request, UseGuards, HttpStatus, Res, Delete } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JWTAuthGuard } from '../auth/guards/jwt_auth.guard';
import { BookingRequestDto } from './dto/booking-request.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @UseGuards(JWTAuthGuard)
  @Post()
  async bookingSim(@Body() body: BookingRequestDto, @Request() req) {
    const customerId = req.user.id;
    return this.bookingService.bookingSim(body, customerId);
  }

  @UseGuards(JWTAuthGuard)
  @Get()
  async bookingFromCustomerID(@Request() req) {
    // req.user is set by JwtStrategy validate
    const customerId = req.user.id;
    return this.bookingService.bookingFromCustomerID(customerId);
  }

  @UseGuards(JWTAuthGuard)
  @Get(':bookingid/schedule')
  async scheduleFromBookingID(@Param('bookingid') bookingid: string, @Request() req) {
    const customerId = req.user.id;
    return this.bookingService.scheduleFromBookingId(+bookingid, customerId);
  }


  @UseGuards(JWTAuthGuard)
  @Delete(':bookingid')
  async requestCancel(@Param('bookingid') bookingid: string, @Request() req) {
    const customerId = req.user.id;
    return this.bookingService.requestCancel(+bookingid, +customerId);
  }
}
