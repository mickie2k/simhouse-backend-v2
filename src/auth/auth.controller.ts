import { Body, Controller, Get, Post, Request, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/auth.dto';

import { UserService } from 'src/user/user.service';
import { LocalAuthGuard } from 'src/auth/guards/local_auth.guard';
import { JWTAuthGuard } from './guards/jwt_auth.guard';
import { GoogleAuthGuard } from './guards/google_auth.guard';
import { Response } from 'express';
import { JWTRefreshAuthGuard } from './guards/jwt_refresh.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService, private readonly userService:UserService){}
    
    @UseGuards(LocalAuthGuard)
    @Post('/login')
    async login(@Request() req, @Res({passthrough : true}) res:Response ){
        return await this.authService.login(req.user,res);
    }

    @Post('/register')
    async register(@Body() data: RegisterUserDto){
        return this.authService.register(data);
    }

    @Get('/logout')
    @UseGuards(JWTAuthGuard)
    async logout(@Res({passthrough : true}) res:Response ){
        return await this.authService.logout(res);
    }


    @UseGuards(JWTRefreshAuthGuard)
    @Post('/refresh')
    async refresh(@Request() req, @Res({passthrough : true}) res:Response ){
        console.log('refresh token',req.user);
        return await this.authService.login(req.user,res);
    }
  

    @UseGuards(JWTAuthGuard)
    @Get('me') 
    getUser(@Request() req){
        return this.userService.getProfile(req.user);
    }

    @UseGuards(GoogleAuthGuard)
    @Get('google')
    async googleAuth(@Request() req) {
      // Initiates the Google OAuth process
    }
  
    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    async googleAuthRedirect(@Request() req, @Res({passthrough:true}) res: Response) {
        return  await this.authService.googleLogin(req);
       
    }   
    


}
