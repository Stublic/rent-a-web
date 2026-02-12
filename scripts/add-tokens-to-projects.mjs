import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating projects with tokens...');

    // Update all projects with 0 tokens to have 500 tokens
    const result = await prisma.project.updateMany({
        where: {
            editorTokens: 0
        },
        data: {
            editorTokens: 500
        }
    });

    console.log(`✅ Updated ${result.count} projects with 500 tokens`);

    // Show current token status
    const projects = await prisma.project.findMany({
        select: {
            id: true,
            name: true,
            editorTokens: true
        }
    });

    console.log('\n📊 Token Status:');
    projects.forEach(p => {
        console.log(`  - ${p.name}: ${p.editorTokens} tokens`);
    });
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
