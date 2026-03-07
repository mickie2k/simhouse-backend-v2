import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Max,
    Min,
} from 'class-validator';

export class FindNearestSimulatorsDto {
    @ApiProperty({
        description: 'Latitude of the search origin',
        example: 13.7563,
        minimum: -90,
        maximum: 90,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    lat: number;

    @ApiProperty({
        description: 'Longitude of the search origin',
        example: 100.5018,
        minimum: -180,
        maximum: 180,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    lng: number;

    @ApiProperty({
        description: 'Search radius in kilometers',
        example: 10,
        minimum: 0,
    })
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    radiusKm: number;

    @ApiPropertyOptional({
        description:
            'Max number of simulators to return (default: 20, max: 100)',
        example: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiPropertyOptional({
        description: 'Minimum price per hour filter',
        minimum: 0,
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({
        description: 'Maximum price per hour filter',
        minimum: 0,
        example: 500,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description:
            'Filter by simulator type IDs (comma-separated, e.g. 1,2,3)',
        example: '1,2',
        type: String,
    })
    @IsOptional()
    @Transform(({ value }: { value: string }) =>
        String(value)
            .split(',')
            .map((v) => parseInt(v.trim(), 10))
            .filter((n) => !isNaN(n)),
    )
    @IsArray()
    @IsInt({ each: true })
    simTypeIds?: number[];
}
