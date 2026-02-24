import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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

    private toNumber(value: unknown): number {
        if (typeof value === 'number') return value;
        if (value == null) return NaN;
        if (typeof value === 'string') return Number(value);
        // Prisma Decimal has toString()
        if (typeof value === 'object' && 'toString' in value) {
            const str = String(value);
            return Number(str);
        }
        return NaN;
    }

    private haversineDistanceKm(
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number,
    ): number {
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const R = 6371; // km
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async findNearestLocation(query: FindNearestSimulatorsDto) {
        const limit = query.limit ?? 20;

        // Coarse bounding box filter (reduces rows scanned)
        const latDelta = query.radiusKm / 111.32;
        const cosLat = Math.cos((query.lat * Math.PI) / 180);
        const lngDelta =
            cosLat === 0 ? 180 : query.radiusKm / (111.32 * Math.abs(cosLat));

        const minLat = Math.max(-90, query.lat - latDelta);
        const maxLat = Math.min(90, query.lat + latDelta);
        const minLng = Math.max(-180, query.lng - lngDelta);
        const maxLng = Math.min(180, query.lng + lngDelta);

        const simulators = await this.prisma.simulator.findMany({
            where: {
                latitude: {
                    gte: minLat,
                    lte: maxLat,
                },
                longitude: {
                    gte: minLng,
                    lte: maxLng,
                },
            },
            select: {
                id: true,
                simListName: true,
                listDescription: true,
                pricePerHour: true,
                addressDetail: true,
                latitude: true,
                longitude: true,
                firstImage: true,
                secondImage: true,
                thirdImage: true,
                hostId: true,
                modId: true,
            },
        });

        const withinRadius = simulators
            .map((sim) => {
                const simLat = this.toNumber(sim.latitude);
                const simLng = this.toNumber(sim.longitude);
                const distanceKm = this.haversineDistanceKm(
                    query.lat,
                    query.lng,
                    simLat,
                    simLng,
                );
                return { ...sim, distanceKm };
            })
            .filter((sim) => Number.isFinite(sim.distanceKm))
            .filter((sim) => sim.distanceKm <= query.radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, limit);

        return withinRadius;
    }

    update(id: number, updateSimulatorDto: UpdateSimulatorDto) {
        void updateSimulatorDto;
        return `This action updates a #${id} simulator`;
    }

    remove(id: number) {
        return `This action removes a #${id} simulator`;
    }
}
