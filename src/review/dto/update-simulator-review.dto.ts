import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { ReviewDetailDto } from './create-simulator-review.dto';

export class UpdateSimulatorReviewDto {
    @ApiPropertyOptional({
        description: 'Overall rating for the simulator (1-5 stars)',
        minimum: 1,
        maximum: 5,
        example: 4,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(5)
    overallRating?: number;

    @ApiPropertyOptional({
        description: 'Review comment/feedback',
        maxLength: 1000,
        example: 'Updated review comment',
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
