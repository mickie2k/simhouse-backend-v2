import { Injectable } from "@nestjs/common";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => {
                  return request?.cookies?.access_token; // Ensure this points to the correct cookie
                },
              ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_SECRET') || '',
        });
      }

    async validate(payload : any){
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}