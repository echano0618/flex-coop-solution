import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export class MailerService {
  private static transporter: Transporter | null = null;

  public static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
      console.warn('[MAILER] SMTP credentials (SMTP_USER / SMTP_PASS) not configured. Real dispatch requires SMTP credentials.');
      return null;
    }

    const isGmail = user.toLowerCase().endsWith('@gmail.com') || (process.env.SMTP_HOST || '').includes('gmail');
    const host = process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'smtp.zoho.com');
    const port = parseInt(process.env.SMTP_PORT || '465', 10);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465 SSL, false for 587 TLS
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  public static async sendMail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const fromAddress = options.from || process.env.SMTP_FROM || 'support@tuntongtech.com';
    const transporter = this.getTransporter();

    if (!transporter) {
      console.log(`[MAILER SIMULATION] To: ${options.to} | Subject: ${options.subject} | From: ${fromAddress}`);
      return { success: true, messageId: `simulated-${Date.now()}` };
    }

    try {
      const info = await transporter.sendMail({
        from: `"Tuntong Tech Support" <${fromAddress}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text.replace(/\n/g, '<br/>'),
      });

      console.log(`[MAILER SUCCESS] Message sent to ${options.to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[MAILER ERROR] Failed to send email to ${options.to}:`, err);
      return { success: false, error: err.message || 'SMTP delivery failure' };
    }
  }
}
