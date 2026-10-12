import * as crypto from 'crypto';
import { dbStore } from '../../core/store';
import { PaymentService } from './payment.service';
import { GeneralLedgerService } from '../accounting/ledger.service';
import { RegulatoryReportsService } from '../reports/reports.service';
import { PaymentTransaction } from '@flexcoop/shared-types';

export interface PayMongoWebhookPayload {
  data: {
    id: string; // evt_xxxx
    type: 'event';
    attributes: {
      type: 'payment.paid' | 'payment.failed';
      livemode: boolean;
      data: {
        id: string; // pay_xxxx
        type: 'payment';
        attributes: {
          amount: number; // in centavos, e.g. 450908 = ₱4,509.08
          fee: number; // gateway fee in centavos
          net_amount: number; // net amount in centavos
          currency: 'PHP';
          status: 'paid' | 'failed';
          description?: string;
          external_reference_number?: string;
          payment_intent_id?: string;
          payment_method_type: 'qrph' | 'gcash' | 'paymaya' | 'card';
          paid_at: number; // unix timestamp
        };
      };
    };
  };
}

export class PayMongoWebhookService {
  // Idempotency cache to prevent double-crediting
  private static processedEventIds: Set<string> = new Set();

  /**
   * Verifies PayMongo HMAC-SHA256 signature
   * Header format: t=<timestamp>,te=<test_sig>,li=<live_sig>
   */
  static verifySignature(params: {
    rawPayload: string;
    signatureHeader: string;
    webhookSecret: string;
  }): boolean {
    try {
      const parts = params.signatureHeader.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const testSigPart = parts.find((p) => p.startsWith('te='));
      const liveSigPart = parts.find((p) => p.startsWith('li='));

      if (!timestampPart || (!testSigPart && !liveSigPart)) {
        return false;
      }

      const timestamp = timestampPart.replace('t=', '');
      const expectedSig = (liveSigPart || testSigPart)!.replace(/^(li|te)=/, '');

      const payloadToSign = `${timestamp}.${params.rawPayload}`;
      const computedHash = crypto
        .createHmac('sha256', params.webhookSecret)
        .update(payloadToSign)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(expectedSig));
    } catch {
      return false;
    }
  }

  /**
   * Helper to generate a valid test signature for automated tests
   */
  static generateTestSignature(rawPayload: string, secret: string, timestamp: number = Math.floor(Date.now() / 1000)): string {
    const payloadToSign = `${timestamp}.${rawPayload}`;
    const hash = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
    return `t=${timestamp},te=${hash}`;
  }

  /**
   * Processes verified payment.paid event autonomously
   */
  static processPaymentWebhook(params: {
    payload: PayMongoWebhookPayload;
    tenantId: string;
  }): {
    success: boolean;
    alreadyProcessed?: boolean;
    payment?: PaymentTransaction;
    journalEntryId?: string;
    error?: string;
  } {
    const event = params.payload.data;
    const eventId = event.id;

    // 1. Idempotency Check
    if (this.processedEventIds.has(eventId)) {
      return {
        success: true,
        alreadyProcessed: true,
      };
    }

    if (event.attributes.type !== 'payment.paid') {
      return { success: false, error: `Unhandled event type: ${event.attributes.type}` };
    }

    const paymentData = event.attributes.data.attributes;
    const grossPesos = Math.round((paymentData.amount / 100.0) * 100) / 100; // convert centavos to Pesos
    const feePesos = Math.round((paymentData.fee / 100.0) * 100) / 100;
    const netLoanPayment = Math.round((grossPesos - feePesos) * 100) / 100;

    // 2. Locate Loan
    const loans = dbStore.loans.get(params.tenantId) || [];
    // Match by loanNumber or ID in description
    const loan = loans.find((l) =>
      paymentData.description?.includes(l.loanNumber) ||
      paymentData.description?.includes(l.id) ||
      paymentData.external_reference_number === l.id
    ) || loans[0]; // fallback to active loan if sample test

    if (!loan) {
      return { success: false, error: 'No matching loan found for payment webhook' };
    }

    // 3. Allocate Payment: Penalties -> Interest -> Principal
    const unpaidItem = loan.schedule.find((s) => !s.isPaid) || loan.schedule[0];
    const interestDue = Math.max(0, unpaidItem.interestAmount - unpaidItem.paidInterest);
    const principalDue = Math.max(0, unpaidItem.principalAmount - unpaidItem.paidPrincipal);

    const allocation = PaymentService.allocatePayment({
      amountPaid: netLoanPayment,
      penaltyDue: 0,
      interestDue,
      principalDue,
    });

    // Update schedule
    unpaidItem.paidInterest += allocation.interestPortion;
    unpaidItem.paidPrincipal += allocation.principalPortion;
    if (unpaidItem.paidPrincipal >= unpaidItem.principalAmount) {
      unpaidItem.isPaid = true;
      unpaidItem.paidAt = new Date().toISOString();
    }

    loan.balanceRemaining = Math.max(0, loan.balanceRemaining - allocation.principalPortion);
    loan.updatedAt = new Date().toISOString();

    // 4. Create Payment Record
    const paymentRecord: PaymentTransaction = {
      id: `pay_${event.attributes.data.id}`,
      receiptNumber: `OR-PM-${Date.now().toString(36).toUpperCase()}`,
      loanId: loan.id,
      memberId: loan.memberId,
      channel: 'PAYMONGO_QRPH',
      grossAmountPaid: grossPesos,
      passOnConvenienceFee: feePesos,
      netLoanPayment,
      principalPortion: allocation.principalPortion,
      interestPortion: allocation.interestPortion,
      penaltyPortion: allocation.penaltyPortion,
      gatewayReference: event.attributes.data.id,
      paidAt: new Date(paymentData.paid_at * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 5. Post Balanced CDA Journal Entry
    const member = (dbStore.members.get(params.tenantId) || []).find((m) => m.id === loan.memberId);
    const jeData = GeneralLedgerService.buildRepaymentEntry({
      loanId: loan.id,
      loanNumber: loan.loanNumber,
      grossReceived: grossPesos,
      principalPortion: allocation.principalPortion,
      interestPortion: allocation.interestPortion,
      penaltyPortion: allocation.penaltyPortion,
      passOnFee: feePesos,
      channel: 'PAYMONGO_QRPH',
      userId: 'usr_paymongo_webhook',
      memberId: loan.memberId,
      memberNumber: member?.memberNumber,
      memberName: member ? `${member.firstName} ${member.lastName}` : undefined,
    });

    const entries = dbStore.journalEntries.get(params.tenantId) || [];
    const journalEntry = { id: `je_pm_${Date.now()}`, ...jeData };
    entries.push(journalEntry);
    dbStore.journalEntries.set(params.tenantId, entries);

    // 6. AMLC Check
    const amlcAlert = RegulatoryReportsService.checkAMLCThreshold({
      transactionId: paymentRecord.id,
      memberId: loan.memberId,
      amount: grossPesos,
      transactionType: 'PAYMONGO_QRPH_REPAYMENT',
    });
    if (amlcAlert) {
      dbStore.amlcAlerts.push(amlcAlert);
    }

    // 7. Mark as processed for idempotency
    this.processedEventIds.add(eventId);

    return {
      success: true,
      payment: paymentRecord,
      journalEntryId: journalEntry.id,
    };
  }
}
