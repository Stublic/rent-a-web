/**
 * Fix buyout status after testing
 * Run: node scripts/fix-buyout-status.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, buyoutStatus: true, planName: true }
    });
    console.log('Current projects:');
    console.log(JSON.stringify(projects, null, 2));

    // Find and delete the "Custom Web" project (created by mistake)
    const customWeb = projects.find(proj => proj.name === 'Custom Web');
    if (customWeb) {
        await prisma.project.delete({ where: { id: customWeb.id } });
        console.log('\n✅ Deleted Custom Web project:', customWeb.id);
    } else {
        console.log('\n⏭️ No Custom Web project found');
    }

    // Reset "Domaći prdeci Dražen" to NONE (for re-testing buyout)
    const domaci = projects.find(proj => proj.name && proj.name.includes('Doma'));
    if (domaci) {
        await prisma.project.update({
            where: { id: domaci.id },
            data: { buyoutStatus: 'NONE', exportExpiresAt: null }
        });
        console.log('✅ Reset buyout status for:', domaci.name);
    } else {
        console.log('⏭️ No matching project found');
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
