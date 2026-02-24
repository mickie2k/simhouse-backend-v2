import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

/**
 * Requests a pre-signed S3 upload URL for a user avatar image.
 */
export class CreateUserAvatarUploadDto {
    @ApiProperty({
        description: 'MIME type of the image to upload',
        example: 'image/jpeg',
        enum: ['image/jpeg', 'image/png', 'image/webp'],
    })
    @IsNotEmpty()
    @IsString()
    @IsIn(['image/jpeg', 'image/png', 'image/webp'])
    contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}
