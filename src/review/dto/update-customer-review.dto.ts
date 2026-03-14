import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsString,
    IsOptional,
    Min,
    Max,
    MaxLength,
} from 'class-validator';

export class UpdateCustomerReviewDto {
    @ApiPropertyOptional({
        description: 'Rating for the customer (1-5 stars)',
        minimum: 1,
        maximum: 5,
        example: 4,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({
        description: 'Review comment about the customer',
        example: 'Updated comment about the customer',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comment?: string;
}
