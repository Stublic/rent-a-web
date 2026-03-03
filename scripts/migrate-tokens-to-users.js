/**
 * Migration script: Migrate editor tokens from project-level to user-level.
 * Run once: node scripts/migrate-tokens-to-users.js
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔄 Starting token migration from project → user...\n');

    const users = await prisma.user.findMany({
        where: { editorTokens: 0 },
        include: {
            projects: {
                select: { id: true, name: true, editorTokens: true }
            }
        }
    });

    console.log(`Found ${users.length} users with 0 account tokens to process.\n`);

    let migrated = 0;
    let skipped = 0;

    for (const user of users) {
        const totalProjectTokens = user.projects.reduce((sum, p) => sum + (p.editorTokens || 0), 0);

        if (totalProjectTokens === 0) {
            const hasActiveProject = user.projects.length > 0;
            if (hasActiveProject) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { editorTokens: 500 }
                });
                console.log(`✅ ${user.email}: 0 project tokens → granted default 500`);
                migrated++;
            } else {
                console.log(`⏭️  ${user.email}: no projects, skipping`);
                skipped++;
            }
        } else {
            await prisma.user.update({
                where: { id: user.id },
                data: { editorTokens: totalProjectTokens }
            });
            console.log(`✅ ${user.email}: migrated ${totalProjectTokens} tokens (${user.projects.map(p => `${p.name}: ${p.editorTokens}`).join(', ')})`);
            migrated++;
        }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Migrated: ${migrated} users`);
    console.log(`   Skipped:  ${skipped} users`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
