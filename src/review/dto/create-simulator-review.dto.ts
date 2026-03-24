import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsInt,
    IsString,
    IsOptional,
    Min,
    Max,
    MaxLength,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewDetailDto {
    @ApiProperty({
        description: 'Review type ID',
        example: 1,
    })
    @IsInt()
    typeId: number;

    @ApiProperty({
        description: 'Rating for this specific aspect (1-5)',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;
}

export class CreateSimulatorReviewDto {
    @ApiProperty({
        description: 'Overall rating for the simulator (1-5 stars)',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @IsInt()
    @Min(1)
    @Max(5)
    overallRating: number;

    @ApiPropertyOptional({
        description: 'Review comment/feedback',
        maxLength: 1000,
        example: 'Great simulator! Very realistic and well-maintained.',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    comment?: string;

    @ApiPropertyOptional({
        description: 'Detailed ratings by category',
        type: [ReviewDetailDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReviewDetailDto)
    reviewDetails?: ReviewDetailDto[];
}
