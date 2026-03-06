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
        subject: 'Kako izvući maksimum iz AI Editora?',
        html: (name) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #7c3aed; margin: 0 0 8px; font-size: 24px;">Savjeti za AI Editor</h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Iskoristite puni potencijal vaše web stranice</p>
                </div>
                <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Pozdrav${name ? ` ${name}` : ''},</p>
                    <p>Vaša platforma je već nekoliko dana s vama! Kako bismo vam pomogli da ostvarite savršen i moderan dizajn, pripremili smo kratki vodič za korištenje našeg inovativnog AI Editora.</p>
                    
                    <div style="background: #fff; border: 1px solid #e5e5e5; border-left: 4px solid #7c3aed; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0 0 12px; font-weight: 600; color: #7c3aed;">3 brza savjeta za profesionalan rezultat:</p>
                        <ol style="margin: 0; padding-left: 20px; line-height: 1.8; color: #4b5563;">
                            <li><strong>Budite precizni:</strong> Umjesto "promijeni boju", pokušajte nešto poput <em>"promijeni boju pozadine zaglavlja u tamno ljubičastu #4c1d95"</em>.</li>
                            <li><strong>Odvažite se na eksperimente:</strong> Svaka AI izmjena koju napravite može se trenutno poništiti tipkom <strong>Undo</strong>. Nema straha od pogreške!</li>
                            <li><strong>Fokusirani zahtjevi:</strong> AI radi najbolje kada zatražite jasnu, pojedinačnu izmjenu za specifičnu sekciju.</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                            Otvori Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        Zabavite se uređujući,<br><strong>Rent a webica tim</strong>
                    </p>
                </div>
            </div>
        `,
    },
    7: {
        subject: 'Kako napredujete? Tu smo ako vam treba pomoć!',
        html: (name) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #7c3aed; margin: 0 0 8px; font-size: 24px;">Kako napredujete?</h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Već tjedan dana ste s nama!</p>
                </div>
                <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Pozdrav${name ? ` ${name}` : ''},</p>
                    <p>Prošlo je točno tjedan dana od kreiranja vaše stranice! Iskreno se nadamo da ste zadovoljni rezultatom te da vaša webica već privlači prve upite.</p>
                    
                    <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0 0 12px; font-weight: 600; color: #6b21a8;">Savjet za brže uređivanje</p>
                        <p style="margin: 0; color: #6b21a8; line-height: 1.5;">
                            Dobra vijest! Za promjenu teksta, slika ili boja ne morate čekati na naš odgovor. Sve to možete odraditi sami, u par klikova, koristeći Vizualni ili AI Editor.
                        </p>
                    </div>

                    <div style="background: #fff; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 16px; font-weight: 600; margin: 0 0 12px;">Trebate tehničku asistenciju?</p>
                        <p style="color: #666; margin: 0 0 16px;">Ako pak zapnete s tehničkim stvarima (poput spajanja domene), naš tim je tu i odgovara unutar 24 sata.</p>
                        <a href="${APP_URL}" 
                           style="color: #7c3aed; font-weight: 600; text-decoration: none;">
                            Kontaktirajte Podršku →
                        </a>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                            Otvori Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        Vaš uspjeh je naš apsolutni prioritet.<br><strong>Rent a webica tim</strong>
                    </p>
                </div>
            </div>
        `,
    },
    14: {
        subject: 'Podignite svoju web stranicu na iduću razinu',
        html: (name, planName) => `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
                <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: #7c3aed; margin: 0 0 8px; font-size: 24px;">Dva tjedna s nama!</h1>
                    <p style="color: #a1a1aa; margin: 0; font-size: 14px;">Hvala vam na povjerenju</p>
                </div>
                <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                    <p>Pozdrav${name ? ` ${name}` : ''},</p>
                    <p>Uživamo vidjeti kako se vaša web prisutnost razvija kroz ova dva tjedna. Hvala vam na povjerenju!</p>
                    
                    ${planName?.includes('Starter') ? `
                    <div style="background: linear-gradient(135deg, #faf5ff, #f3e8ff); border: 1px solid #d8b4fe; padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center;">
                        <p style="font-size: 18px; font-weight: 700; margin: 0 0 12px; color: #7c3aed;">Nadogradite na Advanced plan</p>
                        <p style="color: #4b5563; margin: 0 0 20px; line-height: 1.6;">
                            Ako vaša trenutna <em>one-page</em> stranica više ne zadovoljava sve vaše potrebe, razmislite o <strong>Advanced planu</strong>. 
                            Otključat će vam mogućnost neograničenih podstranica, integrirani SEO Blog sustav s 20 besplatnih AI članaka mjesečno, te još veći broj AI tokena za sve vaše kreativne ideje!
                        </p>
                        <a href="${APP_URL}/dashboard/settings" 
                           style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                            Pogledaj planove →
                        </a>
                    </div>
                    ` : `
                    <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-weight: 600; color: #6b21a8;">Osvježite identitet</p>
                        <p style="margin: 8px 0 0; color: #6b21a8; line-height: 1.5;">
                            Vaša web stranica već sada izgleda moćno! Ako joj nekad poželite u potpunosti osvježiti identitet, prisjetite se opcije <strong>"Promjena stila"</strong> u dashboardu koja će prepakirati trenutni sadržaj u jedan od 20 sofisticiranih predložaka.
                        </p>
                    </div>
                    `}
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${APP_URL}/dashboard" 
                           style="background: #ffffff; color: #7c3aed; border: 1px solid #7c3aed; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
                            Provjerite opcije u Dashboardu
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        Puno uspjeha u poslovanju želi vam,<br><strong>Rent a webica tim</strong>
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
