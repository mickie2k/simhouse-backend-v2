import { ApiProperty } from '@nestjs/swagger';

export class HostOverviewDto {
    @ApiProperty({
        example: 12,
        description: 'Total number of pending booking requests',
    })
    pendingRequests: number;

    @ApiProperty({
        example: 4,
        description: 'Number of new pending requests',
    })
    newRequests: number;

    @ApiProperty({
        example: 8,
        description: 'Number of bookings for today',
    })
    todayBookings: number;

    @ApiProperty({
        example: 4280.5,
        description: 'Total revenue for the current month',
    })
    monthlyRevenue: number;

    @ApiProperty({
        example: 4.9,
        description: 'Average host rating from customer reviews',
    })
    rating: number;

    @ApiProperty({
        example: 42,
        description: 'Total number of reviews received',
    })
    totalReviews: number;
}
