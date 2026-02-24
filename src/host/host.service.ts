import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SimulatorService } from 'src/simulator/simulator.service';
import { StorageService } from 'src/storage/storage.service';
import { CreateSimulatorDto } from './dto/create-simulator.dto';
import { UpdateHostProfileDto } from './dto/update-host-profile.dto';
import { ChangeHostPasswordDto } from './dto/change-host-password.dto';
import * as argon2 from 'argon2';

interface HostProfileResponse {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profileImageUrl: string | null;
}

interface HostUpdateFields {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
}

interface MulterFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
}

@Injectable()
/**
 * Provides host profile, booking, and simulator operations.
 */
export class HostService {
    private readonly logger = new Logger(HostService.name);
    private readonly secret: Buffer;

    constructor(
        private readonly prisma: PrismaService,
        private readonly simulatorService: SimulatorService,
        private readonly configService: ConfigService,
        private readonly storageService: StorageService,
    ) {
        this.secret = this.getSecret();
    }

    async getBookingFromSimID(simId: number, hostId: number) {
        // Get all bookings for a simulator owned by this host
        const bookings = await this.prisma.booking.findMany({
            where: {
                simId,
                simulator: {
                    hostId,
                },
            },
            include: {
                bookingStatus: true,
                customer: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
            orderBy: { bookingDate: 'desc' },
        });
        return bookings;
    }

    async scheduleFromBookingID(
        bookingId: number,
        simId: number,
        hostId: number,
    ) {
        // Get schedule details for a specific booking
        const booking = await this.prisma.booking.findFirst({
            where: {
                id: bookingId,
                simId,
                simulator: {
                    hostId,
                },
            },
            include: {
                bookingList: {
                    include: {
                        schedule: true,
                    },
                    orderBy: { schedule: { startTime: 'asc' } },
                },
                simulator: true,
                customer: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
                bookingStatus: true,
            },
        });
        return booking;
    }

    async scheduleFromSimID(simId: number, hostId: number) {
        // Get all schedules for a simulator owned by this host
        const schedules = await this.prisma.simulatorSchedule.findMany({
            where: {
                simId,
                simulator: {
                    hostId,
                },
            },
            orderBy: { startTime: 'asc' },
        });
        return schedules;
    }

    async confirmBooking(bookingId: number, simId: number, hostId: number) {
        // Confirm a booking (change status from pending to confirmed)
        const result = await this.prisma.booking.updateMany({
            where: {
                id: bookingId,
                simId,
                simulator: {
                    hostId,
                },
                statusId: 1, // Assuming 1 is pending
            },
            data: {
                statusId: 2, // Assuming 2 is confirmed
            },
        });

        const message =
            result.count > 0
                ? 'Booking has been confirmed.'
                : 'Booking cannot be confirmed.';
        const status = result.count > 0;
        return { status, message };
    }

    async uploadSimulator(
        createSimulatorDto: CreateSimulatorDto,
        files: {
            file1?: MulterFile[];
            file2?: MulterFile[];
            file3?: MulterFile[];
        },
        hostId: number,
    ) {
        // Delegate to SimulatorService for business logic
        return this.simulatorService.create(createSimulatorDto, files, hostId);
    }

    /**
     * Gets the host's profile details.
     */
    async getProfile(hostId: number): Promise<HostProfileResponse | null> {
        const host = await this.prisma.host.findFirst({
            where: { id: hostId },
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
        if (!host) return null;
        return host;
    }

    /**
     * Updates host profile fields.
     */
    async updateProfile(
        hostId: number,
        data: UpdateHostProfileDto,
    ): Promise<HostProfileResponse> {
        const updateData: HostUpdateFields = {};
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.username !== undefined) updateData.username = data.username;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.phone !== undefined) updateData.phone = data.phone;
        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No profile fields provided');
        }
        try {
            const host = await this.prisma.host.update({
                where: { id: hostId },
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
            return host;
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
     * Changes a host's password after verifying the current password.
     */
    async changePassword(
        hostId: number,
        data: ChangeHostPasswordDto,
    ): Promise<{ message: string }> {
        const host = await this.prisma.host.findUnique({
            where: { id: hostId },
            select: { password: true },
        });
        if (!host) {
            throw new NotFoundException('Host not found');
        }
        if (!host.password) {
            throw new BadRequestException(
                'Password login is not enabled for this account',
            );
        }
        const isValid = await argon2.verify(
            host.password,
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
        await this.prisma.host.update({
            where: { id: hostId },
            data: { password: hashedPassword },
        });
        return { message: 'Password updated successfully' };
    }

    /**
     * Creates a pre-signed upload URL for the host's avatar image.
     */
    async createAvatarUpload(
        hostId: number,
        contentType: 'image/jpeg' | 'image/png' | 'image/webp',
    ): Promise<{
        uploadUrl: string;
        publicUrl: string;
        objectKey: string;
        expiresInSeconds: number;
    }> {
        return this.storageService.createPresignedUploadUrl({
            contentType,
            userId: hostId,
            userType: 'host',
        });
    }

    /**
     * Saves the host's avatar URL using the uploaded S3 object key.
     */
    async updateAvatar(
        hostId: number,
        objectKey: string,
    ): Promise<HostProfileResponse> {
        const profileImageUrl = this.storageService.getPublicUrl(objectKey);
        const host = await this.prisma.host.update({
            where: { id: hostId },
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
        return host;
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
