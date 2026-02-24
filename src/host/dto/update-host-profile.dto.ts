import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

/**
 * Updates basic profile fields for a host user.
 */
export class UpdateHostProfileDto {
    @ApiPropertyOptional({ description: 'Host first name', example: 'Jane' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;

    @ApiPropertyOptional({ description: 'Host last name', example: 'Doe' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;

    @ApiPropertyOptional({ description: 'Unique username', example: 'janedoe' })
    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(100)
    username?: string;

    @ApiPropertyOptional({
        description: 'Host email address',
        example: 'jane.doe@example.com',
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({
        description: 'Host phone number',
        example: '0812345678',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    phone?: string;
}
