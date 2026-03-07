import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleSlotQueryDto {
    @ApiPropertyOptional({
        description: 'Start date filter (YYYY-MM-DD)',
        example: '2026-03-07',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'End date filter (YYYY-MM-DD)',
        example: '2026-03-14',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
