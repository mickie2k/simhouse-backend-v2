import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEmail,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

/**
 * Updates basic profile fields for a customer user.
 */
export class UpdateUserProfileDto {
    @ApiPropertyOptional({ description: 'User first name', example: 'John' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    firstName?: string;

    @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(100)
    lastName?: string;

    @ApiPropertyOptional({ description: 'Unique username', example: 'johndoe' })
    @IsOptional()
    @IsString()
    @MinLength(4)
    @MaxLength(100)
    username?: string;

    @ApiPropertyOptional({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsOptional()
    @IsEmail()
    @MaxLength(255)
    email?: string;

    @ApiPropertyOptional({
        description: 'User phone number',
        example: '0812345678',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    phone?: string;
}
