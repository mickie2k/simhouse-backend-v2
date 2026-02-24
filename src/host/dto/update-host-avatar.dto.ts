import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Updates the stored avatar image URL using an uploaded S3 object key.
 */
export class UpdateHostAvatarDto {
    @ApiProperty({
        description: 'S3 object key returned from the upload URL endpoint',
        example: 'avatars/host/1/1700000000000-acde1234.jpg',
    })
    @IsNotEmpty()
    @IsString()
    objectKey: string;
}
