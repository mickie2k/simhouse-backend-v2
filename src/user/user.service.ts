import { Inject, Injectable } from '@nestjs/common';

import * as schema from 'src/drizzle/schema';
import { CreateUserDto, FindUserDto  } from './dto/user.dto';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { DrizzleDB } from 'src/drizzle/types/drizzletype';
import { eq, and, isNotNull } from 'drizzle-orm';

@Injectable()
export class UserService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }


    async createUser(data: CreateUserDto) {
        try{
            const user = await this.db.insert(schema.users).values(data);
            return user;
        }catch (error) {
            console.log(error)
            throw new Error('Failed to create user');
        }
    }

    async findUser(data: FindUserDto) {

        // const user = await this.db.query.users.findFirst({
        //     where: eq(schema.users.email, data.email),
            
        // })
        const user = await this.db.select({
            id: schema.users.id,
            username: schema.users.username,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            password: schema.users.password,
            email: schema.users.email,
            googleId: schema.users.googleId,
            role: schema.roles.name, 
        }).from(schema.users).where(
        and(
            eq(schema.users.email, data.email),
        )).innerJoin(schema.roles, eq(schema.users.roleid, schema.roles.roleid)).limit(1);
        return user[0];
    }

    async findUserWithoutSSO(data: FindUserDto) {
        const user = await this.db.select({
            id: schema.users.id,
            username: schema.users.username,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            password: schema.users.password,
            email: schema.users.email,
            googleId: schema.users.googleId,
            role: schema.roles.name, 
        }).from(schema.users).where(
        and(
            eq(schema.users.email, data.email),
            isNotNull(schema.users.password)
        )).innerJoin(schema.roles, eq(schema.users.roleid, schema.roles.roleid)).limit(1);

        return user[0];
    }


    async getProfile(user : any) {
        const userRes = await this.db.select({
            username: schema.users.username,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName,
            email: schema.users.email,
            role: schema.roles.name, 
        }).from(schema.users).where(
        and(
            eq(schema.users.id, user.id),
        )).innerJoin(schema.roles, eq(schema.users.roleid, schema.roles.roleid)).limit(1);
        return userRes[0];
    }

    async getUsername(user: any) {
        const res = await this.db.query.users.findFirst({
            where: eq(schema.users.id, user.id)
        });
        return {
            username: res?.username,
        };
    }
}

