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
    @Get()
    findAll(@Query() query: SimulatorQueryDto) {
        return this.simulatorService.findAll(query);
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
