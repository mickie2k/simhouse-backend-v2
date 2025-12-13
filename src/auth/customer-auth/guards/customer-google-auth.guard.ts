import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomerGoogleAuthGuard extends AuthGuard('customer-google') {}
