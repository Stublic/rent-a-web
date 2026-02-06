import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        async sendResetPassword({ user, url, token }) {
            const nodemailer = await import("nodemailer");
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: user.email,
                subject: 'Resetiranje lozinke - Rent a Web',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #22c55e;">Resetirajte svoju lozinku</h2>
                        <p>Primili smo zahtjev za resetiranje lozinke za vaš Rent a Web račun.</p>
                        <p>Kliknite na gumb ispod kako biste postavili novu lozinku. Link je važeći 1 sat.</p>
                        <div style="margin: 30px 0;">
                            <a href="${url}" style="background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-bold: true;">Postavi novu lozinku</a>
                        </div>
                        <p style="color: #666; font-size: 14px;">Ako niste zatražili resetiranje, slobodno ignorirajte ovaj email.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px;">Rent a Web tim</p>
                    </div>
                `,
            });
        },
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
    },
    trustedOrigins: [
        "https://rent-a-web-git-user-dashboard-stublics-projects.vercel.app",
        "https://rent.webica.hr",
        "https://*.vercel.app"
    ],
    rateLimit: {
        enabled: false,
    }
});
