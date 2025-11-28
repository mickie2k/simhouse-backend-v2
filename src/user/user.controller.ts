import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, FindUserDto } from './dto/user.dto';
import { JWTAuthGuard } from 'src/auth/guards/jwt_auth.guard';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/role.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';


@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Post()
    createUser(@Body() data: CreateUserDto){
        return this.userService.createUser(data);

    }

    @Roles(Role.ADMIN)
    @UseGuards(JWTAuthGuard, RolesGuard)
    @Get('email')
    findUserByEmail(@Body() data: FindUserDto){
        return this.userService.findUser(data);
    }
    

    @Roles(Role.ADMIN)
    @UseGuards(JWTAuthGuard, RolesGuard)
    @Get('all')
    findAllUsers(){
        return { message: "u are admin" };
    }

    @UseGuards(JWTAuthGuard)
    @Get('username')
    getUser(@Request() req){
        return this.userService.getUsername(req.user);
    }

    




}
