import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsString,
    IsOptional,
    Min,
    Max,
    MaxLength,
} from 'class-validator';

export class CreateCustomerReviewDto {
    @ApiProperty({
        description: 'Booking ID for which the review is being created',
        example: 1,
    })
    @IsInt()
    bookingId: number;

    @ApiProperty({
        description: 'Rating for the customer (1-5 stars)',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        description: 'Review comment about the customer',
        example: 'Great customer, respectful and followed all rules.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comment?: string;
}
