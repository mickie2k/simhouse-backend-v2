import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AdminRole } from 'src/generated/prisma/enums';

export const ADMIN_ROLES_KEY = 'admin_roles';
export const AdminRoles = (...roles: AdminRole[]) =>
    SetMetadata(ADMIN_ROLES_KEY, roles);

@Injectable()
export class AdminRoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.getAllAndOverride<AdminRole[]>(
            ADMIN_ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!roles || roles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const admin = request.user as
            | { role?: string; adminRole?: AdminRole }
            | undefined;
        if (!admin?.adminRole) {
            throw new ForbiddenException('Admin role required');
        }

        if (!roles.includes(admin.adminRole)) {
            throw new ForbiddenException('Admin role required');
        }

        return true;
    }
}
