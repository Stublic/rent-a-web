const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany();
    users.forEach(u => console.log(`User: ${u.id} | Email: ${u.email} | StripeID: ${u.stripeCustomerId}`));

    console.log('\n--- INVOICES ---');
    const invoices = await prisma.invoice.findMany();
    if (invoices.length === 0) {
        console.log('No invoices found in database.');
    } else {
        invoices.forEach(inv => console.log(`Invoice: ${inv.id} | User: ${inv.userId} | Invoice#: ${inv.invoiceNumber}`));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
