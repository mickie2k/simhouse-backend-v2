import {
    IsNotEmpty,
    IsNumber,
    IsInt,
    Min,
    Max,
    IsArray,
    ArrayNotEmpty,
    Matches,
    IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleTemplateDto {
    @ApiProperty({
        description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
        example: 1,
        minimum: 0,
        maximum: 6,
    })
    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek: number;

    @ApiProperty({
        description: 'Opening time in HH:mm format (24h)',
        example: '09:00',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'startTime must be in HH:mm format (e.g. 09:00)',
    })
    startTime: string;

    @ApiProperty({
        description: 'Closing time in HH:mm format (24h)',
        example: '21:00',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'endTime must be in HH:mm format (e.g. 21:00)',
    })
    endTime: string;

    @ApiProperty({
        description: 'Price per hour slot',
        example: 200,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    pricePerHour: number;
}

export class BulkCreateScheduleTemplateDto {
    @ApiProperty({
        description: 'Days of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
        example: [1, 2, 3, 4, 5],
        type: [Number],
    })
    @IsNotEmpty()
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    @Min(0, { each: true })
    @Max(6, { each: true })
    daysOfWeek: number[];

    @ApiProperty({
        description: 'Opening time in HH:mm format (24h)',
        example: '09:00',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'startTime must be in HH:mm format (e.g. 09:00)',
    })
    startTime: string;

    @ApiProperty({
        description: 'Closing time in HH:mm format (24h)',
        example: '21:00',
    })
    @IsNotEmpty()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'endTime must be in HH:mm format (e.g. 21:00)',
    })
    endTime: string;

    @ApiProperty({
        description: 'Price per hour slot',
        example: 200,
    })
    @IsNotEmpty()
    @IsNumber()
    @IsPositive()
    pricePerHour: number;
}
