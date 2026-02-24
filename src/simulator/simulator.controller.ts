import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Query,
    Request,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { UpdateSimulatorDto } from './dto/update-simulator.dto';
import {
    ApiBody,
    ApiConsumes,
    ApiCookieAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { FindNearestSimulatorsDto } from './dto/find-nearest-simulators.dto';
import { HostJwtAuthGuard } from '../auth/host-auth/guards/host-jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import { AuthenticatedHost } from '../auth/types/authenticated-host.type';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

interface MulterFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
}

@ApiTags('simulator')
@Controller('simulator')
export class SimulatorController {
    constructor(private readonly simulatorService: SimulatorService) {}

    @ApiOperation({ summary: 'Get all simulators' })
    @ApiResponse({
        status: 200,
        description: 'Simulators retrieved successfully.',
    })
    @Get()
    findAll() {
        return this.simulatorService.findAll();
    }

    @ApiOperation({ summary: 'Find nearest simulators within radius (km)' })
    @ApiQuery({ name: 'lat', type: Number, required: true })
    @ApiQuery({ name: 'lng', type: Number, required: true })
    @ApiQuery({ name: 'radiusKm', type: Number, required: true })
    @ApiQuery({ name: 'limit', type: Number, required: false })
    @ApiResponse({ status: 200, description: 'Nearest simulators retrieved.' })
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

    @ApiOperation({ summary: 'Update a simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Simulator updated successfully.',
    })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @ApiCookieAuth('access_token')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                simlistname: { type: 'string', example: 'Updated Simulator' },
                listdescription: {
                    type: 'string',
                    example: 'Updated simulator description',
                },
                simtypeid: {
                    type: 'array',
                    items: { type: 'number' },
                    example: [1],
                },
                priceperhour: { type: 'number', example: 200 },
                modid: { type: 'number', example: 1 },
                addressdetail: { type: 'string', example: '123 Racing St' },
                latitude: { type: 'number', example: 13.7563 },
                longitude: { type: 'number', example: 100.5018 },
                file1: { type: 'string', format: 'binary' },
                file2: { type: 'string', format: 'binary' },
                file3: { type: 'string', format: 'binary' },
            },
        },
    })
    @UseGuards(HostJwtAuthGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'file1', maxCount: 1 },
            { name: 'file2', maxCount: 1 },
            { name: 'file3', maxCount: 1 },
        ]),
    )
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateSimulatorDto: UpdateSimulatorDto,
        @UploadedFiles()
        files: {
            file1?: MulterFile[];
            file2?: MulterFile[];
            file3?: MulterFile[];
        },
        @Request() req: ExpressRequest & { user: AuthenticatedHost },
    ) {
        return this.simulatorService.update(
            +id,
            updateSimulatorDto,
            files,
            req.user.id,
        );
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
