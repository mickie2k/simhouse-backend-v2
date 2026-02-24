import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AdminJwtRefreshAuthGuard extends AuthGuard('admin-jwt-refresh') {}
