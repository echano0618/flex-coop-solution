import { CDA_STANDARD_CHART_OF_ACCOUNTS } from '@flexcoop/cda-coa';

export class TenantProvisioner {
  /**
   * Cleans a slug to ensure safe schema naming: tenant_<slug>
   */
  static getSafeSchemaName(slug: string): string {
    const cleaned = slug.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return `tenant_${cleaned}`;
  }

  /**
   * Generates SQL statements to insert standard CDA Chart of Accounts into tenant schema
   */
  static generateSeedCoaSql(schemaName: string): string {
    const lines = CDA_STANDARD_CHART_OF_ACCOUNTS.map((acc) => {
      const parentCodeVal = acc.parentCode ? `'${acc.parentCode}'` : 'NULL';
      const isHeaderVal = acc.isHeader ? 'TRUE' : 'FALSE';
      const isActiveVal = acc.isActive ? 'TRUE' : 'FALSE';
      const safeName = acc.name.replace(/'/g, "''");

      return `INSERT INTO ${schemaName}.cda_accounts (code, name, category, normal_balance, parent_code, is_header, is_active)
VALUES ('${acc.code}', '${safeName}', '${acc.category}', '${acc.normalBalance}', ${parentCodeVal}, ${isHeaderVal}, ${isActiveVal})
ON CONFLICT (code) DO NOTHING;`;
    });

    return lines.join('\n');
  }

  /**
   * Generates complete provisioning script for a new cooperative tenant
   */
  static generateTenantProvisioningSql(slug: string, templateSql: string): string {
    const schemaName = this.getSafeSchemaName(slug);
    const interpolated = templateSql.replace(/\{\{SCHEMA_NAME\}\}/g, schemaName);
    const coaSeed = this.generateSeedCoaSql(schemaName);

    return `
BEGIN;
${interpolated}
${coaSeed}
COMMIT;
    `;
  }
}
