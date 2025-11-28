import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy , VerifyCallback } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get('GOOGLE_CLIENT_ID') ?? '',
            clientSecret: configService.get('GOOGLE_CLIENT_SECRET') ?? '',
            callbackURL: configService.get('GOOGLE_CALLBACK_URL') ?? '',
            scope: ['email', 'profile'],
        });
        console.log("Callback :" + configService.get('GOOGLE_CALLBACK_URL'))
      }

      async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
      ): Promise<any> {
        console.log(profile)
        const { id, emails, photos } = profile;
        const { givenName, familyName } = profile.name || {}; // Add a fallback to an empty object

        const user = {
          googleId: id,
          email: emails[0].value,
          firstName: givenName,
          lastName: familyName,
          picture: photos[0].value,
          accessToken,
          refreshToken,
        };

       
        done(null, user);
      }
}