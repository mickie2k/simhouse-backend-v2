import { Injectable } from '@nestjs/common';
import { CreateHostDto } from './dto/create-host.dto';
import { UpdateHostDto } from './dto/update-host.dto';

@Injectable()
export class HostService {
  create(createHostDto: CreateHostDto) {
    return 'This action adds a new host';
  }

  findAll() {
    return `This action returns all host`;
  }

  findOne(id: number) {
    return `This action returns a #${id} host`;
  }

  update(id: number, updateHostDto: UpdateHostDto) {
    return `This action updates a #${id} host`;
  }

  remove(id: number) {
    return `This action removes a #${id} host`;
  }
}
