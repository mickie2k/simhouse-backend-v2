import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { CreateSimulatorDto } from './dto/create-simulator.dto';
import { UpdateSimulatorDto } from './dto/update-simulator.dto';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post()
  create(@Body() createSimulatorDto: CreateSimulatorDto) {
    return this.simulatorService.create(createSimulatorDto);
  }

  @Get()
  findAll() {
    return this.simulatorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simulatorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSimulatorDto: UpdateSimulatorDto) {
    return this.simulatorService.update(+id, updateSimulatorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simulatorService.remove(+id);
  }
}
