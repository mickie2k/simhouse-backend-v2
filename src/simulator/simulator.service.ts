import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { CreateSimulatorDto } from '../host/dto/create-simulator.dto';
import { UpdateSimulatorDto } from '../host/dto/update-simulator.dto';
import { FindNearestSimulatorsDto } from './dto/find-nearest-simulators.dto';
import {
    SimulatorQueryDto,
    SimulatorSortBy,
    SortOrder,
} from './dto/simulator-query.dto';
import {
    createPaginatedResponse,
    PaginatedResponseDto,
} from '../common/dto/paginated-response.dto';

@Injectable()
export class SimulatorService {
    private readonly logger = new Logger(SimulatorService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
    ) {}

    async create(createSimulatorDto: CreateSimulatorDto, hostId: number) {
        const file1 = 'noimage.jpg';
        const file2 = 'noimage.jpg';
        const file3 = 'noimage.jpg';

        try {
            // Create simulator with images
            const simulator = await this.prisma.simulator.create({
                data: {
                    simListName: createSimulatorDto.simlistname,
                    listDescription: createSimulatorDto.listdescription,
                    pricePerHour: createSimulatorDto.priceperhour,
                    modId: createSimulatorDto.modid,
                    hostId,
                    firstImage: file1,
                    secondImage: file2,
                    thirdImage: file3,
                    addressDetail: createSimulatorDto.addressdetail,
                    latitude: createSimulatorDto.latitude,
                    longitude: createSimulatorDto.longitude,
                },
                select: {
                    id: true,
                },
            });

            const simTypeLinks = createSimulatorDto.simtypeid.map((typeId) => ({
                simId: simulator.id,
                simTypeId: typeId,
            }));

            await this.prisma.simulatorTypeList.createMany({
                data: simTypeLinks,
            });

            return { message: 'Upload Success', simid: simulator.id };
        } catch (error) {
            this.logger.error(
                `Failed to upload simulator for host ${hostId}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw new BadRequestException('Failed to upload simulator');
        }
    }

    async findAll(
        query: SimulatorQueryDto,
    ): Promise<PaginatedResponseDto<object>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy ?? SimulatorSortBy.ID;
        const sortOrder = query.sortOrder ?? SortOrder.ASC;

        // Build price filter
        const priceFilter: { gte?: number; lte?: number } = {};
        if (query.minPrice !== undefined) priceFilter.gte = query.minPrice;
        if (query.maxPrice !== undefined) priceFilter.lte = query.maxPrice;
        const hasPriceFilter = Object.keys(priceFilter).length > 0;

        // Build WHERE clause
        const where = {
            ...(hasPriceFilter && {
                pricePerHour: priceFilter,
            }),
            ...(query.simTypeIds &&
                query.simTypeIds.length > 0 && {
                    typeList: {
                        some: {
                            simTypeId: { in: query.simTypeIds },
                        },
                    },
                }),
        };

        const [simulators, total] = await this.prisma.$transaction([
            this.prisma.simulator.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    mod: {
                        include: { brand: true },
                    },
                    typeList: {
                        include: { simType: true },
                    },
                },
            }),
            this.prisma.simulator.count({ where }),
        ]);

        return createPaginatedResponse(simulators, total, page, limit);
    }

    findOne(id: number) {
        const simulator = this.prisma.simulator.findUnique({
            where: { id },
        });
        return simulator;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    findNearestLocation(query: FindNearestSimulatorsDto) {
        return null;
    }

    async update(
        id: number,
        updateSimulatorDto: UpdateSimulatorDto,
        hostId: number,
    ) {
        const updateData = this.updateMapping(updateSimulatorDto);
        const hasUpdates =
            Object.keys(updateData).length > 0 ||
            Array.isArray(updateSimulatorDto.simtypeid);

        if (!hasUpdates) {
            throw new BadRequestException('No update fields provided');
        }

        const simulator = await this.prisma.simulator.findUnique({
            where: { id },
            select: { id: true, hostId: true },
        });

        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        if (simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        const updatedSimulator = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.simulator.update({
                where: { id },
                data: updateData,
            });

            if (updateSimulatorDto.simtypeid?.length) {
                await tx.simulatorTypeList.deleteMany({
                    where: { simId: id },
                });
                await tx.simulatorTypeList.createMany({
                    data: updateSimulatorDto.simtypeid.map((typeId) => ({
                        simId: id,
                        simTypeId: typeId,
                    })),
                });
            }

            return updated;
        });

        return updatedSimulator;
    }

    updateMapping(updateSimulatorDto: UpdateSimulatorDto) {
        const updateData: {
            simListName?: string;
            listDescription?: string | null;
            pricePerHour?: number;
            modId?: number;
            addressDetail?: string;
            latitude?: number;
            longitude?: number;
            firstImage?: string;
            secondImage?: string;
            thirdImage?: string;
        } = {};

        if (updateSimulatorDto.simlistname !== undefined) {
            updateData.simListName = updateSimulatorDto.simlistname;
        }

        if (updateSimulatorDto.listdescription !== undefined) {
            updateData.listDescription = updateSimulatorDto.listdescription;
        }

        if (updateSimulatorDto.priceperhour !== undefined) {
            updateData.pricePerHour = updateSimulatorDto.priceperhour;
        }

        if (updateSimulatorDto.modid !== undefined) {
            updateData.modId = updateSimulatorDto.modid;
        }

        if (updateSimulatorDto.addressdetail !== undefined) {
            updateData.addressDetail = updateSimulatorDto.addressdetail;
        }

        if (updateSimulatorDto.latitude !== undefined) {
            updateData.latitude = updateSimulatorDto.latitude;
        }

        if (updateSimulatorDto.longitude !== undefined) {
            updateData.longitude = updateSimulatorDto.longitude;
        }

        if (updateSimulatorDto.firstImageKey !== undefined) {
            updateData.firstImage = this.resolveImageUrl(
                updateSimulatorDto.firstImageKey,
            );
        }

        if (updateSimulatorDto.secondImageKey !== undefined) {
            updateData.secondImage = this.resolveImageUrl(
                updateSimulatorDto.secondImageKey,
            );
        }

        if (updateSimulatorDto.thirdImageKey !== undefined) {
            updateData.thirdImage = this.resolveImageUrl(
                updateSimulatorDto.thirdImageKey,
            );
        }

        return updateData;
    }

    async remove(id: number, hostId: number) {
        const simulator = await this.prisma.simulator.findUnique({
            where: { id },
            select: { id: true, hostId: true },
        });

        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        if (simulator.hostId !== hostId) {
            throw new ForbiddenException('You do not own this simulator');
        }

        const bookingCount = await this.prisma.booking.count({
            where: {
                simId: id,
                statusId: { in: [1, 2] },
            },
        });

        if (bookingCount > 0) {
            throw new BadRequestException(
                'Cannot delete simulator with active bookings',
            );
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.simulatorTypeList.deleteMany({ where: { simId: id } });
            await tx.simulatorSchedule.deleteMany({ where: { simId: id } });
            await tx.simulator.delete({ where: { id } });
        });

        return { message: 'Simulator deleted successfully' };
    }

    private resolveImageUrl(objectKey?: string): string | undefined {
        if (!objectKey) return undefined;
        return this.storageService.getPublicUrl(objectKey);
    }
}
