import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsStrongPassword } from 'class-validator';

/**
 * Changes a customer's password.
 */
export class ChangeUserPasswordDto {
    @ApiProperty({
        description: 'Current password',
        example: 'CurrentPass123!',
    })
    @IsNotEmpty()
    currentPassword: string;

    @ApiProperty({
        description:
            'New password (min 8 chars, must contain uppercase, lowercase, number, and symbol)',
        example: 'NewPass123!',
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
    newPassword: string;
}
