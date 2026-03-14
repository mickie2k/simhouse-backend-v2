/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { SimulatorService } from './simulator.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ReviewService } from '../review/review.service';
import {
    SimulatorQueryDto,
    SimulatorSortBy,
    SortOrder,
} from './dto/simulator-query.dto';

jest.mock('../prisma/prisma.service');

const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockTransaction = jest.fn();
const mockGetPublicUrl = jest.fn((value?: string) => value);

const mockPrismaFactory = () => ({
    simulator: {
        findMany: mockFindMany,
        count: mockCount,
    },
    $transaction: mockTransaction,
});

const mockStorageFactory = () => ({
    getPublicUrl: mockGetPublicUrl,
});

describe('SimulatorService', () => {
    let service: SimulatorService;

    type PaginationMeta = {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };

    const getMeta = (result: unknown): PaginationMeta => {
        return (result as { meta: PaginationMeta }).meta;
    };

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
            city: {
                id: 1,
                name: 'Bangkok',
                province: { name: 'Bangkok' },
                country: { name: 'Thailand' },
            },
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
            city: {
                id: 2,
                name: 'Chiang Mai',
                province: { name: 'Chiang Mai' },
                country: { name: 'Thailand' },
            },
        },
    ];

    const expectedFlattenedSimulators = mockSimulators.map((simulator) => ({
        ...simulator,
        city: simulator.city.name,
        province: simulator.city.province?.name,
        country: simulator.city.country.name,
    }));

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SimulatorService,
                {
                    provide: PrismaService,
                    useFactory: mockPrismaFactory,
                },
                {
                    provide: StorageService,
                    useFactory: mockStorageFactory,
                },
                {
                    provide: ReviewService,
                    useValue: {},
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
                const result = await service.find(query);
                const meta = getMeta(result);

                expect(mockTransaction).toHaveBeenCalledTimes(1);
                expect(result.data).toEqual(expectedFlattenedSimulators);
                expect(meta.total).toBe(total);
                expect(meta.page).toBe(1);
                expect(meta.limit).toBe(10);
                expect(meta.totalPages).toBe(1);
                expect(meta.hasNextPage).toBe(false);
                expect(meta.hasPreviousPage).toBe(false);
            });

            it('should return correct totalPages and hasNextPage for multiple pages', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 25]);

                const query: SimulatorQueryDto = { page: 1, limit: 10 };
                const result = await service.find(query);
                const meta = getMeta(result);

                expect(meta.totalPages).toBe(3);
                expect(meta.hasNextPage).toBe(true);
                expect(meta.hasPreviousPage).toBe(false);
            });

            it('should set hasPreviousPage to true when on page 2', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 25]);

                const result = await service.find({ page: 2, limit: 10 });
                const meta = getMeta(result);

                expect(meta.hasPreviousPage).toBe(true);
                expect(meta.hasNextPage).toBe(true);
                expect(meta.page).toBe(2);
            });

            it('should set hasNextPage to false on last page', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 25]);

                const result = await service.find({ page: 3, limit: 10 });
                const meta = getMeta(result);

                expect(meta.hasNextPage).toBe(false);
                expect(meta.hasPreviousPage).toBe(true);
            });

            it('should default page=1 and limit=10 when not provided', async () => {
                mockTransaction.mockResolvedValue([mockSimulators, 5]);

                const result = await service.find({});
                const meta = getMeta(result);

                expect(meta.page).toBe(1);
                expect(meta.limit).toBe(10);
            });

            it('should return empty data when no simulators exist', async () => {
                mockTransaction.mockResolvedValue([[], 0]);

                const result = await service.find({ page: 1, limit: 10 });
                const meta = getMeta(result);

                expect(result.data).toEqual([]);
                expect(meta.total).toBe(0);
                expect(meta.totalPages).toBe(0);
                expect(meta.hasNextPage).toBe(false);
                expect(meta.hasPreviousPage).toBe(false);
            });

            it('should call $transaction once and return correct meta for page 3, limit 5', async () => {
                mockTransaction.mockResolvedValue([[], 100]);

                const result = await service.find({ page: 3, limit: 5 });
                const meta = getMeta(result);

                expect(mockTransaction).toHaveBeenCalledTimes(1);
                expect(meta.page).toBe(3);
                expect(meta.limit).toBe(5);
                expect(meta.hasPreviousPage).toBe(true);
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
                await service.find({ minPrice: 50, maxPrice: 300 });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            pricePerHour: { gte: 50, lte: 300 },
                        }),
                    }),
                );
            });

            it('should pass simTypeIds as typeList.some filter', async () => {
                await service.find({ simTypeIds: [1, 3] });

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

            it('should apply case-insensitive contains search across text fields', async () => {
                await service.find({ search: 'cockpit' });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.objectContaining({
                            OR: [
                                {
                                    simListName: {
                                        contains: 'cockpit',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    listDescription: {
                                        contains: 'cockpit',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    addressDetail: {
                                        contains: 'cockpit',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    mod: {
                                        modelName: {
                                            contains: 'cockpit',
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                                {
                                    mod: {
                                        brand: {
                                            brandName: {
                                                contains: 'cockpit',
                                                mode: 'insensitive',
                                            },
                                        },
                                    },
                                },
                            ],
                        }),
                    }),
                );
            });

            it('should not add typeList filter when simTypeIds is empty array', async () => {
                await service.find({ simTypeIds: [] });

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: expect.not.objectContaining({
                            typeList: expect.anything(),
                        }),
                    }),
                );
            });

            it('should apply sortBy PRICE DESC to orderBy', async () => {
                await service.find({
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
                await service.find({});

                expect(mockFindMany).toHaveBeenCalledWith(
                    expect.objectContaining({
                        orderBy: { id: 'asc' },
                    }),
                );
            });

            it('should combine all filters and pagination correctly', async () => {
                await service.find({
                    page: 2,
                    limit: 5,
                    search: 'bangkok',
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
                            OR: [
                                {
                                    simListName: {
                                        contains: 'bangkok',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    listDescription: {
                                        contains: 'bangkok',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    addressDetail: {
                                        contains: 'bangkok',
                                        mode: 'insensitive',
                                    },
                                },
                                {
                                    mod: {
                                        modelName: {
                                            contains: 'bangkok',
                                            mode: 'insensitive',
                                        },
                                    },
                                },
                                {
                                    mod: {
                                        brand: {
                                            brandName: {
                                                contains: 'bangkok',
                                                mode: 'insensitive',
                                            },
                                        },
                                    },
                                },
                            ],
                            cityId: 106448,
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
