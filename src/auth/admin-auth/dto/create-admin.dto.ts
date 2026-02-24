import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsString,
    IsStrongPassword,
    MinLength,
} from 'class-validator';
import { AdminRole } from 'src/generated/prisma/enums';

export class CreateAdminDto {
    @ApiProperty({
        description: 'Admin username',
        example: 'adminuser',
        minLength: 4,
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(4)
    username: string;

    @ApiProperty({
        description: 'Admin email address',
        example: 'admin@example.com',
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description:
            'Admin password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
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
        description: 'Admin role',
        enum: AdminRole,
        example: AdminRole.MODERATOR,
    })
    @IsNotEmpty()
    @IsEnum(AdminRole)
    role: AdminRole = AdminRole.MODERATOR;
}
