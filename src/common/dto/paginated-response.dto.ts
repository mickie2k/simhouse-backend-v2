import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
    @ApiProperty({ description: 'Total number of items', example: 100 })
    total: number;

    @ApiProperty({ description: 'Current page number', example: 1 })
    page: number;

    @ApiProperty({ description: 'Number of items per page', example: 10 })
    limit: number;

    @ApiProperty({ description: 'Total number of pages', example: 10 })
    totalPages: number;

    @ApiProperty({
        description: 'Whether there is a next page',
        example: true,
    })
    hasNextPage: boolean;

    @ApiProperty({
        description: 'Whether there is a previous page',
        example: false,
    })
    hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
    @ApiProperty({ description: 'List of items' })
    data: T[];

    @ApiProperty({ type: () => PaginationMeta })
    meta: PaginationMeta;
}

export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
): PaginatedResponseDto<T> {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}
