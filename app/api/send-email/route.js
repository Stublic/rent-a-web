import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, company, message } = body;

    // Validate inputs
    if (!name || !email || !message) {
      return Response.json({ error: 'Ime, email i poruka su obavezni' }, { status: 400 });
    }

    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const isSecure = smtpPort === 465;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1', // Windows hosting often uses older TLS
      }
    });

    // Email to admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAIL,
      subject: `🚀 Novi upit - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #22c55e;">Novi kontakt upit</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Ime:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            ${company ? `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Tvrtka:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${company}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
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
      subject: 'Primili smo vaš upit - Rent a Web',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #22c55e;">Hvala na upitu, ${name}!</h2>
          <p>Primili smo vašu poruku i javit ćemo vam se u roku 24 sata.</p>
          <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-left: 4px solid #22c55e;">
            <strong>Vaša poruka:</strong><br>
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p style="margin-top: 30px; color: #666;">
            Srdačan pozdrav,<br>
            <strong>Rent a Web tim</strong>
          </p>
        </div>
      `,
    });

    return Response.json({ success: true, message: 'Email uspješno poslan!' });
  } catch (error) {
    console.error('API Error (send-email):', error);
    return Response.json({
      error: 'Greška pri slanju emaila.',
      details: error.message
    }, { status: 500 });
  }
}
