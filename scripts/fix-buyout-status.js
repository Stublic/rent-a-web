const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    const projects = await p.project.findMany({
        select: { id: true, name: true, buyoutStatus: true, planName: true }
    });
    console.log(JSON.stringify(projects, null, 2));

    // Find and delete the "Custom Web" project (created by mistake)
    const customWeb = projects.find(proj => proj.name === 'Custom Web');
    if (customWeb) {
        await p.project.delete({ where: { id: customWeb.id } });
        console.log('Deleted Custom Web project:', customWeb.id);
    }

    // Reset "Domaći prdeci Dražen" to NONE (for re-testing)
    const domaci = projects.find(proj => proj.name && proj.name.includes('Doma'));
    if (domaci) {
        await p.project.update({
            where: { id: domaci.id },
            data: { buyoutStatus: 'NONE', exportExpiresAt: null }
        });
        console.log('Reset buyout status for:', domaci.name);
    }

    await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
