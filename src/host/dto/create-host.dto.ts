import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    MaxLength,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHostDto {
    @ApiProperty({
        description: 'Unique username',
        example: 'hostuser',
        minLength: 4,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    @MaxLength(100)
    username: string;

    @ApiProperty({
        description: 'Host email address',
        example: 'host@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    @MaxLength(255)
    email: string;

    @ApiProperty({
        description:
            'Host password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
        example: 'Password123!',
        minLength: 8,
    })
    @IsNotEmpty()
    @IsStrongPassword({
        minLength: 8,
        minUppercase: 1,
        minLowercase: 1,
        minNumbers: 1,
        minSymbols: 1,
    })
    password: string;

    @ApiProperty({
        description: 'Host first name',
        example: 'John',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    firstName: string;

    @ApiProperty({
        description: 'Host last name',
        example: 'Doe',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    lastName: string;

    @ApiProperty({
        description: 'Host phone number',
        example: '1234567890',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(10)
    phone: string;
}
