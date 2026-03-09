/* eslint-disable */
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { materializeSchedule } from 'src/common/utils/materialization-schedule';
import { Logger } from '@nestjs/common';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const logger = new Logger('ScheduleMaterializationScript');
    console.log('ScheduleMaterializationScript Seeding started...');

    materializeSchedule(prisma, 60, logger);
}

main()
    .catch((e) => {
        console.error('ScheduleMaterializationScript Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
