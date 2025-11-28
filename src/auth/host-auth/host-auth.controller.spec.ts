import { Test, TestingModule } from '@nestjs/testing';
import { HostAuthController } from './host-auth.controller';
import { HostAuthService } from './host-auth.service';

describe('HostAuthController', () => {
  let controller: HostAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HostAuthController],
      providers: [HostAuthService],
    }).compile();

    controller = module.get<HostAuthController>(HostAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
