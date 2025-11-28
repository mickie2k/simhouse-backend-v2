import { Injectable } from '@nestjs/common';
import { CreateHostAuthDto } from './dto/create-host-auth.dto';
import { UpdateHostAuthDto } from './dto/update-host-auth.dto';

@Injectable()
export class HostAuthService {
  create(createHostAuthDto: CreateHostAuthDto) {
    return 'This action adds a new hostAuth';
  }

  findAll() {
    return `This action returns all hostAuth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} hostAuth`;
  }

  update(id: number, updateHostAuthDto: UpdateHostAuthDto) {
    return `This action updates a #${id} hostAuth`;
  }

  remove(id: number) {
    return `This action removes a #${id} hostAuth`;
  }
}
