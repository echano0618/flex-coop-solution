import { CDAAccount, CDAAccountCategory } from '@flexcoop/shared-types';
import { CDA_STANDARD_CHART_OF_ACCOUNTS } from './accounts';

export * from './accounts';

export class CDACoAManager {
  /**
   * Get all default CDA accounts
   */
  static getDefaultAccounts(): Omit<CDAAccount, 'id'>[] {
    return [...CDA_STANDARD_CHART_OF_ACCOUNTS];
  }

  /**
   * Find an account by its standard code (e.g., '1-02-01')
   */
  static findByCode(code: string): Omit<CDAAccount, 'id'> | undefined {
    return CDA_STANDARD_CHART_OF_ACCOUNTS.find((acc) => acc.code === code);
  }

  /**
   * Get accounts filtered by category
   */
  static getByCategory(category: CDAAccountCategory): Omit<CDAAccount, 'id'>[] {
    return CDA_STANDARD_CHART_OF_ACCOUNTS.filter((acc) => acc.category === category);
  }

  /**
   * Validate if a journal entry line references a valid, active postable account
   */
  static isPostableAccount(code: string): boolean {
    const acc = this.findByCode(code);
    return !!acc && !acc.isHeader && acc.isActive;
  }
}
