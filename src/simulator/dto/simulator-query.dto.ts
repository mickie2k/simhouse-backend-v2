import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
    IsArray,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum SimulatorSortBy {
    ID = 'id',
    PRICE = 'pricePerHour',
    NAME = 'simListName',
}

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export class SimulatorQueryDto extends PaginationDto {
    @ApiPropertyOptional({
        description:
            'Case-insensitive text search across simulator name, description, and address',
        example: 'racing cockpit',
    })
    @IsOptional()
    @Transform(({ value }: { value: string }) => value?.trim())
    @IsString()
    search?: string;

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

    @ApiPropertyOptional({
        description: 'Field to sort by',
        enum: SimulatorSortBy,
        default: SimulatorSortBy.ID,
        example: SimulatorSortBy.ID,
    })
    @IsOptional()
    @IsEnum(SimulatorSortBy)
    sortBy?: SimulatorSortBy = SimulatorSortBy.ID;

    @ApiPropertyOptional({
        description: 'Sort direction',
        enum: SortOrder,
        default: SortOrder.ASC,
        example: SortOrder.ASC,
    })
    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.ASC;
}
