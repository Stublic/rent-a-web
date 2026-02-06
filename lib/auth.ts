import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },
    // Adding custom fields to the user session
    user: {
        additionalFields: {
            subscriptionStatus: {
                type: "string",
                required: false,
            },
            stripeCustomerId: {
                type: "string",
                required: false,
            },
            planName: {
                type: "string",
                required: false,
            }
        }
    },
    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // check for pending subscription
                    const sub = await prisma.stripeSubscription.findUnique({
                        where: { email: user.email }
                    });
                    if (sub) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                subscriptionStatus: sub.status,
                                stripeCustomerId: sub.stripeCustomerId,
                                planName: sub.planName
                            }
                        });
                    }
                }
            }
        }
    }
});
