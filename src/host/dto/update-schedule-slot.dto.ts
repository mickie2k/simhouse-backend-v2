import { IsOptional, IsNumber, IsBoolean, IsPositive } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateScheduleSlotDto {
    @ApiPropertyOptional({
        description: 'Override price for this specific slot',
        example: 300,
    })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    price?: number;

    @ApiPropertyOptional({
        description: 'Set slot availability (false = blocked/unavailable)',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    available?: boolean;
}
