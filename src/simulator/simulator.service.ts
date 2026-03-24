import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
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
import { ReviewService } from 'src/review/review.service';
import { formatTime } from 'src/common/utils/formatTime';

@Injectable()
export class SimulatorService {
    private readonly logger = new Logger(SimulatorService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storageService: StorageService,
        private readonly reviewService: ReviewService,
    ) {}

    async create(createSimulatorDto: CreateSimulatorDto, hostId: number) {
        try {
            const newSimulator = await this.prisma.$transaction(async (tx) => {
                // Create simulator with images
                const simulator = await tx.simulator.create({
                    data: {
                        simListName: createSimulatorDto.simlistname,
                        listDescription: createSimulatorDto.listdescription,
                        pricePerHour: createSimulatorDto.priceperhour,
                        modId: createSimulatorDto.modid,
                        hostId,
                        addressDetail: createSimulatorDto.addressdetail,
                        latitude: createSimulatorDto.latitude,
                        longitude: createSimulatorDto.longitude,
                        cityId: createSimulatorDto.cityId,
                    },
                    select: {
                        id: true,
                    },
                });

                const simTypeLinks = createSimulatorDto.simtypeid.map(
                    (typeId) => ({
                        simId: simulator.id,
                        simTypeId: typeId,
                    }),
                );

                await tx.simulatorTypeList.createMany({
                    data: simTypeLinks,
                });

                return simulator;
            });

            this.logger.log(
                `Created simulator with ID ${newSimulator.id} for host ${hostId}`,
            );

            return { message: 'Upload Success', simid: newSimulator.id };
        } catch (error) {
            this.logger.error(
                `Failed to upload simulator for host ${hostId}`,
                error instanceof Error ? error.stack : undefined,
            );
            throw new InternalServerErrorException(
                'Failed to upload simulator',
            );
        }
    }

    private buildWhereClause(filters: {
        search?: string;
        minPrice?: number;
        maxPrice?: number;
        simTypeIds?: number[];
        city?: string;
        province?: string;
        country?: string;
        startDate?: Date;
    }): Prisma.SimulatorWhereInput {
        const priceFilter: { gte?: number; lte?: number } = {};
        const search = filters.search?.trim();

        if (filters.minPrice !== undefined) priceFilter.gte = filters.minPrice;
        if (filters.maxPrice !== undefined) priceFilter.lte = filters.maxPrice;
        const hasPriceFilter = Object.keys(priceFilter).length > 0;

        const startDate = filters.startDate
            ? new Date(
                  new Date(filters.startDate).toISOString().split('T')[0] +
                      'T00:00:00.000Z',
              )
            : undefined;

        return {
            ...(search && {
                OR: [
                    {
                        simListName: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        listDescription: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        addressDetail: {
                            contains: search,
                            mode: 'insensitive',
                        },
                    },
                    {
                        mod: {
                            modelName: {
                                contains: search,
                                mode: 'insensitive',
                            },
                        },
                    },
                    {
                        mod: {
                            brand: {
                                brandName: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                ],
            }),
            ...(hasPriceFilter && { pricePerHour: priceFilter }),
            ...(filters.simTypeIds &&
                filters.simTypeIds.length > 0 && {
                    typeList: {
                        some: { simTypeId: { in: filters.simTypeIds } },
                    },
                }),
            // Location filters are hierarchical — apply only the most specific one
            ...(filters.city !== undefined
                ? { city: { name: filters.city } }
                : filters.province !== undefined
                  ? {
                        city: {
                            province: {
                                OR: [
                                    { name: filters.province },
                                    { code: filters.province },
                                ],
                            },
                        },
                    }
                  : filters.country !== undefined
                    ? { city: { country: { name: filters.country } } }
                    : {}),
            ...(startDate !== undefined && {
                schedules: {
                    some: {
                        date: startDate,
                        available: true,
                    },
                },
            }),
        };
    }

    async findAll() {
        const limit = 10;
        const sortBy = SimulatorSortBy.ID;
        const sortOrder = SortOrder.ASC;

        const simulators = await this.prisma.simulator.findMany({
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            select: {
                id: true,
                simListName: true,
                pricePerHour: true,
                listDescription: true,
                addressDetail: true,
                firstImage: true,
                secondImage: true,
                thirdImage: true,
                latitude: true,
                longitude: true,
                cityId: true,
                hostId: true,
                modId: true,
                mod: {
                    select: {
                        id: true,
                        modelName: true,
                        description: true,
                        brandId: true,
                        brand: {
                            select: {
                                id: true,
                                brandName: true,
                            },
                        },
                    },
                },
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                city: {
                    select: {
                        id: true,
                        name: true,
                        province: { select: { name: true } },
                        country: { select: { name: true } },
                    },
                },
            },
        });
        const flattenedSimulators = simulators.map((simulator) => ({
            ...simulator,
            firstImage: this.resolveImageUrl(simulator.firstImage),
            secondImage: this.resolveImageUrl(simulator.secondImage),
            thirdImage: this.resolveImageUrl(simulator.thirdImage),
            city: simulator.city.name,
            province: simulator.city.province?.name,
            country: simulator.city.country.name,
        }));
        return flattenedSimulators;
    }

    async find(
        query: SimulatorQueryDto,
    ): Promise<PaginatedResponseDto<object>> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy ?? SimulatorSortBy.ID;
        const sortOrder = query.sortOrder ?? SortOrder.ASC;

        if (!query.city && !query.province && !query.country) {
            query.city = 'Bangkok'; // Default to Bangkok if no location filter is provided
        }

        const where = this.buildWhereClause(query);

        const [simulators, total] = await this.prisma.$transaction([
            this.prisma.simulator.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    simListName: true,
                    pricePerHour: true,
                    listDescription: true,
                    addressDetail: true,
                    firstImage: true,
                    secondImage: true,
                    thirdImage: true,
                    latitude: true,
                    longitude: true,
                    cityId: true,
                    hostId: true,
                    modId: true,
                    mod: {
                        select: {
                            id: true,
                            modelName: true,
                            description: true,
                            brandId: true,
                            brand: {
                                select: {
                                    id: true,
                                    brandName: true,
                                },
                            },
                        },
                    },
                    host: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    city: {
                        select: {
                            id: true,
                            name: true,
                            province: { select: { name: true } },
                            country: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.simulator.count({ where }),
        ]);

        const flattenedSimulators = simulators.map((simulator) => ({
            ...simulator,
            firstImage: this.resolveImageUrl(simulator.firstImage),
            secondImage: this.resolveImageUrl(simulator.secondImage),
            thirdImage: this.resolveImageUrl(simulator.thirdImage),
            city: simulator.city.name,
            province: simulator.city.province?.name,
            country: simulator.city.country.name,
        }));

        this.logger.log(
            `Retrieved ${flattenedSimulators.length} simulators (total: ${total}) for page ${page} with filters: ${JSON.stringify(
                query,
            )}`,
        );
        return createPaginatedResponse(flattenedSimulators, total, page, limit);
    }

    async findOne(id: number) {
        const simulator = await this.prisma.simulator.findUnique({
            where: { id },
            include: {
                mod: {
                    include: { brand: true },
                },
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                city: {
                    include: {
                        province: true,
                        country: true,
                    },
                },
            },
        });
        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        return {
            ...simulator,
            city: simulator.city.name,
            province: simulator.city.province?.name,
            country: simulator.city.country.name,
        };
    }

    async findNearestLocation(
        query: FindNearestSimulatorsDto,
    ): Promise<PaginatedResponseDto<object>> {
        const {
            lat,
            lng,
            radiusKm,
            page = 1,
            limit = 20,
            minPrice,
            maxPrice,
            simTypeIds,
        } = query;
        const skip = (page - 1) * limit;

        // Build SQL fragments for optional filters
        const typeJoin =
            simTypeIds && simTypeIds.length > 0
                ? Prisma.sql`LEFT JOIN simulatortypelist stl ON sl."SimID" = stl."SimID"`
                : Prisma.sql``;

        const conditions: Prisma.Sql[] = [];
        if (minPrice !== undefined)
            conditions.push(Prisma.sql`sl."PricePerHour" >= ${minPrice}`);
        if (maxPrice !== undefined)
            conditions.push(Prisma.sql`sl."PricePerHour" <= ${maxPrice}`);
        if (simTypeIds && simTypeIds.length > 0)
            conditions.push(
                Prisma.sql`stl."SimTypeID" IN (${Prisma.join(simTypeIds)})`,
            );

        const whereClause =
            conditions.length > 0
                ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
                : Prisma.sql``;

        type RawResult = { SimID: number; distance_km: number };

        const rawResults = await this.prisma.$queryRaw<RawResult[]>`
            WITH distances AS (
                SELECT DISTINCT sl."SimID",
                    (6371 * acos(LEAST(1.0,
                        cos(radians(${lat})) * cos(radians(CAST(sl."Lat" AS float))) *
                        cos(radians(CAST(sl."Long" AS float)) - radians(${lng})) +
                        sin(radians(${lat})) * sin(radians(CAST(sl."Lat" AS float)))
                    ))) AS distance_km
                FROM simulatorlist sl
                ${typeJoin}
                ${whereClause}
            )
            SELECT "SimID", distance_km
            FROM distances
            WHERE distance_km <= ${radiusKm}
            ORDER BY distance_km ASC
        `;

        this.logger.log(
            `Found ${rawResults.length} simulators within ${radiusKm} km of (${lat}, ${lng})`,
        );

        const total = rawResults.length;

        if (total === 0) return createPaginatedResponse([], 0, page, limit);

        const pagedResults = rawResults.slice(skip, skip + limit);

        const distanceMap = new Map<number, number>(
            pagedResults.map((r) => [Number(r.SimID), Number(r.distance_km)]),
        );

        const where = this.buildWhereClause(query);
        this.logger.log(query);
        this.logger.log(where);

        const simulators = await this.prisma.simulator.findMany({
            where: { id: { in: [...distanceMap.keys()] }, ...where },
            select: {
                id: true,
                simListName: true,
                pricePerHour: true,
                listDescription: true,
                addressDetail: true,
                firstImage: true,
                secondImage: true,
                thirdImage: true,
                latitude: true,
                longitude: true,
                cityId: true,
                hostId: true,
                modId: true,
                mod: {
                    select: {
                        id: true,
                        modelName: true,
                        description: true,
                        brandId: true,
                        brand: {
                            select: {
                                id: true,
                                brandName: true,
                            },
                        },
                    },
                },
                host: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                city: {
                    select: {
                        id: true,
                        name: true,
                        province: { select: { name: true } },
                        country: { select: { name: true } },
                    },
                },
            },
        });

        const flattenedSimulators = simulators
            .map((s) => ({
                ...s,
                firstImage: this.resolveImageUrl(s.firstImage),
                secondImage: this.resolveImageUrl(s.secondImage),
                thirdImage: this.resolveImageUrl(s.thirdImage),
                city: s.city.name,
                province: s.city.province?.name,
                country: s.city.country.name,
                distanceKm: distanceMap.get(s.id),
            }))
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

        return createPaginatedResponse(flattenedSimulators, total, page, limit);
    }

    async getSimulatorReview(simId: number) {
        return this.reviewService.getSimulatorReviews(simId);
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
        return this.storageService.getCdnUrl(objectKey);
    }

    /**
     * Get available schedule slots for a simulator.
     * Used by customers to browse bookable time slots.
     */
    async getAvailableSlots(
        simId: number,
        startDate?: string,
        endDate?: string,
    ) {
        // Verify simulator exists
        const simulator = await this.prisma.simulator.findUnique({
            where: { id: simId },
            select: { id: true },
        });
        if (!simulator) {
            throw new NotFoundException('Simulator not found');
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const dateFilter: { gte: Date; lte?: Date } = {
            gte: startDate ? new Date(startDate) : today,
        };
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }

        const schedules = await this.prisma.simulatorSchedule.findMany({
            where: {
                simId,
                available: true,
                date: dateFilter,
            },
            select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                price: true,
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
        });
        const formatSchedules = schedules.map((s) => ({
            ...s,
            startTime: formatTime(s.startTime),
            endTime: formatTime(s.endTime),
        }));
        return formatSchedules;
    }
}
