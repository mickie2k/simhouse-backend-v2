import { Test, TestingModule } from '@nestjs/testing';
import { HostAuthService } from './host-auth.service';

describe('HostAuthService', () => {
  let service: HostAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HostAuthService],
    }).compile();

    service = module.get<HostAuthService>(HostAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
