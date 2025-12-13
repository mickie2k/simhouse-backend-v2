import { PartialType } from '@nestjs/mapped-types';
import { CreateSimulatorDto } from '../../host/dto/create-simulator.dto';

export class UpdateSimulatorDto extends PartialType(CreateSimulatorDto) {}
