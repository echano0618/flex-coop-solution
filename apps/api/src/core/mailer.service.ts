import nodemailer, { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export interface MemberApplicationReceivedData {
  applicantName: string;
  email: string;
  phone?: string;
  address?: string;
  appId: string;
  memberNumber?: string;
  coopName?: string;
  coopSlug?: string;
  subscribedShares?: number;
  totalSubscribedAmount?: number;
  initialDeposit?: number;
}

export interface MemberApplicationDecisionData {
  applicantName: string;
  email: string;
  appId?: string;
  memberNumber?: string;
  coopName?: string;
  coopSlug?: string;
  decision: 'APPROVED' | 'REJECTED';
  notes?: string;
  reviewedBy?: string;
  reviewDate?: string;
  actualDeposit?: number;
}

export class MailerService {
  private static transporter: Transporter | null = null;

  public static getTransporter(): Transporter | null {
    if (this.transporter) return this.transporter;

    if (process.env.NODE_ENV === 'test') {
      return null;
    }

    // Use environment variables with production defaults to guarantee delivery
    const user = process.env.SMTP_USER || 'felix.echano@tuntongtech.com';
    const pass = process.env.SMTP_PASS || 'Yq3D*wMhUpcx8A*';

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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
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

  /**
   * Dispatches confirmation email when a user submits a cooperative member application
   */
  public static async sendMemberApplicationReceived(data: MemberApplicationReceivedData): Promise<void> {
    const cName = data.coopName || 'Cooperative Enterprise';
    const shares = data.subscribedShares || 50;
    const pledge = (data.totalSubscribedAmount || 5000).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const deposit = (data.initialDeposit || 1000).toLocaleString('en-PH', { minimumFractionDigits: 2 });

    const subject = `[${cName}] Membership Application Confirmation (${data.appId})`;
    const text = `Dear ${data.applicantName},\n\n` +
      `Thank you for applying for membership with ${cName}!\n\n` +
      `We have successfully received your membership application and eKYC onboarding submission. Your application has been logged under reference ID:\n\n` +
      `    ${data.appId}\n\n` +
      `• Application Summary:\n` +
      `- Applicant Name: ${data.applicantName}\n` +
      `- Registered Email: ${data.email}\n` +
      `- Mobile Number: ${data.phone || 'N/A'}\n` +
      `- Residence Address: ${data.address || 'Philippines'}\n` +
      `- Subscribed Shares: ${shares} shares (₱${pledge})\n` +
      `- Initial Capital Commitment: ₱${deposit}\n` +
      `- PMES Requirement: Certified Completed\n` +
      `- Current Status: UNDER COMMITTEE REVIEW\n\n` +
      `• Next Steps:\n` +
      `1. The Membership & Credit Committee will review your identity verification documents and underwriting details pursuant to CDA RA 9520 and the Data Privacy Act (RA 10173).\n` +
      `2. You will receive an official notification once your membership has been approved or if additional information is required.\n` +
      `3. Once approved, you can log in to your Member Portal using your registered email and 6-digit MPIN.\n\n` +
      `If you have any questions regarding your application, please reach out to the cooperative administration desk or reply directly to this notification.\n\n` +
      `Sincerely,\n` +
      `${cName} Membership & Credit Committee\n` +
      `Powered by Tuntong Tech Cooperative SaaS\n` +
      `support@tuntongtech.com\n` +
      `https://tuntongtech.com`;

    try {
      await this.sendMail({
        to: data.email,
        subject,
        text,
      });
    } catch (err) {
      console.error('[MAILER ERROR] sendMemberApplicationReceived:', err);
    }
  }

  /**
   * Dispatches approval or rejection notice when a membership application is reviewed
   */
  public static async sendMemberApplicationDecision(data: MemberApplicationDecisionData): Promise<void> {
    const cName = data.coopName || 'Cooperative Enterprise';
    const isApproved = data.decision === 'APPROVED';
    const memNo = data.memberNumber || data.appId || 'MEM-2026';
    const dateStr = data.reviewDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const reviewer = data.reviewedBy || 'Membership & Credit Committee';

    if (isApproved) {
      const subject = `[${cName}] Congratulations! Your Membership Application has been Approved`;
      const text = `Dear ${data.applicantName},\n\n` +
        `Congratulations! We are delighted to inform you that your membership application with ${cName} has been officially APPROVED and CONFIRMED by the Membership & Credit Committee.\n\n` +
        `• Your Membership Record:\n` +
        `- Member ID: ${memNo}\n` +
        `- Member Classification: REGULAR Member (With Voting Rights)\n` +
        `- eKYC Status: VERIFIED\n` +
        `- Approval Date: ${dateStr}\n` +
        `- Endorsed By: ${reviewer}\n` +
        (data.notes ? `- Committee Resolution: ${data.notes}\n` : '') +
        `\n• Member Self-Service Portal Access:\n` +
        `You can now access your cooperative accounts, view your share capital and savings balance, and apply for loan products anytime through the Member Portal:\n` +
        `Portal URL: https://${data.coopSlug ? data.coopSlug + '-coop.' : ''}tuntongtech.com/member/login\n` +
        `- Sign-in: ${data.email}\n` +
        `- Passcode: Your 6-digit MPIN created during registration\n\n` +
        `• Capital Build-Up (CBU):\n` +
        `Your share capital is payable over-the-counter (OTC) at our cashier desk or via QR Ph instant payment.\n\n` +
        `Welcome to ${cName}! We look forward to your active participation in our cooperative community.\n\n` +
        `Sincerely,\n` +
        `${cName} Membership & Credit Committee\n` +
        `support@tuntongtech.com\n` +
        `https://tuntongtech.com`;

      try {
        await this.sendMail({
          to: data.email,
          subject,
          text,
        });
      } catch (err) {
        console.error('[MAILER ERROR] sendMemberApplicationDecision (APPROVED):', err);
      }
    } else {
      const subject = `[${cName}] Notice Regarding Your Cooperative Membership Application (${data.appId || memNo})`;
      const text = `Dear ${data.applicantName},\n\n` +
        `Thank you for your interest in joining ${cName}.\n\n` +
        `Following an underwriting review of your membership application and eKYC credentials, the Membership & Credit Committee is unable to approve your application at this time due to the following reason:\n\n` +
        `    ${data.notes || 'Incomplete documentation or unverified eKYC credentials.'}\n\n` +
        `• What Can You Do?\n` +
        `If you would like to provide updated documentation or clear any discrepancy, please visit the cooperative office or contact our membership committee at support@tuntongtech.com.\n\n` +
        `Sincerely,\n` +
        `${cName} Membership & Credit Committee\n` +
        `support@tuntongtech.com\n` +
        `https://tuntongtech.com`;

      try {
        await this.sendMail({
          to: data.email,
          subject,
          text,
        });
      } catch (err) {
        console.error('[MAILER ERROR] sendMemberApplicationDecision (REJECTED):', err);
      }
    }
  }
}
