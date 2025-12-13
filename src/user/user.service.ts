import { Injectable } from '@nestjs/common';
import { FindUserDto  } from './dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from 'src/auth/dto/auth.dto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }


    async createUser(data: RegisterUserDto) {
        try{
            const user = await this.prisma.user.create({
                data: data
            });
            return user;
        }catch (error) {
            console.log(error)
            throw new Error('Failed to create user');
        }
    }

    async findUser(data: FindUserDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: data.email,
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                password: true,
                email: true,
                googleId: true,
            }
        });

        if (!user) return null;

        return {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password,
            email: user.email,
            googleId: user.googleId,
        };
    }

    async findUserWithoutSSO(data: FindUserDto) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: data.email,
                password: {
                    not: null
                }
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                password: true,
                email: true,
                googleId: true,
            }
        });

        if (!user) return null;

        return {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            password: user.password,
            email: user.email,
            googleId: user.googleId,
        };
    }


    async getProfile(user : any) {
        const userRes = await this.prisma.user.findFirst({
            where: {
                id: user.id,
            },
            select: {
                username: true,
                firstName: true,
                lastName: true,
                email: true,
            }
        });

        if (!userRes) return null;

        return {
            username: userRes.username,
            firstName: userRes.firstName,
            lastName: userRes.lastName,
            email: userRes.email,
        };
    }

    async getUsername(user: any) {
        const res = await this.prisma.user.findFirst({
            where: {
                id: user.id
            },
            select: {
                username: true
            }
        });
        return {
            username: res?.username,
        };
    }
}
