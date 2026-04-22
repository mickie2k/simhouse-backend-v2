import {
    IsEmail,
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description:
            'User password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
        example: 'SecurePass123!',
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
}

export class RegisterUserDto {
    @ApiProperty({
        description: 'Unique username',
        example: 'johndoe',
        minLength: 4,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    username: string;

    @ApiProperty({
        description: 'User email address',
        example: 'john.doe@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description:
            'User password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
        example: 'SecurePass123!',
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
        description: 'User first name',
        example: 'John',
    })
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @ApiProperty({
        description: 'User last name',
        example: 'Doe',
    })
    @IsNotEmpty()
    @IsString()
    lastName: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+1234567890',
    })
    @IsString()
    phone?: string;
}
