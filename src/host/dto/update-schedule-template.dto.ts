import {
    IsOptional,
    IsNumber,
    IsInt,
    Min,
    Max,
    Matches,
    IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduleTemplateDto {
    @ApiPropertyOptional({
        description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
        example: 1,
        minimum: 0,
        maximum: 6,
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(6)
    dayOfWeek?: number;

    @ApiPropertyOptional({
        description: 'Opening time in HH:mm format (24h)',
        example: '09:00',
    })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'startTime must be in HH:mm format (e.g. 09:00)',
    })
    startTime?: string;

    @ApiPropertyOptional({
        description: 'Closing time in HH:mm format (24h)',
        example: '21:00',
    })
    @IsOptional()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'endTime must be in HH:mm format (e.g. 21:00)',
    })
    endTime?: string;

    @ApiPropertyOptional({
        description: 'Price per hour slot',
        example: 200,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    pricePerHour?: number;
}
