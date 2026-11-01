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

export interface LoanPaymentReceiptData {
  recipientEmail: string;
  recipientName: string;
  coopName?: string;
  coopSlug?: string;
  loanNumber: string;
  productName?: string;
  receiptNumber: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount?: number;
  remainingBalance: number;
  paymentDate?: string;
  paymentChannel?: string;
  isPaidOff?: boolean;
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

  /**
   * Dispatches official digital payment receipt to member when a loan payment is posted
   */
  public static async sendLoanPaymentReceipt(data: LoanPaymentReceiptData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const cName = data.coopName || 'Cooperative Enterprise';
    const amountStr = Number(data.paymentAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const principalStr = Number(data.principalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const interestStr = Number(data.interestAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const balanceStr = Number(data.remainingBalance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
    const dateStr = data.paymentDate || new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
    const channelStr = data.paymentChannel || 'PayMongo QR Ph';

    const subject = `[${cName}] Official Payment Receipt: Loan #${data.loanNumber} (${data.receiptNumber})`;

    const text = `Dear ${data.recipientName},\n\n` +
      `We have successfully received and posted your loan amortization payment for Loan #${data.loanNumber}.\n\n` +
      `• PAYMENT CONFIRMATION & OFFICIAL RECEIPT DETAILS:\n` +
      `- Official Receipt No.: ${data.receiptNumber}\n` +
      `- Payment Date: ${dateStr}\n` +
      `- Payment Channel: ${channelStr}\n` +
      `- Total Amount Paid: ₱${amountStr}\n` +
      `- Principal Reduction: ₱${principalStr}\n` +
      `- Interest Payment: ₱${interestStr}\n` +
      (Number(data.penaltyAmount || 0) > 0 ? `- Late Overdue Penalty: ₱${Number(data.penaltyAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n` : '') +
      `- Remaining Loan Balance: ₱${balanceStr}\n` +
      (data.isPaidOff ? `\n🎉 CONGRATULATIONS! This loan has been fully settled and paid in full. Your clearance certificate and release documents will be processed by the Credit Committee.\n` : '') +
      `\n• Member Self-Service Portal Access:\n` +
      `You can review your updated real-time amortization schedule, statement of account, and share capital balance anytime on the Member Portal:\n` +
      `https://${data.coopSlug ? data.coopSlug + '-coop.' : ''}tuntongtech.com/member/login\n\n` +
      `Pursuant to Republic Act No. 9520 (Philippine Cooperative Code of 2008) and CDA accounting rules, this digital receipt acknowledges credit to the cooperative General Ledger (Account 1-03-01 Loans Receivable).\n\n` +
      `Thank you for your continuous commitment to ${cName}!\n\n` +
      `Sincerely,\n` +
      `${cName} Treasury & Credit Committee\n` +
      `Powered by Tuntong Tech Cooperative Platform\n` +
      `support@tuntongtech.com\n` +
      `https://tuntongtech.com`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0f766e; margin: 0 0 4px 0; font-size: 22px;">${cName}</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">Official Digital Loan Repayment Receipt</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
          <p style="font-size: 14px; margin-top: 0;">Dear <strong>${data.recipientName}</strong>,</p>
          <p style="font-size: 13px; color: #334155;">
            We are pleased to confirm that your amortization payment for <strong>Loan #${data.loanNumber}</strong> has been successfully credited and verified.
          </p>

          <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Official Receipt No.:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; font-family: monospace;">${data.receiptNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Payment Date:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Payment Channel:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold;">${channelStr}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 0 4px 0; color: #0f766e; font-weight: bold; font-size: 14px;">Total Paid:</td>
                <td style="padding: 8px 0 4px 0; text-align: right; font-weight: bold; font-size: 16px; color: #0f766e;">₱${amountStr}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 12px;">• Principal Portion:</td>
                <td style="padding: 4px 0; text-align: right; font-size: 12px; color: #334155;">₱${principalStr}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b; font-size: 12px;">• Interest Portion:</td>
                <td style="padding: 4px 0; text-align: right; font-size: 12px; color: #334155;">₱${interestStr}</td>
              </tr>
              ${
                Number(data.penaltyAmount || 0) > 0
                  ? `<tr>
                      <td style="padding: 4px 0; color: #b45309; font-size: 12px;">• Late Overdue Penalty:</td>
                      <td style="padding: 4px 0; text-align: right; font-size: 12px; color: #b45309; font-weight: bold;">₱${Number(data.penaltyAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    </tr>`
                  : ''
              }
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 8px 0 0 0; color: #475569; font-weight: bold;">Remaining Loan Balance:</td>
                <td style="padding: 8px 0 0 0; text-align: right; font-weight: bold; font-size: 15px; color: ${data.isPaidOff ? '#16a34a' : '#1e293b'};">
                  ₱${balanceStr}
                </td>
              </tr>
            </table>
          </div>

          ${
            data.isPaidOff
              ? `<div style="background-color: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 12px; border-radius: 6px; font-size: 13px; font-weight: bold; text-align: center; margin: 16px 0;">
                  🎉 CONGRATULATIONS! Your loan has been fully paid in full.
                </div>`
              : ''
          }

          <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
            This transaction is officially certified and registered into the cooperative General Ledger (Account 1-03-01 Loans Receivable) under RA 9520 statutory accounting guidelines.
          </p>
        </div>

        <div style="text-align: center; font-size: 11px; color: #94a3b8;">
          <p style="margin: 0 0 4px 0;">${cName} • Cooperative Financial Operations</p>
          <p style="margin: 0;">Powered by Tuntong Tech Cooperative SaaS • support@tuntongtech.com</p>
        </div>
      </div>
    `;

    try {
      return await this.sendMail({
        to: data.recipientEmail,
        subject,
        text,
        html,
      });
    } catch (err: any) {
      console.error('[MAILER ERROR] sendLoanPaymentReceipt:', err);
      return { success: false, error: err.message };
    }
  }
}
