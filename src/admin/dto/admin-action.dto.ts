import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminActionDto {
    @ApiPropertyOptional({
        description: 'Optional reason or note for the action',
        example: 'Violation of terms',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}
