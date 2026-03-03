import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Protect cron endpoint with CRON_SECRET
function verifyCron(req) {
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return false;
    }
    return true;
}

function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://rent.webica.hr';

// Email templates
const emails = {
    3: {
        subject: '💡 Kako izvući maksimum iz AI editora? — Rent a webica',
        html: (name) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #22c55e; margin: 0 0 8px; font-size: 24px;">💡 Savjeti za AI Editor</h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Iskoristite puni potencijal vaše web stranice</p>
                </div>
                <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Pozdrav${name ? ` ${name}` : ''},</p>
                    <p>Vaša web stranica je spremna — evo kako je možete dodatno unaprijediti:</p>
                    
                    <div style="background: #fff; border: 1px solid #e5e5e5; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 12px; font-weight: 600;">🎯 3 brza savjeta:</p>
                        <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
                            <li><strong>Budite specifični</strong> — Umjesto "promijeni boju", recite "promijeni boju zaglavlja u tamno plavu #1e3a5f"</li>
                            <li><strong>Koristite Undo</strong> — Svaka izmjena se može poništiti jednim klikom</li>
                            <li><strong>Dodajte slike</strong> — Recite AI-u "dodaj sliku restorana u hero sekciju"</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                            Otvori Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        Srdačan pozdrav,<br><strong>Rent a webica tim</strong>
                    </p>
                </div>
            </div>
        `,
    },
    7: {
        subject: '🚀 Vaša web stranica čeka — trebate li pomoć?',
        html: (name) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #22c55e; margin: 0 0 8px; font-size: 24px;">🚀 Kako napredujete?</h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Već tjedan dana ste s nama!</p>
                </div>
                <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Pozdrav${name ? ` ${name}` : ''},</p>
                    <p>Prošao je tjedan dana otkad ste se pridružili Rent a webica platformi. Nadamo se da uživate u vašoj web stranici!</p>
                    
                    <div style="background: #fff; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 16px; font-weight: 600; margin: 0 0 12px;">Trebate pomoć?</p>
                        <p style="color: #666; margin: 0 0 16px;">Naš tim je tu za vas. Odgovaramo u roku od 24h.</p>
                        <a href="${APP_URL}" 
                           style="color: #22c55e; font-weight: 600; text-decoration: none;">
                            Kontaktirajte nas →
                        </a>
                    </div>
                    
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: 600; color: #166534;">💡 Jeste li znali?</p>
                        <p style="margin: 8px 0 0; color: #166534;">Možete koristiti AI editor za promjenu bilo kojeg dijela vaše stranice — od teksta do slika i boja. Sve bez kodiranja!</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                            Otvori Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        Srdačan pozdrav,<br><strong>Rent a webica tim</strong>
                    </p>
                </div>
            </div>
        `,
    },
    14: {
        subject: '⭐ Nadogradite iskustvo — posebna ponuda',
        html: (name, planName) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #22c55e; margin: 0 0 8px; font-size: 24px;">⭐ Dva tjedna s nama!</h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Hvala vam na povjerenju</p>
                </div>
                <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Pozdrav${name ? ` ${name}` : ''},</p>
                    <p>Već dva tjedna koristite Rent a webica. Hvala vam na povjerenju! 🎉</p>
                    
                    ${planName?.includes('Starter') ? `
                    <div style="background: linear-gradient(135deg, #faf5ff, #f0fdf4); border: 1px solid #d8b4fe; padding: 24px; border-radius: 12px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 18px; font-weight: 700; margin: 0 0 8px; color: #7c3aed;">Nadogradite na Advanced plan</p>
                        <p style="color: #666; margin: 0 0 16px;">Dobijte više tokena, prioritetnu podršku i napredne mogućnosti.</p>
                        <a href="${APP_URL}/dashboard" 
                           style="background: linear-gradient(135deg, #7c3aed, #22c55e); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                            Pogledaj planove →
                        </a>
                    </div>
                    ` : `
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: 600; color: #166534;">🌟 Pro savjet</p>
                        <p style="margin: 8px 0 0; color: #166534;">Razmislite o kupnji dodatnih AI tokena za još više personalizacije vaše stranice. Svaki token vam daje mogućnost jedne AI izmjene!</p>
                    </div>
                    `}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background: #22c55e; color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                            Otvori Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        Srdačan pozdrav,<br><strong>Rent a webica tim</strong>
                    </p>
                </div>
            </div>
        `,
    },
};

export async function GET(req) {
    // Verify cron secret
    if (!verifyCron(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transporter = createTransporter();
    const now = new Date();
    const results = { sent: 0, errors: 0, details: [] };

    try {
        // Process each drip stage: day 3, 7, 14
        for (const [dayStr, template] of Object.entries(emails)) {
            const day = parseInt(dayStr);

            // Find users who registered ~N days ago and haven't received this email yet
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() - day);

            // Window: users who registered between day-0.5 and day+0.5 (24h window)
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);

            const users = await prisma.user.findMany({
                where: {
                    createdAt: { gte: startOfDay, lte: endOfDay },
                    lastDripEmailSent: { lt: day },
                },
                select: { id: true, email: true, name: true, planName: true },
            });

            for (const user of users) {
                try {
                    await transporter.sendMail({
                        from: process.env.SMTP_FROM,
                        to: user.email,
                        subject: template.subject,
                        html: template.html(user.name, user.planName),
                    });

                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastDripEmailSent: day },
                    });

                    results.sent++;
                    results.details.push({ email: user.email, day, status: 'sent' });
                } catch (emailErr) {
                    results.errors++;
                    results.details.push({ email: user.email, day, status: 'error', error: emailErr.message });
                    console.error(`[Drip] Failed to send day ${day} email to ${user.email}:`, emailErr.message);
                }
            }
        }

        console.log(`[Drip] Completed: ${results.sent} sent, ${results.errors} errors`);
        return NextResponse.json({ ok: true, ...results });
    } catch (error) {
        console.error('[Drip] Cron job error:', error);
        return NextResponse.json({ error: 'Internal error', details: error.message }, { status: 500 });
    }
}
