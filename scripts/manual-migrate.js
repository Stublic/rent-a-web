const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Manually parse .env.local
let connectionString = process.env.DATABASE_URL;
let stripeKey = process.env.STRIPE_SECRET_KEY;

if (!connectionString || !stripeKey) {
    try {
        const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
        const lines = envFile.split('\n');

        if (!connectionString) {
            const dbUrlLine = lines.find(line => line.startsWith('DATABASE_URL='));
            if (dbUrlLine) connectionString = dbUrlLine.split('=')[1].replace(/"/g, '').trim();
        }

        if (!stripeKey) {
            const stripeLine = lines.find(line => line.startsWith('STRIPE_SECRET_KEY='));
            if (stripeLine) stripeKey = stripeLine.split('=')[1].replace(/"/g, '').trim();
        }

        console.log("Loaded env from .env.local");
    } catch (e) {
        console.warn("Could not read .env.local");
    }
}

if (!connectionString) {
    console.error("DATABASE_URL not found!");
    process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const stripe = new Stripe(stripeKey);

// Map price IDs to plan names (using values from env or hardcoded/known values)
// Ideally we read these from env too, but for migration we can check the price object or use logic
const getPlanNameFromPrice = (priceId) => {
    // You can add known IDs here if you have them, otherwise default to "Unknown/Custom"
    // Or fetch product details. For now, simple fallback.
    // Replace these with actual IDs if known or printed from logs
    return "Unknown Plan";
}

async function main() {
    console.log("Starting Stripe Sync Migration...");
    try {
        // 1. Find all users to check against Stripe
        const users = await prisma.user.findMany();

        console.log(`Checking ${users.length} users against Stripe...`);

        for (const user of users) {
            console.log(`Checking user: ${user.email}`);

            try {
                // Search for customers by email
                const customers = await stripe.customers.search({
                    query: `email:'${user.email}'`,
                });

                for (const customer of customers.data) {
                    console.log(`  -> Found Stripe Customer: ${customer.id}`);

                    const subscriptions = await stripe.subscriptions.list({
                        customer: customer.id,
                        status: 'all', // Check ALL statuses, not just active
                    });

                    console.log(`     -> Found ${subscriptions.data.length} subscriptions.`);

                    for (const sub of subscriptions.data) {
                        // Check if project exists with this subscription ID
                        const existingProject = await prisma.project.findUnique({
                            where: { stripeSubscriptionId: sub.id }
                        });

                        if (!existingProject && (sub.status === 'active' || sub.status === 'trialing')) {
                            // Determine Plan Name
                            const price = sub.items.data[0].price;
                            // Fetch product to get name if possible
                            let planName = "Custom Plan";
                            if (price.id === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER) planName = "Starter";
                            if (price.id === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ADVANCED) planName = "Advanced";
                            if (price.id === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BUSINESS) planName = "Paket za poduzetnike";

                            // Fallback to fetching product
                            if (planName === "Custom Plan") {
                                try {
                                    const product = await stripe.products.retrieve(price.product);
                                    planName = product.name;
                                } catch (e) {
                                    console.warn("Could not fetch product name", e.message);
                                }
                            }

                            console.log(`        -> Creating project for sub ${sub.id} (${planName})`);

                            await prisma.project.create({
                                data: {
                                    userId: user.id,
                                    name: `${planName || 'Moj'} Web`,
                                    planName: planName,
                                    stripeSubscriptionId: sub.id,
                                    status: 'DRAFT'
                                }
                            });
                        } else {
                            console.log(`        -> Skipped sub ${sub.id} (Status: ${sub.status}, Exists: ${!!existingProject})`);
                        }
                    }
                }

            } catch (stripeErr) {
                console.error(`  -> Stripe error for user ${user.email}:`, stripeErr.message);
            }
        }
        console.log("Migration complete.");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
