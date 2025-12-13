import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class HostJwtRefreshAuthGuard extends AuthGuard('host-jwt-refresh') {}
