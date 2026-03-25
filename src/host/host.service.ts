import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
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
import { UpdateSimulatorDto } from 'src/host/dto/update-simulator.dto';
import {
    CreateScheduleTemplateDto,
    BulkCreateScheduleTemplateDto,
} from './dto/create-schedule-template.dto';
import { UpdateScheduleTemplateDto } from './dto/update-schedule-template.dto';
import { UpdateScheduleSlotDto } from './dto/update-schedule-slot.dto';
import { CreateAdHocScheduleDto } from './dto/create-adhoc-schedule.dto';
import { ScheduleJobService } from 'src/schedule-job/schedule-job.service';
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
        private readonly scheduleJobService: ScheduleJobService,
    ) {
        this.secret = this.getSecret();
    }

    async getBookingsFromHostId(hostId: number): Promise<unknown[]> {
        const bookings = await this.prisma.booking.findMany({
            where: {
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
                simulator: {
                    select: {
                        id: true,
                        simListName: true,
                        firstImage: true,
                        secondImage: true,
                        thirdImage: true,
                    },
                },
            },
            orderBy: { bookingDate: 'desc' },
        });

        return bookings.map((booking) => ({
            ...booking,
            simulator: {
                ...booking.simulator,
                firstImage: this.resolveImageUrl(booking.simulator.firstImage),
                secondImage: this.resolveImageUrl(
                    booking.simulator.secondImage,
                ),
                thirdImage: this.resolveImageUrl(booking.simulator.thirdImage),
            },
        }));
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
                simulator: {
                    select: {
                        id: true,
                        simListName: true,
                        firstImage: true,
                        secondImage: true,
                        thirdImage: true,
                    },
                },
            },
            orderBy: { bookingDate: 'desc' },
        });

        return bookings.map((booking) => ({
            ...booking,
            simulator: {
                ...booking.simulator,
                firstImage: this.resolveImageUrl(booking.simulator.firstImage),
                secondImage: this.resolveImageUrl(
                    booking.simulator.secondImage,
                ),
                thirdImage: this.resolveImageUrl(booking.simulator.thirdImage),
            },
        }));
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
                simulator: {
                    select: {
                        id: true,
                        simListName: true,
                        firstImage: true,
                        secondImage: true,
                        thirdImage: true,
                        addressDetail: true,
                        latitude: true,
                        longitude: true,
                        pricePerHour: true,
                    },
                },
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

        if (!booking) {
            return null;
        }

        return {
            ...booking,
            simulator: {
                ...booking.simulator,
                firstImage: this.resolveImageUrl(booking.simulator.firstImage),
                secondImage: this.resolveImageUrl(
                    booking.simulator.secondImage,
                ),
                thirdImage: this.resolveImageUrl(booking.simulator.thirdImage),
            },
        };
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
        hostId: number,
    ) {
        // Delegate to SimulatorService for business logic
        return this.simulatorService.create(createSimulatorDto, hostId);
    }

    async updateSimulator(
        simId: number,
        data: UpdateSimulatorDto,
        hostId: number,
    ) {
        return this.simulatorService.update(simId, data, hostId);
    }

    async confirmSimulatorImages(
        simId: number,
        data: UpdateSimulatorDto,
        hostId: number,
    ) {
        const simulator = await this.prisma.simulator.findUnique({
            where: { id: simId },
            select: { id: true, hostId: true },
        });

        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        if (simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        if (data.firstImageKey) {
            const normalizedFirstImageKey =
                this.normalizeAndValidateSimulatorImageKey(
                    data.firstImageKey,
                    simId,
                );
            await this.storageService.assertObjectExists(
                normalizedFirstImageKey,
            );
            data.firstImageKey = normalizedFirstImageKey;
        }
        if (data.secondImageKey) {
            const normalizedSecondImageKey =
                this.normalizeAndValidateSimulatorImageKey(
                    data.secondImageKey,
                    simId,
                );
            await this.storageService.assertObjectExists(
                normalizedSecondImageKey,
            );
            data.secondImageKey = normalizedSecondImageKey;
        }
        if (data.thirdImageKey) {
            const normalizedThirdImageKey =
                this.normalizeAndValidateSimulatorImageKey(
                    data.thirdImageKey,
                    simId,
                );
            await this.storageService.assertObjectExists(
                normalizedThirdImageKey,
            );
            data.thirdImageKey = normalizedThirdImageKey;
        }

        return this.simulatorService.update(simId, data, hostId);
    }

    private normalizeAndValidateSimulatorImageKey(
        objectKey: string,
        simId: number,
    ): string {
        const normalizedObjectKey =
            this.storageService.normalizeObjectKey(objectKey);
        const simulatorPrefix =
            this.configService.get<string>('S3_SIMULATOR_PREFIX') ??
            'simulators';
        const expectedPathPrefix = `${simulatorPrefix.replace(/^\/+|\/+$/g, '')}/sim/${simId}/`;

        if (!normalizedObjectKey.startsWith(expectedPathPrefix)) {
            throw new BadRequestException(
                `Invalid image key. Expected key to start with "${expectedPathPrefix}"`,
            );
        }

        return normalizedObjectKey;
    }

    /**
     * Creates a pre-signed upload URL for a simulator image.
     */
    async createSimulatorImageUpload(
        hostId: number,
        simId: number,
        contentType: 'image/jpeg' | 'image/png' | 'image/webp',
    ): Promise<{
        uploadUrl: string;
        publicUrl: string;
        objectKey: string;
        expiresInSeconds: number;
    }> {
        const simulator = await this.prisma.simulator.findUnique({
            where: { id: simId },
            select: { id: true, hostId: true },
        });

        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        if (simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        const prefix =
            this.configService.get<string>('S3_SIMULATOR_PREFIX') ??
            'simulators';
        return this.storageService.createPresignedUploadUrl({
            contentType,
            path: `sim/${simId}`,
            prefix,
        });
    }

    /**
     * Gets all simulators owned by a host.
     */
    async getSimulators(hostId: number): Promise<unknown[]> {
        const simulators = await this.prisma.simulator.findMany({
            where: { hostId },
            include: {
                mod: {
                    include: {
                        brand: true,
                    },
                },
                city: true,
                typeList: {
                    include: {
                        simType: true,
                    },
                },
            },
            orderBy: { simListName: 'asc' },
        });

        return simulators.map((sim) => ({
            ...sim,
            firstImage: this.resolveImageUrl(sim.firstImage),
            secondImage: this.resolveImageUrl(sim.secondImage),
            thirdImage: this.resolveImageUrl(sim.thirdImage),
        }));
    }

    /**
     * Gets a specific simulator owned by a host.
     */
    async getSimulator(simId: number, hostId: number): Promise<unknown> {
        const simulator = await this.prisma.simulator.findUnique({
            where: { id: simId },
            include: {
                mod: {
                    include: {
                        brand: true,
                    },
                },
                city: true,
                typeList: {
                    include: {
                        simType: true,
                    },
                },
            },
        });

        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        if (simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        return {
            ...simulator,
            firstImage: this.resolveImageUrl(simulator.firstImage),
            secondImage: this.resolveImageUrl(simulator.secondImage),
            thirdImage: this.resolveImageUrl(simulator.thirdImage),
        };
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
            path: `host/${hostId}`,
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

    // ─── Schedule Template CRUD ─────────────────────────────────────

    async createScheduleTemplate(
        simId: number,
        hostId: number,
        dto: CreateScheduleTemplateDto,
    ) {
        await this.assertSimulatorOwnership(simId, hostId);
        this.validateTimeRange(dto.startTime, dto.endTime);
        await this.checkTemplateOverlap(
            simId,
            dto.dayOfWeek,
            dto.startTime,
            dto.endTime,
        );

        const template = await this.prisma.scheduleTemplate.create({
            data: {
                dayOfWeek: dto.dayOfWeek,
                startTime: this.timeToDate(dto.startTime),
                endTime: this.timeToDate(dto.endTime),
                pricePerHour: dto.pricePerHour,
                simId,
            },
        });

        // Immediately materialize slots for the next 60 days
        await this.scheduleJobService.materializeForTemplate(template.id);

        return template;
    }

    async bulkCreateScheduleTemplates(
        simId: number,
        hostId: number,
        dto: BulkCreateScheduleTemplateDto,
    ) {
        await this.assertSimulatorOwnership(simId, hostId);
        this.validateTimeRange(dto.startTime, dto.endTime);

        const uniqueDays = [...new Set(dto.daysOfWeek)];
        for (const day of uniqueDays) {
            await this.checkTemplateOverlap(
                simId,
                day,
                dto.startTime,
                dto.endTime,
            );
        }

        const data = uniqueDays.map((day) => ({
            dayOfWeek: day,
            startTime: this.timeToDate(dto.startTime),
            endTime: this.timeToDate(dto.endTime),
            pricePerHour: dto.pricePerHour,
            simId,
        }));

        await this.prisma.scheduleTemplate.createMany({
            data,
            skipDuplicates: true,
        });

        // Materialize slots for all newly created templates
        const created = await this.prisma.scheduleTemplate.findMany({
            where: {
                simId,
                isActive: true,
                dayOfWeek: { in: uniqueDays },
                startTime: this.timeToDate(dto.startTime),
                endTime: this.timeToDate(dto.endTime),
            },
            select: { id: true },
        });
        for (const t of created) {
            await this.scheduleJobService.materializeForTemplate(t.id);
        }

        return { message: `Created ${uniqueDays.length} schedule templates` };
    }

    async getScheduleTemplates(simId: number, hostId: number) {
        await this.assertSimulatorOwnership(simId, hostId);
        return this.prisma.scheduleTemplate.findMany({
            where: { simId, isActive: true },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });
    }

    async updateScheduleTemplate(
        templateId: number,
        hostId: number,
        dto: UpdateScheduleTemplateDto,
    ) {
        const template = await this.prisma.scheduleTemplate.findUnique({
            where: { id: templateId },
            include: { simulator: { select: { hostId: true, id: true } } },
        });
        if (!template) throw new NotFoundException('Template not found');
        if (template.simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        // Resolve final values for overlap check
        const finalDay = dto.dayOfWeek ?? template.dayOfWeek;
        const finalStart =
            dto.startTime ?? this.dateToTimeStr(template.startTime);
        const finalEnd = dto.endTime ?? this.dateToTimeStr(template.endTime);
        this.validateTimeRange(finalStart, finalEnd);
        await this.checkTemplateOverlap(
            template.simId,
            finalDay,
            finalStart,
            finalEnd,
            templateId,
        );

        const updateData: Record<string, unknown> = {};
        if (dto.dayOfWeek !== undefined) updateData.dayOfWeek = dto.dayOfWeek;
        if (dto.startTime !== undefined)
            updateData.startTime = this.timeToDate(dto.startTime);
        if (dto.endTime !== undefined)
            updateData.endTime = this.timeToDate(dto.endTime);
        if (dto.pricePerHour !== undefined)
            updateData.pricePerHour = dto.pricePerHour;

        const updated = await this.prisma.scheduleTemplate.update({
            where: { id: templateId },
            data: updateData,
        });

        // Propagate price change to future unbooked slots from this template
        if (dto.pricePerHour !== undefined) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            await this.prisma.simulatorSchedule.updateMany({
                where: {
                    templateId,
                    available: true,
                    date: { gt: today },
                },
                data: { price: dto.pricePerHour },
            });
        }

        // If day/time changed, re-materialize to fill any new gaps
        if (
            dto.dayOfWeek !== undefined ||
            dto.startTime !== undefined ||
            dto.endTime !== undefined
        ) {
            await this.scheduleJobService.materializeForTemplate(templateId);
        }

        return updated;
    }

    async deleteScheduleTemplate(templateId: number, hostId: number) {
        const template = await this.prisma.scheduleTemplate.findUnique({
            where: { id: templateId },
            include: { simulator: { select: { hostId: true } } },
        });
        if (!template) throw new NotFoundException('Template not found');
        if (template.simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        // Soft delete: deactivate template
        await this.prisma.scheduleTemplate.update({
            where: { id: templateId },
            data: { isActive: false },
        });

        // Remove future unbooked materialized slots from this template
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deleted = await this.prisma.simulatorSchedule.deleteMany({
            where: {
                templateId,
                available: true,
                date: { gt: today },
            },
        });

        return {
            message: 'Template deactivated',
            slotsRemoved: deleted.count,
        };
    }

    // ─── Schedule Slot Overrides ──────────────────────────────────────

    async getScheduleSlots(
        simId: number,
        hostId: number,
        startDate?: string,
        endDate?: string,
    ) {
        await this.assertSimulatorOwnership(simId, hostId);

        const where: Record<string, unknown> = { simId };
        if (startDate || endDate) {
            const dateFilter: Record<string, Date> = {};
            if (startDate) dateFilter.gte = new Date(startDate);
            if (endDate) dateFilter.lte = new Date(endDate);
            where.date = dateFilter;
        }

        return this.prisma.simulatorSchedule.findMany({
            where,
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
            include: {
                bookingList: {
                    include: {
                        booking: {
                            select: { id: true, statusId: true },
                        },
                    },
                },
            },
        });
    }

    async updateScheduleSlot(
        scheduleId: number,
        simId: number,
        hostId: number,
        dto: UpdateScheduleSlotDto,
    ) {
        await this.assertSimulatorOwnership(simId, hostId);

        const slot = await this.prisma.simulatorSchedule.findFirst({
            where: { id: scheduleId, simId },
            include: {
                bookingList: {
                    include: {
                        booking: {
                            select: { statusId: true },
                        },
                    },
                },
            },
        });
        if (!slot) throw new NotFoundException('Schedule slot not found');

        // Check if slot has active bookings (statusId 1=pending or 2=confirmed)
        const hasActiveBooking = slot.bookingList.some(
            (bl) => bl.booking.statusId === 1 || bl.booking.statusId === 2,
        );
        if (hasActiveBooking && dto.available === true) {
            throw new BadRequestException(
                'Cannot mark slot as available — it has an active booking',
            );
        }

        const updateData: Record<string, unknown> = {};
        if (dto.price !== undefined) updateData.price = dto.price;
        if (dto.available !== undefined) updateData.available = dto.available;

        return this.prisma.simulatorSchedule.update({
            where: { id: scheduleId },
            data: updateData,
        });
    }

    async createAdHocSlot(
        simId: number,
        hostId: number,
        dto: CreateAdHocScheduleDto,
    ) {
        await this.assertSimulatorOwnership(simId, hostId);
        this.validateTimeRange(dto.startTime, dto.endTime);

        const slotDate = new Date(dto.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (slotDate < today) {
            throw new BadRequestException('Cannot create slots in the past');
        }

        return this.prisma.simulatorSchedule.create({
            data: {
                date: slotDate,
                startTime: this.timeToDate(dto.startTime),
                endTime: this.timeToDate(dto.endTime),
                price: dto.price,
                simId,
                templateId: null,
            },
        });
    }

    async deleteScheduleSlot(
        scheduleId: number,
        simId: number,
        hostId: number,
    ) {
        await this.assertSimulatorOwnership(simId, hostId);

        const slot = await this.prisma.simulatorSchedule.findFirst({
            where: { id: scheduleId, simId },
            include: { bookingList: true },
        });
        if (!slot) throw new NotFoundException('Schedule slot not found');
        if (slot.bookingList.length > 0) {
            throw new BadRequestException(
                'Cannot delete a slot that is linked to a booking',
            );
        }

        await this.prisma.simulatorSchedule.delete({
            where: { id: scheduleId },
        });
        return { message: 'Slot deleted' };
    }

    // ─── Private Helpers ──────────────────────────────────────────────

    private async assertSimulatorOwnership(simId: number, hostId: number) {
        const sim = await this.prisma.simulator.findUnique({
            where: { id: simId },
            select: { hostId: true },
        });
        if (!sim) throw new NotFoundException('Simulator not found');
        if (sim.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }
    }

    private validateTimeRange(startTime: string, endTime: string) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;
        if (endMinutes <= startMinutes) {
            throw new BadRequestException('endTime must be after startTime');
        }
    }

    private async checkTemplateOverlap(
        simId: number,
        dayOfWeek: number,
        startTime: string,
        endTime: string,
        excludeTemplateId?: number,
    ) {
        const existingTemplates = await this.prisma.scheduleTemplate.findMany({
            where: {
                simId,
                dayOfWeek,
                isActive: true,
                ...(excludeTemplateId
                    ? { id: { not: excludeTemplateId } }
                    : {}),
            },
        });

        const newStart = this.timeToMinutes(startTime);
        const newEnd = this.timeToMinutes(endTime);

        for (const t of existingTemplates) {
            const tStart = this.dateTimeToMinutes(t.startTime);
            const tEnd = this.dateTimeToMinutes(t.endTime);
            if (newStart < tEnd && newEnd > tStart) {
                throw new ConflictException(
                    `Template overlaps with existing template (ID: ${t.id}) on this day`,
                );
            }
        }
    }

    /** Convert "HH:mm" string to a Date with time set (date part is 1970-01-01, as Prisma Time needs) */
    private timeToDate(time: string): Date {
        return new Date(`1970-01-01T${time}:00.000Z`);
    }

    /** Convert Date (Time column) back to "HH:mm" string */
    private dateToTimeStr(d: Date): string {
        return d.toISOString().slice(11, 16);
    }

    private timeToMinutes(time: string): number {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    }

    private dateTimeToMinutes(d: Date): number {
        return d.getUTCHours() * 60 + d.getUTCMinutes();
    }

    private resolveImageUrl(objectKey?: string): string | undefined {
        if (!objectKey) return undefined;
        return this.storageService.getCdnUrl(objectKey);
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
