import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const project = await prisma.project.findUnique({
        where: { id: 'cmm0n6al8000004l486bfi004' },
        select: {
            id: true,
            name: true,
            buyoutStatus: true,
            planName: true,
            stripeSubscriptionId: true,
            cancelledAt: true,
            exportExpiresAt: true,
            publishedAt: true,
        }
    });
    console.log(JSON.stringify(project, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
