import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, company, message } = body;

    if (!name || !email || !message) {
      return Response.json({ error: 'Ime, email i poruka su obavezni' }, { status: 400 });
    }

    // Gmail/Workspace specific transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Nodemailer ima predefinirane postavke za Gmail
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD, // Ovdje ide APP PASSWORD
      },
    });

    // Email to admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `Novi kontakt upit s platforme - ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #7c3aed;">Novi kontakt upit</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Ime:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            ${company ? `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Tvrtka:</strong></td><td style="padding: 10px; border-bottom: 1px solid #eee;">${company}</td></tr>` : ''}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${email}" style="color: #7c3aed;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Telefon:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone || 'Nije upisano'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; vertical-align: top; padding-top: 20px;"><strong>Poruka:</strong></td>
              <td style="padding: 10px; padding-top: 20px;">${message.replace(/\n/g, '<br>')}</td>
            </tr>
          </table>
        </div>
      `,
    });

    // Confirmation email to user
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Zaprimili smo vaš upit',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: left;">
          <div style="background: linear-gradient(135deg, #7c3aed, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
             <h1 style="color: white; margin: 0; font-size: 24px;">Zaprimili smo vaš upit</h1>
          </div>
          <div style="padding: 30px; background: #fafafa; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-top: 0;">Pozdrav ${name},</p>
            <p style="font-size: 15px; line-height: 1.5;">Hvala vam što ste nas kontaktirali! Uspješno smo zaprimili vašu poruku i naš tim će vam se javiti s konkretnim odgovorom u najkraćem mogućem roku.</p>
            <div style="margin: 24px 0; padding: 20px; background: #ffffff; border: 1px solid #e5e5e5; border-left: 4px solid #7c3aed; border-radius: 8px;">
              <strong style="color: #7c3aed;">Vaša poruka:</strong><br><br>
              <div style="color: #4b5563; line-height: 1.5;">${message.replace(/\n/g, '<br>')}</div>
            </div>
            <p style="margin-top: 30px; color: #666; font-size: 15px;">Radujemo se prilici za suradnju!<br><br>Srdačan pozdrav,<br><strong>Rent a webica tim</strong></p>
          </div>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Email API Error:', error);
    return Response.json({ error: 'Greška pri slanju emaila.' }, { status: 500 });
  }
}
