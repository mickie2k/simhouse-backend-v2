/* eslint-disable */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { gunzipSync } from 'zlib';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const API_BASE =
    'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/';

async function fetchJson<T>(endpoint: string): Promise<T[]> {
    console.log(`Fetching ${endpoint}.json...`);
    const response = await fetch(`${API_BASE}${endpoint}.json`);
    if (!response.ok)
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    return response.json() as Promise<T[]>;
}

async function fetchGzipJson<T>(endpoint: string): Promise<T[]> {
    const response = await fetch(`${API_BASE}${endpoint}.json.gz`);
    const buffer = Buffer.from(await response.arrayBuffer());
    return JSON.parse(gunzipSync(buffer).toString('utf-8')) as T[];
}

async function main() {
    console.log('Seeding started...');

    // Countries — use source id directly
    const countries = await fetchJson<{
        id: number;
        name: string;
        iso2: string;
    }>('countries');
    await prisma.country.createMany({
        data: countries.map(({ id, name, iso2 }) => ({ id, name, code: iso2 })),
        skipDuplicates: true,
    });
    console.log(`Seeded ${countries.length} countries.`);

    // Provinces (States) — source has id and country_id already
    const states = await fetchJson<{
        id: number;
        name: string;
        iso2: string;
        country_id: number;
    }>('states');
    await prisma.province.createMany({
        data: states.map(({ id, name, iso2, country_id }) => ({
            id,
            name,
            code: iso2 || null,
            countryId: country_id,
        })),
        skipDuplicates: true,
    });
    console.log(`Seeded ${states.length} provinces.`);

    // Build set of valid province IDs to guard against orphan state_id references in cities
    const validProvinceIds = new Set(
        (await prisma.province.findMany({ select: { id: true } })).map(
            (p) => p.id,
        ),
    );

    // Cities — source has id, state_id (provinceId), and country_id
    const cities = await fetchGzipJson<{
        id: number;
        name: string;
        state_id: number;
        country_id: number;
    }>('cities');

    const BATCH_SIZE = 1000;
    for (let i = 0; i < cities.length; i += BATCH_SIZE) {
        await prisma.city.createMany({
            data: cities
                .slice(i, i + BATCH_SIZE)
                .map(({ id, name, state_id, country_id }) => ({
                    id,
                    name,
                    provinceId: validProvinceIds.has(state_id)
                        ? state_id
                        : null,
                    countryId: country_id,
                })),
            skipDuplicates: true,
        });
        if (i % 10000 === 0) console.log(`  Cities: ${i} / ${cities.length}`);
    }
    console.log(`Seeded ${cities.length} cities.`);

    // Seed Simulator Brands
    const brands = [
        { brandName: 'Simucube' },
        { brandName: 'MOZA Racing' },
        { brandName: 'Fanatec' },
        { brandName: 'Simagic' },
        { brandName: 'Thrustmaster' },
        { brandName: 'Asetek' },
        { brandName: 'Heusinkveld Engineering' },
        { brandName: 'Sim-Lab' },
        { brandName: 'Logitech' },
        { brandName: 'Virtual Racing School' },
        { brandName: 'Simtrecs' },
        { brandName: 'BJ Steel Simracing' },
        { brandName: 'Simracing Alien' },
        { brandName: 'P1 Sim' },
        { brandName: 'Sim Jack' },
        { brandName: 'SRC' },
        { brandName: 'Wave Italy' },
        { brandName: 'Simforge' },
        { brandName: 'Simxperience' },
        { brandName: 'EPLAB' },
    ];

    const existingBrands = await prisma.simulatorBrand.findMany({
        select: { brandName: true },
    });
    const existingBrandNames = new Set(
        existingBrands.map((brand) => brand.brandName.toLowerCase()),
    );
    const brandsToCreate = brands.filter(
        (brand) => !existingBrandNames.has(brand.brandName.toLowerCase()),
    );

    if (brandsToCreate.length > 0) {
        await prisma.simulatorBrand.createMany({
            data: brandsToCreate,
            skipDuplicates: true,
        });
    }
    console.log(
        `Simulator brands ready: ${brands.length} (${brandsToCreate.length} newly added).`,
    );

    // Fetch created brands for reference
    const allBrands = await prisma.simulatorBrand.findMany();
    const brandMap = new Map(allBrands.map((b) => [b.brandName, b.id]));

    // Seed Simulator Models (Wheelbases)
    const simulatorModels = [
        // Simucube Models
        {
            modelName: 'Simucube 2 Pro',
            description: 'Direct drive wheelbase with 25 Nm peak torque',
            brandId: brandMap.get('Simucube'),
        },
        {
            modelName: 'Simucube 2 Sport',
            description: 'Mid-range direct drive with 20 Nm torque',
            brandId: brandMap.get('Simucube'),
        },
        {
            modelName: 'Simucube 2 Ultimate',
            description: 'Premium direct drive with 30 Nm peak torque',
            brandId: brandMap.get('Simucube'),
        },
        {
            modelName: 'Simucube 3 Pro',
            description: 'Latest generation direct drive wheelbase',
            brandId: brandMap.get('Simucube'),
        },
        // MOZA Racing Models
        {
            modelName: 'MOZA R5',
            description: 'Entry-level direct drive wheelbase with 5 Nm torque',
            brandId: brandMap.get('MOZA Racing'),
        },
        {
            modelName: 'MOZA R9',
            description: 'Direct drive wheelbase with 9 Nm peak torque',
            brandId: brandMap.get('MOZA Racing'),
        },
        {
            modelName: 'MOZA R21',
            description: 'Professional direct drive with 21 Nm torque',
            brandId: brandMap.get('MOZA Racing'),
        },
        {
            modelName: 'MOZA R25 Ultra',
            description: 'Premium direct drive with 25 Nm torque',
            brandId: brandMap.get('MOZA Racing'),
        },
        // Fanatec Models
        {
            modelName: 'Fanatec CSL DD 5NM',
            description: 'Entry-level direct drive with 5 Nm torque',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec CSL DD 8NM',
            description: 'Direct drive wheelbase with 8 Nm peak torque',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec Gran Turismo DD Pro',
            description: 'Mid-range direct drive with 12 Nm torque',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec Clubsport DD',
            description: 'Direct drive wheelbase with 15 Nm torque',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec Clubsport DD+',
            description: 'Enhanced Clubsport DD with 20 Nm torque',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec Podium DD1',
            description: 'Professional direct drive with 25 Nm torque',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec Podium DD (25 Nm)',
            description: 'Premium direct drive system',
            brandId: brandMap.get('Fanatec'),
        },
        {
            modelName: 'Fanatec Podium DD2',
            description: 'Ultra-premium direct drive with 35 Nm peak torque',
            brandId: brandMap.get('Fanatec'),
        },
        // Simagic Models
        {
            modelName: 'Simagic Alpha Mini',
            description: 'Compact direct drive with 8 Nm torque',
            brandId: brandMap.get('Simagic'),
        },
        {
            modelName: 'Simagic Alpha',
            description: 'Direct drive wheelbase with 12 Nm torque',
            brandId: brandMap.get('Simagic'),
        },
        {
            modelName: 'Simagic Alpha U',
            description: 'Professional direct drive with 20 Nm torque',
            brandId: brandMap.get('Simagic'),
        },
        // Thrustmaster Models
        {
            modelName: 'Thrustmaster T300',
            description: 'Entry-level belt-driven servo base',
            brandId: brandMap.get('Thrustmaster'),
        },
        {
            modelName: 'Thrustmaster TS-XW',
            description: 'Advanced belt-driven servo base',
            brandId: brandMap.get('Thrustmaster'),
        },
        {
            modelName: 'Thrustmaster T-GT II',
            description: 'Professional servo-based wheelbase',
            brandId: brandMap.get('Thrustmaster'),
        },
        {
            modelName: 'Thrustmaster T818',
            description: 'Direct drive wheelbase with 18 Nm torque',
            brandId: brandMap.get('Thrustmaster'),
        },
        // Asetek Models
        {
            modelName: 'Asetek Forte',
            description: 'Direct drive wheelbase with 18 Nm torque',
            brandId: brandMap.get('Asetek'),
        },
        {
            modelName: 'Asetek Invicta',
            description: 'Professional direct drive with 27 Nm peak torque',
            brandId: brandMap.get('Asetek'),
        },
        // Logitech Models
        {
            modelName: 'Logitech PRO Racing DD11',
            description: 'Direct drive wheelbase with 11 Nm torque',
            brandId: brandMap.get('Logitech'),
        },
        // Virtual Racing School
        {
            modelName: 'Virtual Racing School VRS',
            description: 'Professional direct drive wheelbase',
            brandId: brandMap.get('Virtual Racing School'),
        },
        // Simxperience
        {
            modelName: 'Simxperience AccuForce Your Way V2',
            description: 'Professional steering system',
            brandId: brandMap.get('Simxperience'),
        },
    ];

    const existingModels = await prisma.simulatorMod.findMany({
        select: { modelName: true },
    });
    const existingModelNames = new Set(
        existingModels.map((model) => model.modelName.toLowerCase()),
    );
    const modelsToCreate = simulatorModels.filter(
        (model) =>
            !existingModelNames.has(model.modelName.toLowerCase()) &&
            model.brandId !== undefined,
    );

    if (modelsToCreate.length > 0) {
        await prisma.simulatorMod.createMany({
            data: modelsToCreate,
            skipDuplicates: true,
        });
    }
    console.log(
        `Simulator models ready: ${simulatorModels.length} (${modelsToCreate.length} newly added).`,
    );

    // Seed Pedal Models
    const pedalModels = [
        // Simucube Pedals
        {
            modelName: 'Simucube ActivePedal Ultimate',
            description: 'Premium active pedal set with advanced customization',
            brandId: brandMap.get('Simucube'),
        },
        {
            modelName: 'Simucube Throttle',
            description: 'Single throttle pedal module',
            brandId: brandMap.get('Simucube'),
        },
        // Simagic Pedals
        {
            modelName: 'Simagic P-S200 Loadcell',
            description: 'Load cell brake sensor for pedal systems',
            brandId: brandMap.get('Simagic'),
        },
        {
            modelName: 'Simagic P1000 Modular Pedal',
            description: 'Modular pedal system with 589 EUR starting price',
            brandId: brandMap.get('Simagic'),
        },
        {
            modelName: 'Simagic P2000-R Hydraulic Pedals',
            description: 'Hydraulic pedal set with realistic feedback',
            brandId: brandMap.get('Simagic'),
        },
        // Heusinkveld
        {
            modelName: 'Heusinkveld Ultimate+ 3 Pedals',
            description: 'Premium 3-pedal set with load cell brakes',
            brandId: brandMap.get('Heusinkveld Engineering'),
        },
        // BJ Steel Simracing Pedals
        {
            modelName: 'BJ Steel F1 Pro',
            description: 'Professional F1-style pedal system',
            brandId: brandMap.get('BJ Steel Simracing'),
        },
        {
            modelName: 'BJ Steel F1 HYDRAULIC Pro',
            description: 'Hydraulic F1 pedal system with 780 EUR price',
            brandId: brandMap.get('BJ Steel Simracing'),
        },
        {
            modelName: 'BJ Steel GT HYDRAULIC Pro',
            description: 'Hydraulic GT-style pedal set',
            brandId: brandMap.get('BJ Steel Simracing'),
        },
        // Sim Jack
        {
            modelName: 'Sim Jack Pro Pedals',
            description: 'Professional pedal set starting at 208 EUR',
            brandId: brandMap.get('Sim Jack'),
        },
        // SRC (Sim Race Components)
        {
            modelName: 'SRC X1F Esports Pedals',
            description: 'Professional esports pedal system',
            brandId: brandMap.get('SRC'),
        },
        // P1 Sim
        {
            modelName: 'P1 Mistral 2 Pedal Set',
            description: '2-pedal set with professional features',
            brandId: brandMap.get('P1 Sim'),
        },
        // Thrustmaster Pedals
        {
            modelName: 'Thrustmaster T-LCM Pedals',
            description: 'Load cell pedal set with 249.99 EUR price',
            brandId: brandMap.get('Thrustmaster'),
        },
        // Simracing Alien Pedals
        {
            modelName: 'Simracing Alien Racing 2-Pedals',
            description: '2-pedal racing set at 579 EUR',
            brandId: brandMap.get('Simracing Alien'),
        },
        {
            modelName: 'Simracing Alien Racing 3-Pedals',
            description: '3-pedal racing set at 759 EUR',
            brandId: brandMap.get('Simracing Alien'),
        },
        // Sim-Lab
        {
            modelName: 'Sim-Lab Pedal Set XP1 Loadcell',
            description: 'Load cell pedal set with professional quality',
            brandId: brandMap.get('Sim-Lab'),
        },
        // Wave Italy
        {
            modelName: 'Wave Italy WAVE FORCE SIM PEDALS PRO',
            description: 'Premium pedal system at 1360 EUR',
            brandId: brandMap.get('Wave Italy'),
        },
        // MOZA Racing
        {
            modelName: 'MOZA CRP2 Load Cell Pedals',
            description: 'Load cell pedal set by MOZA Racing',
            brandId: brandMap.get('MOZA Racing'),
        },
        // Simtrecs
        {
            modelName: 'Simtrecs ProPedal GT 2-Pedal Set',
            description: '2-pedal GT-style system at 1073.15 EUR',
            brandId: brandMap.get('Simtrecs'),
        },
        // Simforge
        {
            modelName: 'Simforge Mark-1 3-Pedal Set',
            description: 'Mark-1 3-pedal racing set',
            brandId: brandMap.get('Simforge'),
        },
    ];

    const existingPedals = await prisma.pedal.findMany({
        select: { modelName: true },
    });
    const existingPedalNames = new Set(
        existingPedals.map((pedal) => pedal.modelName.toLowerCase()),
    );
    const pedalsToCreate = pedalModels.filter(
        (pedal) =>
            !existingPedalNames.has(pedal.modelName.toLowerCase()) &&
            pedal.brandId !== undefined,
    );

    if (pedalsToCreate.length > 0) {
        await prisma.pedal.createMany({
            data: pedalsToCreate,
            skipDuplicates: true,
        });
    }
    console.log(
        `Pedal models ready: ${pedalModels.length} (${pedalsToCreate.length} newly added).`,
    );

    const reviewTypeLabels = [
        'Cleanliness',
        'Communication',
        'Check-in',
        'Accuracy',
        'Location',
        'Value',
    ];
    const existingReviewTypes = await prisma.simulatorReviewType.findMany({
        select: { typeName: true },
    });
    const existingTypeNames = new Set(
        existingReviewTypes.map((reviewType) =>
            reviewType.typeName.toLowerCase(),
        ),
    );
    const reviewTypesToCreate = reviewTypeLabels
        .filter((label) => !existingTypeNames.has(label.toLowerCase()))
        .map((typeName) => ({ typeName }));

    if (reviewTypesToCreate.length > 0) {
        await prisma.simulatorReviewType.createMany({
            data: reviewTypesToCreate,
        });
    }
    console.log(
        `Simulator review types ready: ${reviewTypeLabels.length} (${reviewTypesToCreate.length} newly added).`,
    );

    console.log('Seeding completed!');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
