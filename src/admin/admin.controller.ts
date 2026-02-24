import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiCookieAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminRoleGuard, AdminRoles } from './guards/admin-role.guard';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { AdminReportQueryDto } from './dto/admin-report-query.dto';
import { AdminActionDto } from './dto/admin-action.dto';
import { UserStatus } from './dto/user-status.enum';
import { AdminRole } from 'src/generated/prisma/enums';

@ApiTags('admin')
@ApiCookieAuth('admin_access_token')
@Controller('admin')
@UseGuards(AdminGuard, AdminRoleGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @ApiOperation({ summary: 'List all customers' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
    @Get('users')
    listUsers(@Query() query: AdminUserQueryDto) {
        return this.adminService.listUsers(query);
    }

    @ApiOperation({ summary: 'List all hosts' })
    @ApiResponse({ status: 200, description: 'Hosts retrieved successfully.' })
    @Get('hosts')
    listHosts(@Query() query: AdminUserQueryDto) {
        return this.adminService.listHosts(query);
    }

    @ApiOperation({ summary: 'List admins (Super admin only)' })
    @ApiResponse({ status: 200, description: 'Admins retrieved successfully.' })
    @AdminRoles(AdminRole.SUPER_ADMIN)
    @Get('admins')
    listAdmins(@Query() query: AdminUserQueryDto) {
        return this.adminService.listAdmins(query);
    }

    @ApiOperation({ summary: 'Approve user account' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User approved successfully.' })
    @Patch('user/:id/approve')
    approveUser(@Param('id') id: string) {
        return this.adminService.updateUserStatus(+id, UserStatus.ACTIVE);
    }

    @ApiOperation({ summary: 'Suspend user account' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User suspended successfully.' })
    @Patch('user/:id/suspend')
    suspendUser(@Param('id') id: string, @Body() action: AdminActionDto) {
        return this.adminService.updateUserStatus(
            +id,
            UserStatus.SUSPENDED,
            action.reason,
        );
    }

    @ApiOperation({ summary: 'Activate suspended user account' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({ status: 200, description: 'User activated successfully.' })
    @Patch('user/:id/activate')
    activateUser(@Param('id') id: string) {
        return this.adminService.updateUserStatus(+id, UserStatus.ACTIVE);
    }

    @ApiOperation({ summary: 'Approve host account' })
    @ApiParam({ name: 'id', description: 'Host ID' })
    @ApiResponse({ status: 200, description: 'Host approved successfully.' })
    @Patch('host/:id/approve')
    approveHost(@Param('id') id: string) {
        return this.adminService.updateHostStatus(+id, UserStatus.ACTIVE);
    }

    @ApiOperation({ summary: 'Suspend host account' })
    @ApiParam({ name: 'id', description: 'Host ID' })
    @ApiResponse({ status: 200, description: 'Host suspended successfully.' })
    @Patch('host/:id/suspend')
    suspendHost(@Param('id') id: string, @Body() action: AdminActionDto) {
        return this.adminService.updateHostStatus(
            +id,
            UserStatus.SUSPENDED,
            action.reason,
        );
    }

    @ApiOperation({ summary: 'Activate suspended host account' })
    @ApiParam({ name: 'id', description: 'Host ID' })
    @ApiResponse({ status: 200, description: 'Host activated successfully.' })
    @Patch('host/:id/activate')
    activateHost(@Param('id') id: string) {
        return this.adminService.updateHostStatus(+id, UserStatus.ACTIVE);
    }

    @ApiOperation({ summary: 'Get all reports' })
    @ApiResponse({
        status: 200,
        description: 'Reports retrieved successfully.',
    })
    @Get('reports')
    listReports(@Query() query: AdminReportQueryDto) {
        return this.adminService.listReports(query);
    }

    @ApiOperation({ summary: 'Get report by id' })
    @ApiParam({ name: 'id', description: 'Report ID' })
    @ApiResponse({ status: 200, description: 'Report retrieved successfully.' })
    @Get('reports/:id')
    getReport(@Param('id') id: string) {
        return this.adminService.getReportById(+id);
    }

    @ApiOperation({ summary: 'Resolve report' })
    @ApiParam({ name: 'id', description: 'Report ID' })
    @ApiResponse({ status: 200, description: 'Report resolved successfully.' })
    @Patch('reports/:id/resolve')
    resolveReport(@Param('id') id: string, @Body() action: AdminActionDto) {
        return this.adminService.resolveReport(+id, action);
    }

    @ApiOperation({ summary: 'Get platform statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved.' })
    @Get('statistics')
    getStatistics() {
        return this.adminService.getStatistics();
    }

    @ApiOperation({ summary: 'View all bookings' })
    @ApiResponse({
        status: 200,
        description: 'Bookings retrieved successfully.',
    })
    @Get('bookings')
    getBookings(@Query() query: AdminUserQueryDto) {
        return this.adminService.getBookings(query);
    }

    @ApiOperation({ summary: 'Remove simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID' })
    @ApiResponse({
        status: 200,
        description: 'Simulator removed successfully.',
    })
    @Delete('simulator/:id')
    deleteSimulator(@Param('id') id: string) {
        return this.adminService.deleteSimulator(+id);
    }

    @ApiOperation({ summary: 'Deactivate admin (Super admin only)' })
    @ApiParam({ name: 'id', description: 'Admin ID' })
    @ApiResponse({ status: 200, description: 'Admin updated successfully.' })
    @AdminRoles(AdminRole.SUPER_ADMIN)
    @Patch('admins/:id/deactivate')
    deactivateAdmin(@Param('id') id: string) {
        return this.adminService.setAdminStatus(+id, false);
    }

    @ApiOperation({ summary: 'Activate admin (Super admin only)' })
    @ApiParam({ name: 'id', description: 'Admin ID' })
    @ApiResponse({ status: 200, description: 'Admin updated successfully.' })
    @AdminRoles(AdminRole.SUPER_ADMIN)
    @Patch('admins/:id/activate')
    activateAdmin(@Param('id') id: string) {
        return this.adminService.setAdminStatus(+id, true);
    }

    @ApiOperation({ summary: 'Update admin role (Super admin only)' })
    @ApiParam({ name: 'id', description: 'Admin ID' })
    @ApiResponse({
        status: 200,
        description: 'Admin role updated successfully.',
    })
    @AdminRoles(AdminRole.SUPER_ADMIN)
    @Patch('admins/:id/role/:role')
    updateAdminRole(@Param('id') id: string, @Param('role') role: AdminRole) {
        return this.adminService.updateAdminRole(+id, role);
    }
}
