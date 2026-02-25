/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorService } from './simulator.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    SimulatorQueryDto,
    SimulatorSortBy,
    SortOrder,
} from './dto/simulator-query.dto';

jest.mock('../prisma/prisma.service');

const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockTransaction = jest.fn();

const mockPrismaFactory = () => ({
    simulator: {
        findMany: mockFindMany,
        count: mockCount,
    },
    $transaction: mockTransaction,
});

describe('SimulatorService', () => {
    let service: SimulatorService;

    const mockSimulators = [
        {
            id: 1,
            simListName: 'Sim A',
            pricePerHour: 100,
            hostId: 1,
            modId: 1,
            listDescription: null,
            addressDetail: '123 Street',
            latitude: 13.756,
            longitude: 100.501,
            firstImage: 'noimage.jpg',
            secondImage: 'noimage.jpg',
            thirdImage: 'noimage.jpg',
        },
        {
            id: 2,
            simListName: 'Sim B',
            pricePerHour: 200,
            hostId: 2,
            modId: 2,
            listDescription: 'Desc',
            addressDetail: '456 Street',
            latitude: 14.0,
            longitude: 101.0,
            firstImage: 'noimage.jpg',
            secondImage: 'noimage.jpg',
            thirdImage: 'noimage.jpg',
        },
    ];

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SimulatorService,
                {
                    provide: PrismaService,
                    useFactory: mockPrismaFactory,
                },
            ],
        }).compile();

        service = module.get<SimulatorService>(SimulatorService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        describe('pagination meta', () => {
            it('should return paginated simulators with correct meta on page 1', async () => {
                const total = 2;
                mockTransaction.mockResolvedValue([mockSimulators, total]);

                const query: SimulatorQueryDto = { page: 1, limit: 10 };
                const result = await service.findAll(query);

                expect(mockTransaction).toHaveBeenCalledTimes(1);
                expect(result.data).toEqual(mockSimulators);
                expect(result.meta.total).toBe(total);
                expect(result.meta.page).toBe(1);
                expect(result.meta.limit).toBe(10);
                expect(result.meta.totalPages).toBe(1);
                expect(result.meta.hasNextPage).toBe(false);
                expect(result.meta.hasPreviousPage).toBe(false);
            });

            it('should return correct totalPages and hasNextPage for multiple pages', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 25]);

                const query: SimulatorQueryDto = { page: 1, limit: 10 };
                const result = await service.findAll(query);

                expect(result.meta.totalPages).toBe(3);
                expect(result.meta.hasNextPage).toBe(true);
                expect(result.meta.hasPreviousPage).toBe(false);
            });

            it('should set hasPreviousPage to true when on page 2', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 25]);

                const result = await service.findAll({ page: 2, limit: 10 });

                expect(result.meta.hasPreviousPage).toBe(true);
                expect(result.meta.hasNextPage).toBe(true);
                expect(result.meta.page).toBe(2);
            });

            it('should set hasNextPage to false on last page', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 25]);

                const result = await service.findAll({ page: 3, limit: 10 });

                expect(result.meta.hasNextPage).toBe(false);
                expect(result.meta.hasPreviousPage).toBe(true);
            });

            it('should default page=1 and limit=10 when not provided', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 5]);

                const result = await service.findAll({});

                expect(result.meta.page).toBe(1);
                expect(result.meta.limit).toBe(10);
            });

            it('should return empty data when no simulators exist', async () => {
                mockTransaction.mockResolvedValue([[], 0]);

                const result = await service.findAll({ page: 1, limit: 10 });

                expect(result.data).toEqual([]);
                expect(result.meta.total).toBe(0);
                expect(result.meta.totalPages).toBe(0);
                expect(result.meta.hasNextPage).toBe(false);
                expect(result.meta.hasPreviousPage).toBe(false);
            });

            it('should call $transaction once and return correct meta for page 3, limit 5', async () => {
                mockTransaction.mockResolvedValue([[], 100]);

                const result = await service.findAll({ page: 3, limit: 5 });

                expect(mockTransaction).toHaveBeenCalledTimes(1);
                expect(result.meta.page).toBe(3);
                expect(result.meta.limit).toBe(5);
                expect(result.meta.hasPreviousPage).toBe(true);
            });
        });

        describe('filtering and sorting', () => {
            beforeEach(() => {
                mockFindMany.mockResolvedValue([]);
                mockCount.mockResolvedValue(0);
                mockTransaction.mockImplementation(
                    (queries: Promise<unknown>[]) => Promise.all(queries),
                );
            });

            it('should pass minPrice and maxPrice as pricePerHour filter', async () => {
                await service.findAll({ minPrice: 50, maxPrice: 300 });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            pricePerHour: { gte: 50, lte: 300 },
                        }),
                    }),
                );
            });

            it('should pass simTypeIds as typeList.some filter', async () => {
                await service.findAll({ simTypeIds: [1, 3] });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            typeList: {
                                some: { simTypeId: { in: [1, 3] } },
                            },
                        }),
                    }),
                );
            });

            it('should not add typeList filter when simTypeIds is empty array', async () => {
                await service.findAll({ simTypeIds: [] });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.not.objectContaining({
                            typeList: expect.anything(),
                        }),
                    }),
                );
            });

            it('should apply sortBy PRICE DESC to orderBy', async () => {
                await service.findAll({
                    sortBy: SimulatorSortBy.PRICE,
                    sortOrder: SortOrder.DESC,
                });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        orderBy: { pricePerHour: 'desc' },
                    }),
                );
            });

            it('should default orderBy to id asc when sortBy and sortOrder are omitted', async () => {
                await service.findAll({});

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        orderBy: { id: 'asc' },
                    }),
                );
            });

            it('should combine all filters and pagination correctly', async () => {
                await service.findAll({
                    page: 2,
                    limit: 5,
                    minPrice: 100,
                    maxPrice: 400,
                    simTypeIds: [2],
                    sortBy: SimulatorSortBy.NAME,
                    sortOrder: SortOrder.ASC,
                });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        skip: 5,
                        take: 5,
                        where: {
                            pricePerHour: { gte: 100, lte: 400 },
                            typeList: { some: { simTypeId: { in: [2] } } },
                        },
                        orderBy: { simListName: 'asc' },
                    }),
                );
            });
        });
    });
});
