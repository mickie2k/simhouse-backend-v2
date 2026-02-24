import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { UpdateSimulatorDto } from './dto/update-simulator.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

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

    @ApiOperation({ summary: 'Get a simulator by ID' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiResponse({ status: 200, description: 'Simulator found.' })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.simulatorService.findOne(+id);
    }

    @Get()
    findNearestLocation() {
        return this.simulatorService.findNearestLocation();
    }

    @ApiOperation({ summary: 'Update a simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Simulator updated successfully.',
    })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() updateSimulatorDto: UpdateSimulatorDto,
    ) {
        return this.simulatorService.update(+id, updateSimulatorDto);
    }

    @ApiOperation({ summary: 'Delete a simulator' })
    @ApiParam({ name: 'id', description: 'Simulator ID', type: 'number' })
    @ApiResponse({
        status: 200,
        description: 'Simulator deleted successfully.',
    })
    @ApiResponse({ status: 404, description: 'Simulator not found.' })
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.simulatorService.remove(+id);
    }
}
