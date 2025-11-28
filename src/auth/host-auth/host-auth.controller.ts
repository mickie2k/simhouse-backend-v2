import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HostAuthService } from './host-auth.service';
import { CreateHostAuthDto } from './dto/create-host-auth.dto';
import { UpdateHostAuthDto } from './dto/update-host-auth.dto';

@Controller('host-auth')
export class HostAuthController {
  constructor(private readonly hostAuthService: HostAuthService) {}

  @Post()
  create(@Body() createHostAuthDto: CreateHostAuthDto) {
    return this.hostAuthService.create(createHostAuthDto);
  }

  @Get()
  findAll() {
    return this.hostAuthService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hostAuthService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHostAuthDto: UpdateHostAuthDto) {
    return this.hostAuthService.update(+id, updateHostAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hostAuthService.remove(+id);
  }
}
