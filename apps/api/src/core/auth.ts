import * as crypto from 'crypto';

export type UserRole =
  | 'SUPERADMIN'
  | 'GENERAL_MANAGER'
  | 'LOAN_OFFICER'
  | 'CREDIT_COMMITTEE'
  | 'BOD'
  | 'CASHIER'
  | 'ACCOUNTANT'
  | 'COMPLIANCE_OFFICER'
  | 'MEMBER';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  issuedAt: number;
  expiresAt: number;
}

export class AuthService {
  private static readonly SECRET = process.env.JWT_SECRET || 'flexcoop_jwt_signing_secret_key_2026';

  /**
   * Generates a signed, tamper-proof token with tenant and role claims
   */
  static generateToken(user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    tenantId: string;
  }): string {
    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.SECRET)
      .update(`${header}.${encodedPayload}`)
      .digest('base64url');

    return `${header}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifies token and extracts payload
   */
  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      const [header, encodedPayload, signature] = token.split('.');
      if (!header || !encodedPayload || !signature) return null;

      const expectedSig = crypto
        .createHmac('sha256', this.SECRET)
        .update(`${header}.${encodedPayload}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return null;
      }

      const payload: AuthTokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (payload.expiresAt < Math.floor(Date.now() / 1000)) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Predefined staff accounts per cooperative
   */
  static getStaffAccounts(tenantId: string): Array<{
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    tenantId: string;
    roleTitle: string;
  }> {
    return [
      {
        id: 'usr_gm_01',
        email: 'gm@bayanicoop.ph',
        fullName: 'Atty. Roberto Dela Rosa',
        role: 'GENERAL_MANAGER',
        tenantId,
        roleTitle: 'General Manager / Superadmin',
      },
      {
        id: 'usr_lo_01',
        email: 'lo@bayanicoop.ph',
        fullName: 'Grace Villanueva',
        role: 'LOAN_OFFICER',
        tenantId,
        roleTitle: 'Senior Loan Officer',
      },
      {
        id: 'usr_crecom_01',
        email: 'crecom@bayanicoop.ph',
        fullName: 'Engr. Manuel Reyes',
        role: 'CREDIT_COMMITTEE',
        tenantId,
        roleTitle: 'Credit Committee Chairperson',
      },
      {
        id: 'usr_bod_01',
        email: 'bod@bayanicoop.ph',
        fullName: 'Dr. Corazon Aquino-Cruz',
        role: 'BOD',
        tenantId,
        roleTitle: 'Board of Directors Chairman',
      },
      {
        id: 'usr_cashier_01',
        email: 'cashier@bayanicoop.ph',
        fullName: 'Leah Mendoza',
        role: 'CASHIER',
        tenantId,
        roleTitle: 'Branch Head Cashier & Teller',
      },
      {
        id: 'usr_acct_01',
        email: 'accountant@bayanicoop.ph',
        fullName: 'Felipe Santos, CPA',
        role: 'ACCOUNTANT',
        tenantId,
        roleTitle: 'Chief Bookkeeper & Accountant',
      },
      {
        id: 'usr_dpo_01',
        email: 'compliance@bayanicoop.ph',
        fullName: 'Atty. Cristina Gomez',
        role: 'COMPLIANCE_OFFICER',
        tenantId,
        roleTitle: 'Compliance Officer & DPO',
      },
    ];
  }

  /**
   * Validates if a role has permission for a specific action/module
   */
  static hasPermission(
    role: UserRole,
    module: 'LOS_TRIAGE' | 'LOS_COMMITTEE' | 'LOS_BOD' | 'CASHIER_DISBURSE' | 'ACCOUNTING' | 'REPORTS' | 'KYC_APPROVE'
  ): boolean {
    if (role === 'SUPERADMIN' || role === 'GENERAL_MANAGER') return true;

    switch (module) {
      case 'LOS_TRIAGE':
        return role === 'LOAN_OFFICER';
      case 'LOS_COMMITTEE':
        return role === 'CREDIT_COMMITTEE';
      case 'LOS_BOD':
        return role === 'BOD';
      case 'CASHIER_DISBURSE':
        return role === 'CASHIER';
      case 'ACCOUNTING':
        return role === 'ACCOUNTANT';
      case 'REPORTS':
        return role === 'ACCOUNTANT' || role === 'COMPLIANCE_OFFICER';
      case 'KYC_APPROVE':
        return role === 'COMPLIANCE_OFFICER';
      default:
        return false;
    }
  }
}
