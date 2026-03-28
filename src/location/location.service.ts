import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationService {
    constructor(private readonly prisma: PrismaService) {}

    async getCountries() {
        return this.prisma.country.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async getStates(countryId: string) {
        const countryIdNum = parseInt(countryId, 10);
        return this.prisma.province.findMany({
            where: {
                countryId: countryIdNum,
            },
            select: {
                id: true,
                name: true,
                code: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async getCities(countryId: string, stateCode: string) {
        const countryIdNum = parseInt(countryId, 10);
        return this.prisma.city.findMany({
            where: {
                countryId: countryIdNum,
                province: {
                    code: stateCode,
                },
            },
            select: {
                id: true,
                name: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }
}
