import {
    IsNotEmpty,
    IsNumber,
    IsPositive,
    Matches,
    IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdHocScheduleDto {
    @ApiProperty({
        description: 'Date for the slot (YYYY-MM-DD)',
        example: '2026-03-15',
    })
    @IsNotEmpty()
    @IsDateString()
    date: string;

    @ApiProperty({
        description: 'Start time in HH:mm format (24h)',
        example: '14:00',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'startTime must be in HH:mm format (e.g. 14:00)',
    })
    startTime: string;

    @ApiProperty({
        description: 'End time in HH:mm format (24h)',
        example: '15:00',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'endTime must be in HH:mm format (e.g. 15:00)',
    })
    endTime: string;

    @ApiProperty({
        description: 'Price for this slot',
        example: 300,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    price: number;
}
