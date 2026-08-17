import nodemailer, { Transporter } from 'nodemailer';

// No real SMTP provider is configured for local development, so this
// auto-provisions a throwaway Ethereal inbox (https://ethereal.email) on
// first use — nothing is actually delivered to a real mailbox, but the
// send genuinely succeeds and the message is viewable via the preview URL
// logged to the console. Set SMTP_HOST/SMTP_USER/SMTP_PASS (and friends) to
// point this at a real provider before going live.
let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
    }

    const testAccount = await nodemailer.createTestAccount();
    console.log(`[mailer] No SMTP_HOST configured — using a throwaway Ethereal test inbox (${testAccount.user}).`);
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Sartora" <no-reply@sartora.example>',
    to,
    subject,
    html,
  });
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) console.log(`[mailer] "${subject}" to ${to} — preview: ${previewUrl}`);
}
