import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterUserDto } from 'src/auth/dto/auth.dto';
import { StorageService } from 'src/storage/storage.service';
import { FindUserDto } from './dto/find-user.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { ChangeUserPasswordDto } from './dto/change-user-password.dto';
import * as argon2 from 'argon2';
import { AuthenticatedCustomer } from 'src/auth/types/authenticated-customer.type';
import { UserProfileResponse } from './interfaces/user-profile-response.interface';
import { UserUpdateFields } from './interfaces/user-update-fields.interface';

@Injectable()
/**
 * Provides customer account and profile operations.
 */
export class UserService {
    private readonly secret: Buffer;

    /**
     * Initializes user profile management and hashing utilities.
     */
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly storageService: StorageService,
    ) {
        this.secret = this.getSecret();
    }

    async createUser(data: RegisterUserDto) {
        try {
            const user = await this.prisma.user.create({
                data: data,
            });
            return user;
        } catch (error) {
            console.log(error);
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
            },
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
                    not: null,
                },
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                password: true,
                email: true,
                googleId: true,
            },
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

    async getProfile(user: {
        id: number;
    }): Promise<UserProfileResponse | null> {
        const userRes = await this.prisma.user.findFirst({
            where: {
                id: user.id,
            },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImageUrl: true,
            },
        });
        if (!userRes) return null;
        return {
            id: userRes.id,
            username: userRes.username,
            firstName: userRes.firstName,
            lastName: userRes.lastName,
            email: userRes.email,
            phone: userRes.phone,
            profileImageUrl: userRes.profileImageUrl,
        };
    }

    async getUsername(
        user: AuthenticatedCustomer,
    ): Promise<{ username: string | null }> {
        const res = await this.prisma.user.findFirst({
            where: {
                id: user.id,
            },
            select: {
                username: true,
            },
        });
        return {
            username: res?.username ?? null,
        };
    }

    /**
     * Updates a user's profile fields.
     */
    async updateProfile(
        userId: number,
        data: UpdateUserProfileDto,
    ): Promise<UserProfileResponse> {
        const updateData: UserUpdateFields = {};
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No profile fields provided');
        }
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    profileImageUrl: true,
                },
            });
            return user;
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Email or username already in use');
            }
            throw error;
        }
    }

    /**
     * Changes a user's password after verifying the current password.
     */
    async changePassword(
        userId: number,
        data: ChangeUserPasswordDto,
    ): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (!user.password) {
            throw new BadRequestException(
                'Password login is not enabled for this account',
            );
        }
        const isValid = await argon2.verify(
            user.password,
            data.currentPassword,
            {
                secret: this.secret,
            },
        );
        if (!isValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }
        const hashedPassword = await argon2.hash(data.newPassword, {
            secret: this.secret,
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        return { message: 'Password updated successfully' };
    }

    /**
     * Creates a pre-signed upload URL for the user's avatar image.
     */
    async createAvatarUpload(
        userId: number,
        contentType: 'image/jpeg' | 'image/png' | 'image/webp',
    ): Promise<{
        uploadUrl: string;
        publicUrl: string;
        objectKey: string;
        expiresInSeconds: number;
    }> {
        return this.storageService.createPresignedUploadUrl({
            contentType,
            userId,
            userType: 'customer',
        });
    }

    /**
     * Saves the user's avatar URL using the uploaded S3 object key.
     */
    async updateAvatar(
        userId: number,
        objectKey: string,
    ): Promise<UserProfileResponse> {
        const profileImageUrl = this.storageService.getPublicUrl(objectKey);
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { profileImageUrl },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profileImageUrl: true,
            },
        });
        return user;
    }

    private getSecret(): Buffer {
        const secret = this.configService.get<string>('AUTH_SECRET');
        if (!secret) {
            throw new InternalServerErrorException(
                'AUTH_SECRET is not defined in environment variables.',
            );
        }
        return Buffer.from(secret, 'base64');
    }
}
