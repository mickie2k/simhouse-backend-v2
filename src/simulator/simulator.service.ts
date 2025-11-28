import { Injectable } from '@nestjs/common';
import { CreateSimulatorDto } from './dto/create-simulator.dto';
import { UpdateSimulatorDto } from './dto/update-simulator.dto';

@Injectable()
export class SimulatorService {
  create(createSimulatorDto: CreateSimulatorDto) {
    return 'This action adds a new simulator';
  }

  findAll() {
    return `This action returns all simulator`;
  }

  findOne(id: number) {
    return `This action returns a #${id} simulator`;
  }

  update(id: number, updateSimulatorDto: UpdateSimulatorDto) {
    return `This action updates a #${id} simulator`;
  }

  remove(id: number) {
    return `This action removes a #${id} simulator`;
  }
}
