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
