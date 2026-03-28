import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import {
    ApiCookieAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { FindNearestSimulatorsDto } from './dto/find-nearest-simulators.dto';
import {
    SimulatorQueryDto,
    SimulatorSortBy,
    SortOrder,
} from './dto/simulator-query.dto';
import { HostJwtAuthGuard } from '../auth/host-auth/guards/host-jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import { AuthenticatedHost } from '../auth/types/authenticated-host.type';

@ApiTags('simulator')
@Controller('simulator')
export class SimulatorController {
    constructor(private readonly simulatorService: SimulatorService) {}

    @ApiOperation({ summary: 'Get all simulators' })
    @ApiResponse({
        status: 200,
        description: 'Simulators retrieved successfully limit 10',
    })
    @Get()
    findAll() {
        return this.simulatorService.findAll();
    }

    @ApiOperation({ summary: 'Get all simulators' })
    @ApiQuery({
        name: 'page',
        type: Number,
        required: false,
        description: 'Page number (1-indexed, default: 1)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
        description: 'Items per page (1-100, default: 10)',
        example: 10,
    })
    @ApiQuery({
        name: 'search',
        type: String,
        required: false,
        description:
            'Case-insensitive text search across simulator name, description, and address',
        example: 'racing cockpit',
    })
    @ApiQuery({
        name: 'minPrice',
        type: Number,
        required: false,
        description: 'Minimum price per hour filter',
        example: 100,
    })
    @ApiQuery({
        name: 'maxPrice',
        type: Number,
        required: false,
        description: 'Maximum price per hour filter',
        example: 500,
    })
    @ApiQuery({
        name: 'simTypeIds',
        type: String,
        required: false,
        description:
            'Filter by simulator type IDs (comma-separated, e.g. 1,2,3)',
        example: '1,2',
    })
    @ApiQuery({
        name: 'sortBy',
        enum: SimulatorSortBy,
        required: false,
        description: 'Field to sort by',
    })
    @ApiQuery({
        name: 'sortOrder',
        enum: SortOrder,
        required: false,
        description: 'Sort direction',
    })
    @ApiResponse({
        status: 200,
        description:
            'Simulators retrieved successfully with pagination metadata.',
    })
    @Get('search')
    find(@Query() query: SimulatorQueryDto) {
        return this.simulatorService.find(query);
    }

    @ApiOperation({ summary: 'Find nearest simulators within radius (km)' })
    @ApiQuery({
        name: 'lat',
        type: Number,
        required: true,
        description: 'Latitude of the search origin',
        example: 13.7563,
    })
    @ApiQuery({
        name: 'lng',
        type: Number,
        required: true,
        description: 'Longitude of the search origin',
        example: 100.5018,
    })
    @ApiQuery({
        name: 'radiusKm',
        type: Number,
        required: true,
        description: 'Search radius in kilometers',
        example: 10,
    })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
        description: 'Max results to return (1-100, default: 20)',
        example: 20,
    })
    @ApiQuery({
        name: 'minPrice',
        type: Number,
        required: false,
        description: 'Minimum price per hour filter',
        example: 100,
    })
    @ApiQuery({
        name: 'maxPrice',
        type: Number,
        required: false,
        description: 'Maximum price per hour filter',
        example: 500,
    })
    @ApiQuery({
        name: 'simTypeIds',
        type: String,
        required: false,
        description:
            'Filter by simulator type IDs (comma-separated, e.g. 1,2,3)',
        example: '1,2',
    })
    @ApiResponse({
        status: 200,
        description: 'Nearest simulators retrieved, ordered by distance.',
    })
    @Get('nearest')
    findNearestLocation(@Query() query: FindNearestSimulatorsDto) {
        return this.simulatorService.findNearestLocation(query);
    }

    @ApiOperation({ summary: 'Get available schedule slots for a simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiQuery({
        name: 'startDate',
        required: false,
        description: 'Start date (YYYY-MM-DD)',
    })
    @ApiQuery({
        name: 'endDate',
        required: false,
        description: 'End date (YYYY-MM-DD)',
    })
    @ApiResponse({ status: 200, description: 'Available slots returned.' })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @Get(':id/schedule')
    async getAvailableSlots(
        @Param('id') id: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return await this.simulatorService.getAvailableSlots(
            +id,
            startDate,
            endDate,
        );
    }

    @Get(':id/review')
    async getSimulatorReview(@Param('id') id: string) {
        return await this.simulatorService.getSimulatorReview(+id);
    }

    @ApiOperation({ summary: 'Get all simulator brands' })
    @ApiResponse({
        status: 200,
        description: 'Simulator brands retrieved successfully.',
    })
    @Get('brands/list')
    async getBrands() {
        return await this.simulatorService.getAllSimulatorBrands();
    }

    @ApiOperation({ summary: 'Get simulator models' })
    @ApiQuery({
        name: 'brandId',
        type: Number,
        required: false,
        description: 'Filter models by brand ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Simulator models retrieved successfully.',
    })
    @Get('models/list')
    async getModels(@Query('brandId') brandId?: string) {
        return await this.simulatorService.getSimulatorModels(
            brandId ? +brandId : undefined,
        );
    }

    @ApiOperation({ summary: 'Get all pedals' })
    @ApiQuery({
        name: 'brandId',
        type: Number,
        required: false,
        description: 'Filter pedals by brand ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Pedals retrieved successfully.',
    })
    @Get('pedals/list')
    async getPedals(@Query('brandId') brandId?: string) {
        return await this.simulatorService.getAllPedals(
            brandId ? +brandId : undefined,
        );
    }

    @ApiOperation({ summary: 'Get all simulator types' })
    @ApiResponse({
        status: 200,
        description: 'Simulator types retrieved successfully.',
    })
    @Get('types/list')
    async getSimulatorTypes() {
        return await this.simulatorService.getAllSimulatorTypes();
    }

    @ApiOperation({ summary: 'Get a simulator by ID' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiResponse({ status: 200, description: 'Simulator found.' })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.simulatorService.findOne(+id);
    }

    @ApiOperation({ summary: 'Delete a simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Simulator deleted successfully.',
    })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @ApiCookieAuth('access_token')
    @UseGuards(HostJwtAuthGuard)
    @Delete(':id')
    remove(
        @Param('id') id: string,
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ) {
        return this.simulatorService.remove(+id, req.user.id);
    }
}
