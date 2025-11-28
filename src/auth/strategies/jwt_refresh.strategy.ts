import { Injectable } from "@nestjs/common";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh'){
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (request) => {
                  return request?.cookies?.refresh_token; // Ensure this points to the correct cookie
                },
              ]),
            ignoreExpiration: false,
            secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET') || '',
        });
      }

    async validate(payload : any){
        console.log(payload)
        return { id: payload.sub, email: payload.email, role: payload.role };
    }
}