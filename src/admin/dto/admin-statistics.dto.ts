import { ApiProperty } from '@nestjs/swagger';

export class AdminStatisticsDto {
    @ApiProperty({ description: 'Total number of customers' })
    totalCustomers: number;

    @ApiProperty({ description: 'Total number of hosts' })
    totalHosts: number;

    @ApiProperty({ description: 'Total number of simulators' })
    totalSimulators: number;

    @ApiProperty({ description: 'Total number of bookings' })
    totalBookings: number;

    @ApiProperty({ description: 'Total number of reports' })
    totalReports: number;
}
