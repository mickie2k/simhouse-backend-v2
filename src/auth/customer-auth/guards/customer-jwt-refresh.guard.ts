import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomerJwtRefreshAuthGuard extends AuthGuard('customer-jwt-refresh') {}
