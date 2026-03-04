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
const GRACE_PERIOD_DAYS = 90;

// Reminder schedule: day after cancellation → email
const REMINDER_MILESTONES = [
    { day: 30, label: '2 mjeseca', urgency: 'low' },
    { day: 60, label: '1 mjesec', urgency: 'medium' },
    { day: 83, label: '7 dana', urgency: 'high' },
    { day: 87, label: '3 dana', urgency: 'critical' },
    { day: 89, label: '24 sata', urgency: 'critical' },
];

function getReminderEmail(projectName, planName, daysLeft, label, urgency, userName) {
    const name = userName ? ` ${userName}` : '';

    const urgencyColors = {
        low: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', headerBg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
        medium: { bg: '#fed7aa', border: '#f97316', text: '#9a3412', headerBg: 'linear-gradient(135deg, #f97316, #ea580c)' },
        high: { bg: '#fecaca', border: '#ef4444', text: '#991b1b', headerBg: 'linear-gradient(135deg, #ef4444, #dc2626)' },
        critical: { bg: '#fecaca', border: '#dc2626', text: '#7f1d1d', headerBg: 'linear-gradient(135deg, #dc2626, #b91c1c)' },
    };

    const colors = urgencyColors[urgency] || urgencyColors.medium;

    const subject = urgency === 'critical'
        ? `🚨 Još ${label} do brisanja vaše web stranice "${projectName}"`
        : urgency === 'high'
            ? `⚠️ Vaša web stranica "${projectName}" se briše za ${label}`
            : `📋 Podsjetnik: Web stranica "${projectName}" — brisanje za ${label}`;

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; background: #ffffff;">
            <div style="background: ${colors.headerBg}; padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0 0 8px; font-size: 22px;">
                    ${urgency === 'critical' ? '🚨' : urgency === 'high' ? '⚠️' : '📋'} Upozorenje pred brisanje
                </h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">
                    Vaši podaci za "${projectName}" istječu za ${label}
                </p>
            </div>
            <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                <p>Pozdrav${name},</p>
                <p>Vaša pretplata za web stranicu <strong>"${projectName}"</strong> (${planName}) je ranije otkazana i vaša stranica je trenutno offline.</p>

                <div style="background: ${colors.bg}; border: 1px solid ${colors.border}; border-left: 4px solid ${colors.border}; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: 600; color: ${colors.text}; font-size: 16px;">
                        ⏳ Garancija čuvanja podataka ističe za ${daysLeft} ${daysLeft === 1 ? 'dan' : 'dana'}
                    </p>
                    <p style="margin: 8px 0 0; color: ${colors.text}; font-size: 14px; line-height: 1.5;">
                        Nakon toga, cijela vaša stranica, dizajn, tekstovi i slike bit će <strong>trajno obrisani</strong> iz našeg sustava. Ne dajte da vaš dosadašnji trud propadne!
                    </p>
                </div>

                <p style="font-size: 15px;">Želite pod svaku cijenu zadržati svoju web stranicu i dosadašnji trud? Nastavite točno tamo gdje ste stali.</p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${APP_URL}/dashboard"
                       style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                        Obnovi pretplatu i sačuvaj podatke
                    </a>
                </div>

                <p style="color: #666; font-size: 13px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    Ukoliko svjesno želite obrisati podatke, slobodno ignorirajte ovu poruku. Podaci će se automatski obrisati na dan isteka roka.<br><br>
                    Srdačan pozdrav,<br><strong>Rent a webica tim</strong>
                </p>
            </div>
        </div>
    `;

    return { subject, html };
}

export async function GET(req) {
    // Verify cron secret
    if (!verifyCron(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transporter = createTransporter();
    const now = new Date();
    const results = { reminders_sent: 0, projects_deleted: 0, errors: 0, details: [] };

    try {
        // 1. Find all cancelled projects
        const cancelledProjects = await prisma.project.findMany({
            where: {
                cancelledAt: { not: null },
            },
            include: {
                user: { select: { id: true, email: true, name: true } },
            }
        });

        for (const project of cancelledProjects) {
            const cancelledAt = new Date(project.cancelledAt);
            const daysSinceCancellation = Math.floor((now.getTime() - cancelledAt.getTime()) / (1000 * 60 * 60 * 24));
            const daysLeft = GRACE_PERIOD_DAYS - daysSinceCancellation;

            // 2. Auto-delete if grace period expired
            if (daysSinceCancellation >= GRACE_PERIOD_DAYS) {
                try {
                    // Delete all related data
                    await prisma.blogPost.deleteMany({ where: { projectId: project.id } });
                    await prisma.blogCategory.deleteMany({ where: { projectId: project.id } });
                    await prisma.media.deleteMany({ where: { projectId: project.id } });
                    await prisma.invoice.deleteMany({ where: { projectId: project.id } });
                    await prisma.project.delete({ where: { id: project.id } });

                    results.projects_deleted++;
                    results.details.push({
                        project: project.name,
                        action: 'deleted',
                        daysSinceCancellation,
                    });

                    console.log(`🗑️ Permanently deleted project: ${project.name} (${project.id})`);

                    // Send final deletion confirmation email
                    if (project.user?.email) {
                        try {
                            await transporter.sendMail({
                                from: process.env.SMTP_FROM,
                                to: project.user.email,
                                subject: `❌ Web stranica "${project.name}" je trajno obrisana`,
                                html: `
                                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                                        <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a1a); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
                                            <h1 style="color: #ef4444; margin: 0; font-size: 24px;">❌ Podaci su trajno obrisani</h1>
                                        </div>
                                        <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
                                            <p style="font-size: 16px;">Pozdrav${project.user.name ? ` ${project.user.name}` : ''},</p>
                                            <p style="font-size: 15px; line-height: 1.6;">
                                                Kao što smo i najavili, prošlo je ${GRACE_PERIOD_DAYS} dana od ukidanja vaše pretplate. Svi podaci vaše web stranice <strong>"${project.name}"</strong> su sada trajno obrisani iz našeg sustava.
                                            </p>
                                            <p style="font-size: 15px; line-height: 1.6;">
                                                Žao nam je što odlazite, ali naša vrata ostaju otvorena. Ako u budućnosti poželite novu web stranicu, bit će nam nevjerojatno drago ponovno surađivati!
                                            </p>
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="${APP_URL}/dashboard/new-project" 
                                                   style="background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);">
                                                    Kreiraj novu stranicu →
                                                </a>
                                            </div>
                                            <p style="color: #666; font-size: 13px; border-top: 1px solid #eee; padding-top: 20px;">
                                                Želimo vam pregršt uspjeha u daljnjem poslovanju!<br><strong>Rent a webica tim</strong>
                                            </p>
                                        </div>
                                    </div>
                                `,
                            });
                        } catch (emailErr) {
                            console.error(`[Deletion] Failed to send deletion email for ${project.name}:`, emailErr.message);
                        }
                    }
                } catch (deleteErr) {
                    results.errors++;
                    results.details.push({
                        project: project.name,
                        action: 'delete_error',
                        error: deleteErr.message,
                    });
                    console.error(`❌ Failed to delete project ${project.name}:`, deleteErr.message);
                }
                continue;
            }

            // 3. Send reminder emails at milestones
            const sentReminders = project.deletionReminders
                ? project.deletionReminders.split(',').filter(Boolean).map(Number)
                : [];

            for (const milestone of REMINDER_MILESTONES) {
                // Check if this milestone should fire and hasn't been sent yet
                if (daysSinceCancellation >= milestone.day && !sentReminders.includes(milestone.day)) {
                    if (!project.user?.email) continue;

                    try {
                        const { subject, html } = getReminderEmail(
                            project.name,
                            project.planName,
                            daysLeft,
                            milestone.label,
                            milestone.urgency,
                            project.user.name
                        );

                        await transporter.sendMail({
                            from: process.env.SMTP_FROM,
                            to: project.user.email,
                            subject,
                            html,
                        });

                        // Track that this reminder was sent
                        const updatedReminders = [...sentReminders, milestone.day].join(',');
                        await prisma.project.update({
                            where: { id: project.id },
                            data: { deletionReminders: updatedReminders },
                        });
                        sentReminders.push(milestone.day); // Update local array for next iteration

                        results.reminders_sent++;
                        results.details.push({
                            project: project.name,
                            email: project.user.email,
                            milestone: milestone.day,
                            label: milestone.label,
                            status: 'sent',
                        });

                        console.log(`📧 Reminder sent for ${project.name}: ${milestone.label} before deletion`);
                    } catch (emailErr) {
                        results.errors++;
                        results.details.push({
                            project: project.name,
                            milestone: milestone.day,
                            status: 'error',
                            error: emailErr.message,
                        });
                        console.error(`❌ Failed to send reminder for ${project.name}:`, emailErr.message);
                    }
                }
            }
        }

        console.log(`[Deletion Reminders] Done: ${results.reminders_sent} reminders, ${results.projects_deleted} deleted, ${results.errors} errors`);
        return NextResponse.json({ ok: true, ...results });
    } catch (error) {
        console.error('[Deletion Reminders] Cron job error:', error);
        return NextResponse.json({ error: 'Internal error', details: error.message }, { status: 500 });
    }
}
