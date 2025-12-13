import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, FindUserDto } from './dto/user.dto';
import { CustomerJwtAuthGuard } from 'src/auth/customer-auth/guards/customer-jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';


@ApiTags('user')
@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully.' })
    @ApiResponse({ status: 400, description: 'Validation failed.' })
    @Post()
    createUser(@Body() data: CreateUserDto){
        return this.userService.createUser(data);

    }

    @ApiOperation({ summary: 'Find user by email (Admin only)' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'User found.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('email')
    findUserByEmail(@Body() data: FindUserDto){
        return this.userService.findUser(data);
    }
    

    @ApiOperation({ summary: 'Get all users (Admin only)' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('all')
    findAllUsers(){
        return { message: "u are admin" };
    }

    @ApiOperation({ summary: 'Get current user username' })
    @ApiCookieAuth('access_token')
    @ApiResponse({ status: 200, description: 'Username retrieved successfully.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @UseGuards(CustomerJwtAuthGuard)
    @Get('username')
    getUser(@Request() req){
        return this.userService.getUsername(req.user);
    }

    




}
