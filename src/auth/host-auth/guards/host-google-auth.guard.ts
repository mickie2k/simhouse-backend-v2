import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class HostGoogleAuthGuard extends AuthGuard('host-google') {}
