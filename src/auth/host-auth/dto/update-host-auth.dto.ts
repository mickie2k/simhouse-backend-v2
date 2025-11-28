import { PartialType } from '@nestjs/mapped-types';
import { CreateHostAuthDto } from './create-host-auth.dto';

export class UpdateHostAuthDto extends PartialType(CreateHostAuthDto) {}
