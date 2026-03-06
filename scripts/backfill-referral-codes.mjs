/**
 * Backfill referral codes for existing users who don't have one.
 * Run: node scripts/backfill-referral-codes.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function generateCode(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function main() {
    const users = await prisma.user.findMany({
        where: { referralCode: null },
        select: { id: true, email: true },
    });

    console.log(`Found ${users.length} users without referral codes.`);

    let updated = 0;
    for (const user of users) {
        let code;
        let isUnique = false;

        // Generate unique code with retry
        while (!isUnique) {
            code = generateCode();
            const existing = await prisma.user.findUnique({ where: { referralCode: code } });
            if (!existing) isUnique = true;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { referralCode: code },
        });

        updated++;
        console.log(`  ✅ ${user.email} → ${code}`);
    }

    console.log(`\nDone! Updated ${updated} users.`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
