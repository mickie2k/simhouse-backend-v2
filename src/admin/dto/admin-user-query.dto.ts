import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { AdminPaginationDto } from './admin-pagination.dto';
import { AdminRole } from 'src/generated/prisma/enums';
import { UserStatus } from './user-status.enum';

export class AdminUserQueryDto extends AdminPaginationDto {
    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiPropertyOptional({
        description: 'Search by email or username',
        example: 'john',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Sort field (id, email, username, createdAt)',
        example: 'id',
    })
    @IsOptional()
    @IsString()
    @IsIn(['id', 'email', 'username', 'createdAt'])
    sortBy?: string;

    @ApiPropertyOptional({
        description: 'Sort order (asc or desc)',
        example: 'desc',
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';

    @ApiPropertyOptional({
        description: 'Filter admins by role (admin list only)',
        enum: AdminRole,
        example: AdminRole.MODERATOR,
    })
    @IsOptional()
    @Type(() => String)
    @IsEnum(AdminRole)
    adminRole?: AdminRole;
}
