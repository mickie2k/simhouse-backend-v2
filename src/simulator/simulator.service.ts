import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSimulatorDto } from '../host/dto/create-simulator.dto';
import { UpdateSimulatorDto } from './dto/update-simulator.dto';
import { FindNearestSimulatorsDto } from './dto/find-nearest-simulators.dto';

interface MulterFile {
    filename: string;
    originalname: string;
    mimetype: string;
    size: number;
}

@Injectable()
export class SimulatorService {
    private readonly logger = new Logger(SimulatorService.name);

    constructor(private readonly prisma: PrismaService) {}

    async create(
        createSimulatorDto: CreateSimulatorDto,
        files: {
            file1?: MulterFile[];
            file2?: MulterFile[];
            file3?: MulterFile[];
        },
        hostId: number,
    ) {
        // Extract file names or use default
        const file1 = files?.file1?.[0]?.filename ?? 'noimage.jpg';
        const file2 = files?.file2?.[0]?.filename ?? 'noimage.jpg';
        const file3 = files?.file3?.[0]?.filename ?? 'noimage.jpg';

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

    findAll() {
        const simulators = this.prisma.simulator.findMany();
        return simulators;
    }

    findOne(id: number) {
        const simulator = this.prisma.simulator.findUnique({
            where: { id },
        });
        return simulator;
    }

    async findNearestLocation(query: FindNearestSimulatorsDto) {
        const limit = query.limit ?? 20;
        const radiusMeters = query.radiusKm * 1000;

        const results = await this.prisma.$queryRaw<
            Array<{
                id: number;
                simListName: string;
                listDescription: string | null;
                pricePerHour: number;
                addressDetail: string;
                latitude: number;
                longitude: number;
                firstImage: string;
                secondImage: string;
                thirdImage: string;
                hostId: number;
                modId: number;
                distanceKm: number;
            }>
        >`
            SELECT
                s."SimID" AS "id",
                s."SimListName" AS "simListName",
                s."ListDescription" AS "listDescription",
                s."PricePerHour" AS "pricePerHour",
                s."AddressDetail" AS "addressDetail",
                s."Lat" AS "latitude",
                s."Long" AS "longitude",
                s."firstimage" AS "firstImage",
                s."secondimage" AS "secondImage",
                s."thirdimage" AS "thirdImage",
                s."HostID" AS "hostId",
                s."ModID" AS "modId",
                ST_DistanceSphere(
                    ST_MakePoint(s."Long", s."Lat"),
                    ST_MakePoint(${query.lng}, ${query.lat})
                ) / 1000.0 AS "distanceKm"
            FROM "simulatorlist" s
            WHERE ST_DistanceSphere(
                ST_MakePoint(s."Long", s."Lat"),
                ST_MakePoint(${query.lng}, ${query.lat})
            ) <= ${radiusMeters}
            ORDER BY "distanceKm" ASC
            LIMIT ${limit}
        `;

        return results;
    }

    async update(
        id: number,
        updateSimulatorDto: UpdateSimulatorDto,
        files: {
            file1?: MulterFile[];
            file2?: MulterFile[];
            file3?: MulterFile[];
        },
        hostId: number,
    ) {
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

        const file1 = files?.file1?.[0]?.filename;
        const file2 = files?.file2?.[0]?.filename;
        const file3 = files?.file3?.[0]?.filename;

        if (file1) updateData.firstImage = file1;
        if (file2) updateData.secondImage = file2;
        if (file3) updateData.thirdImage = file3;

        const hasUpdates =
            Object.keys(updateData).length > 0 ||
            updateSimulatorDto.simtypeid !== undefined;

        if (!hasUpdates) {
            throw new BadRequestException('No update fields provided');
        }

        const updatedSimulator = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.simulator.update({
                where: { id },
                data: updateData,
            });

            if (updateSimulatorDto.simtypeid) {
                await tx.simulatorTypeList.deleteMany({
                    where: { simId: id },
                });
                const typeLinks = updateSimulatorDto.simtypeid.map(
                    (typeId) => ({
                        simId: id,
                        simTypeId: typeId,
                    }),
                );
                if (typeLinks.length > 0) {
                    await tx.simulatorTypeList.createMany({
                        data: typeLinks,
                    });
                }
            }

            return updated;
        });

        return updatedSimulator;
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
}
