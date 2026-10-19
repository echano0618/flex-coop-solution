import { PaymentChannel, PaymentTransaction } from '@flexcoop/shared-types';

export class PaymentService {
  /**
   * Calculates convenience fee for PayMongo QR Ph (1.5% with no minimum floor, or ₱0 when OPEX)
   */
  static calculatePassOnFee(
    amount: number,
    channel: PaymentChannel,
    feeTreatment: 'PASS_THROUGH' | 'OPEX' = 'PASS_THROUGH'
  ): number {
    if (channel !== 'PAYMONGO_QRPH' || feeTreatment === 'OPEX') {
      return 0.0; // In-person, bank transfer, or OPEX gateway fee policy have NO pass-on fee to member
    }
    // PayMongo QR Ph fee: 1.5% with no minimum ₱15 floor
    return Math.round(amount * 0.015 * 100) / 100;
  }

  /**
   * Generates dynamic PayMongo QR Ph Payment Intent data
   */
  static generateQRPhIntent(params: {
    loanId: string;
    memberId: string;
    installmentAmount: number;
    description: string;
    feeTreatment?: 'PASS_THROUGH' | 'OPEX';
  }): {
    intentId: string;
    loanInstallmentAmount: number;
    passOnFee: number;
    totalAmountToPay: number;
    qrCodePayload: string;
    expiresAt: string;
  } {
    const passOnFee = this.calculatePassOnFee(
      params.installmentAmount,
      'PAYMONGO_QRPH',
      params.feeTreatment || 'PASS_THROUGH'
    );
    const totalAmountToPay = Math.round((params.installmentAmount + passOnFee) * 100) / 100;
    const intentId = `pi_qrph_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Standard Philippine EMVCo QR Ph test string / deep link
    const qrCodePayload = `00020101021226580010ph.paymongo0115${intentId}520460115303608540${totalAmountToPay.toFixed(
      2
    )}5802PH5912FLEXCOOP6006MANILA62190115${params.loanId.substring(0, 15)}6304`;

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes expiry

    return {
      intentId,
      loanInstallmentAmount: params.installmentAmount,
      passOnFee,
      totalAmountToPay,
      qrCodePayload,
      expiresAt,
    };
  }

  /**
   * Allocates repayment amount across Penalties -> Interest -> Principal -> Excess
   */
  static allocatePayment(params: {
    amountPaid: number;
    penaltyDue: number;
    interestDue: number;
    principalDue: number;
  }): {
    penaltyPortion: number;
    interestPortion: number;
    principalPortion: number;
    excessToSavings: number;
  } {
    let remaining = params.amountPaid;

    // 1. Settle Penalties first
    const penaltyPortion = Math.min(remaining, params.penaltyDue);
    remaining = Math.round((remaining - penaltyPortion) * 100) / 100;

    // 2. Settle Interest next
    const interestPortion = Math.min(remaining, params.interestDue);
    remaining = Math.round((remaining - interestPortion) * 100) / 100;

    // 3. Settle Principal
    const principalPortion = Math.min(remaining, params.principalDue);
    remaining = Math.round((remaining - principalPortion) * 100) / 100;

    // 4. Any remaining is credited to voluntary savings
    const excessToSavings = Math.max(0, remaining);

    return {
      penaltyPortion,
      interestPortion,
      principalPortion,
      excessToSavings,
    };
  }

  /**
   * Calculates convenience fee for Share Capital settlement:
   * OTC: ₱0.00
   * QR Ph: Exactly 1.5% convenience fee
   */
  static calculateShareCapitalFee(pledgeAmount: number, channel: 'OTC' | 'QRPH'): {
    pledgeAmount: number;
    convenienceFee: number;
    totalAmountToPay: number;
    creditToPlatformEscrow: boolean;
  } {
    const convenienceFee = channel === 'QRPH' ? Math.round(pledgeAmount * 0.015 * 100) / 100 : 0.0;
    return {
      pledgeAmount,
      convenienceFee,
      totalAmountToPay: Math.round((pledgeAmount + convenienceFee) * 100) / 100,
      creditToPlatformEscrow: channel === 'QRPH',
    };
  }
}
