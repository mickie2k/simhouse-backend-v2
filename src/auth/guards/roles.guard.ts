import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {

  constructor(private readonly reflector:Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean{
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const user = context.switchToHttp().getRequest().user;
  
    const hasRole = requiredRoles.some((role)=>user.role === role);

    return hasRole;
   
  }
}
