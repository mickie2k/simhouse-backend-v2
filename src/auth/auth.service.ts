import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { LoginUserDto, RegisterUserDto } from 'src/auth/dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DrizzleDB } from 'src/drizzle/types/drizzletype';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import * as schema from 'src/drizzle/schema';
import { eq } from 'drizzle-orm';
import { Response } from 'express';


@Injectable()
export class AuthService {
    private readonly secret: Buffer;
    constructor(private readonly userService: UserService,  private readonly jwtService: JwtService, @Inject(DRIZZLE) private readonly db: DrizzleDB) {
        this.secret = this.getSecret();
        
    }

    private getSecret(): Buffer {
        const secret = process.env.AUTH_SECRET;
        if (!secret) {
          throw new InternalServerErrorException('AUTH_SECRET is not defined in environment variables.');
        }
    
        // Return secret as a Buffer (base64 encoded)
        return Buffer.from(secret, 'base64');
      }
    


    async validateUser(data: LoginUserDto) {
        const {email, password} = data;

        if(!email || !password){
          throw new UnauthorizedException('Required input');
        }

        if(!password){
          throw new UnauthorizedException('Password is Invalid');
        }
          
        const user = await this.userService.findUserWithoutSSO({email: email});

        if(!user){
            throw new UnauthorizedException('Email or Password is incorrect');
        }
        
        if(user.password && await argon2.verify(user.password, password,{ secret: this.secret})){
            const {password, ...result} = user;
          return result;

        } else {
          throw new UnauthorizedException('Email or Password is incorrect');
        }
    }

    async login(user: any, res: Response, redirect:boolean = false) {

           const payload = { sub: user.id, email: user.email, role: user.role};
           
        
          const accessToken = await this.jwtService.signAsync(payload)
          const refreshToken = await this.jwtService.signAsync(payload, {
            expiresIn: process.env.JWT_REFRESH_TOKEN_EXP ?? '30d',
            secret: process.env.JWT_REFRESH_TOKEN_SECRET, // use different secret
          })
          
          const cookieAccessTokenExp = Number(process.env.COOKIE_JWT_ACCESS_TOKEN_EXP) || 1
          const cookieRefreshTokenExp = Number(process.env.COOKIE_JWT_REFRESH_TOKEN_EXP) || 30

            res.cookie('access_token', accessToken , {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + cookieAccessTokenExp *  1000 * 60 * 60)
            })

            res.cookie('refresh_token', refreshToken , {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: new Date(Date.now() + cookieRefreshTokenExp * 1000 * 60 * 60 * 24)
            })
          
            if(redirect){
              res.redirect(process.env.FRONTEND_URL + '/user');
            }else{
                return {
                  message: 'Login Successful'
              };
        
            }

        
    }

    async register(data: RegisterUserDto){
      
      if(!data.email || !data.password || !data.firstName || !data.lastName || !data.username){
            throw new BadRequestException('Required input');
        }

        if(await this.userService.findUser({email: data.email})){
            throw new ConflictException('Email already exists');
        }
        const hash = await argon2.hash(data.password,{
            secret: this.secret
            
        });
        const roleid = 2;
        const user = await this.userService.createUser({...data, password: hash, roleid});
        if(user){
          return {
            message: 'Register Successful'
        };
        }else{
          throw new InternalServerErrorException('Something went wrong');
        }
    }

    async googleLogin(req) : Promise<any>{
      if (!req.user) {
        throw new Error('Google login failed: No user information received.');
      }

      const { email, firstName, lastName, googleId } = req.user;
      const user = await this.userService.findUser({email: email});
      
      let payload = {};
      if (!user) {
        const result = await this.db.insert(schema.users).values({
          email,
          username: firstName,
          firstName,
          lastName,
          googleId,
          roleid: 2,
        }).$returningId()
        if(!result){
          throw new UnauthorizedException('Google login failed: Unable to create user');
        };
        payload = { id: result[0].id, email: email, role: "USER"};
      }else{
        if(!user.googleId){
          await this.db.update(schema.users).set({googleId}).where(eq(schema.users.id, user.id));
        }
        payload = { id: user.id, email: user.email, role: user.role};
      }

  
       
      return this.login(payload, req.res, true);
        
    }


    async logout(res: Response) {
      res.clearCookie('access_token')
      res.clearCookie('refresh_token')
      return {
        message: 'Logout Successful'
      };
    }
  }