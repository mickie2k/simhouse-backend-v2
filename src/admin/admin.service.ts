import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { AdminRole } from 'src/generated/prisma/enums';
import { UserStatus } from './dto/user-status.enum';
import { ReportStatus } from './dto/report-status.enum';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) {}

    async listUsers(query: AdminUserQueryDto) {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = query.limit ?? DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            status: query.status ?? undefined,
            OR: query.search
                ? [
                      {
                          email: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                      {
                          username: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                  ]
                : undefined,
        };

        const userSortFields = new Set(['id', 'email', 'username']);
        const orderBy: Prisma.UserOrderByWithRelationInput =
            query.sortBy && userSortFields.has(query.sortBy)
                ? { [query.sortBy]: query.sortOrder ?? 'desc' }
                : { id: Prisma.SortOrder.desc };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    profileImageUrl: true,
                    status: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async listHosts(query: AdminUserQueryDto) {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = query.limit ?? DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const where: Prisma.HostWhereInput = {
            status: query.status ?? undefined,
            OR: query.search
                ? [
                      {
                          email: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                      {
                          username: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                  ]
                : undefined,
        };

        const hostSortFields = new Set(['id', 'email', 'username']);
        const orderBy: Prisma.HostOrderByWithRelationInput =
            query.sortBy && hostSortFields.has(query.sortBy)
                ? { [query.sortBy]: query.sortOrder ?? 'desc' }
                : { id: Prisma.SortOrder.desc };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.host.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    profileImageUrl: true,
                    status: true,
                },
            }),
            this.prisma.host.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async listAdmins(query: AdminUserQueryDto) {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = query.limit ?? DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const where: Prisma.AdminWhereInput = {
            role: query.adminRole ?? undefined,
            OR: query.search
                ? [
                      {
                          email: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                      {
                          username: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                  ]
                : undefined,
        };

        const adminSortFields = new Set([
            'id',
            'email',
            'username',
            'createdAt',
        ]);
        const orderBy: Prisma.AdminOrderByWithRelationInput =
            query.sortBy && adminSortFields.has(query.sortBy)
                ? { [query.sortBy]: query.sortOrder ?? 'desc' }
                : { id: Prisma.SortOrder.desc };

        const [items, total] = await this.prisma.$transaction([
            this.prisma.admin.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                },
            }),
            this.prisma.admin.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async updateUserStatus(id: number, status: UserStatus, reason?: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.status === status) {
            throw new BadRequestException('User status already set');
        }
        await this.prisma.user.update({
            where: { id },
            data: { status },
        });
        return { message: 'User status updated', reason };
    }

    async updateHostStatus(id: number, status: UserStatus, reason?: string) {
        const host = await this.prisma.host.findUnique({ where: { id } });
        if (!host) {
            throw new NotFoundException('Host not found');
        }
        if (host.status === status) {
            throw new BadRequestException('Host status already set');
        }
        await this.prisma.host.update({
            where: { id },
            data: { status },
        });
        return { message: 'Host status updated', reason };
    }

    async listReports(query: AdminReportQueryDto) {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = query.limit ?? DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const where: Prisma.ReportWhereInput = {
            status: query.status ?? undefined,
            reportedType: query.reportedType ?? undefined,
            OR: query.search
                ? [
                      {
                          reason: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                      {
                          adminNote: {
                              contains: query.search,
                              mode: 'insensitive',
                          },
                      },
                  ]
                : undefined,
        };

        const orderBy = {
            createdAt: query.sortOrder ?? 'desc',
        } as Prisma.ReportOrderByWithRelationInput;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.report.findMany({
                where,
                skip,
                take: limit,
                orderBy,
            }),
            this.prisma.report.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async getReportById(id: number) {
        const report = await this.prisma.report.findUnique({ where: { id } });
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        return report;
    }

    async resolveReport(id: number, action: AdminActionDto) {
        const report = await this.prisma.report.findUnique({ where: { id } });
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        if (report.status === ReportStatus.RESOLVED) {
            throw new BadRequestException('Report already resolved');
        }
        return this.prisma.report.update({
            where: { id },
            data: {
                status: ReportStatus.RESOLVED,
                adminNote: action.reason,
                resolvedAt: new Date(),
            },
        });
    }

    async updateReportStatus(id: number, status: ReportStatus) {
        const report = await this.prisma.report.findUnique({ where: { id } });
        if (!report) {
            throw new NotFoundException('Report not found');
        }
        return this.prisma.report.update({
            where: { id },
            data: { status },
        });
    }

    async getStatistics() {
        const [
            totalCustomers,
            totalHosts,
            totalSimulators,
            totalBookings,
            totalReports,
        ] = await this.prisma.$transaction([
            this.prisma.user.count(),
            this.prisma.host.count(),
            this.prisma.simulator.count(),
            this.prisma.booking.count(),
            this.prisma.report.count(),
        ]);

        return {
            totalCustomers,
            totalHosts,
            totalSimulators,
            totalBookings,
            totalReports,
        };
    }

    async getBookings(query: AdminUserQueryDto) {
        const page = query.page ?? DEFAULT_PAGE;
        const limit = query.limit ?? DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const [items, total] = await this.prisma.$transaction([
            this.prisma.booking.findMany({
                skip,
                take: limit,
                orderBy: { bookingDate: 'desc' },
                include: {
                    customer: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                    simulator: {
                        select: {
                            id: true,
                            simListName: true,
                            hostId: true,
                        },
                    },
                    bookingStatus: true,
                },
            }),
            this.prisma.booking.count(),
        ]);

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async deleteSimulator(id: number) {
        const simulator = await this.prisma.simulator.findUnique({
            where: { id },
        });
        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }
        await this.prisma.simulator.delete({ where: { id } });
        return { message: 'Simulator removed' };
    }

    async setAdminStatus(id: number, isActive: boolean) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }
        if (admin.isActive === isActive) {
            throw new BadRequestException('Admin status already set');
        }
        return this.prisma.admin.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
    }

    async updateAdminRole(id: number, role: AdminRole) {
        const admin = await this.prisma.admin.findUnique({ where: { id } });
        if (!admin) {
            throw new NotFoundException('Admin not found');
        }
        return this.prisma.admin.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });
    }
}
