import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { AdminPaginationDto } from './admin-pagination.dto';
import { ReportStatus } from './report-status.enum';
import { ReportedType } from './reported-type.enum';

export class AdminReportQueryDto extends AdminPaginationDto {
    @ApiPropertyOptional({
        description: 'Filter by report status',
        enum: ReportStatus,
        example: ReportStatus.PENDING,
    })
    @IsOptional()
    @IsEnum(ReportStatus)
    status?: ReportStatus;

    @ApiPropertyOptional({
        description: 'Filter by reported entity type',
        enum: ReportedType,
        example: ReportedType.USER,
    })
    @IsOptional()
    @IsEnum(ReportedType)
    reportedType?: ReportedType;

    @ApiPropertyOptional({
        description: 'Search by reason or admin note',
        example: 'spam',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Sort order (asc or desc)',
        example: 'desc',
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
}
