import * as fs from 'fs';
import * as path from 'path';

export * from './tenant-provisioner';

export class MigrationAssets {
  static getPublicSchemaSql(): string {
    const filePath = path.join(__dirname, 'sql', '001_public_schema.sql');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    // Fallback if running from src
    return fs.readFileSync(path.join(__dirname, '..', 'src', 'sql', '001_public_schema.sql'), 'utf-8');
  }

  static getTenantTemplateSql(): string {
    const filePath = path.join(__dirname, 'sql', '002_tenant_schema_template.sql');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    // Fallback if running from src
    return fs.readFileSync(path.join(__dirname, '..', 'src', 'sql', '002_tenant_schema_template.sql'), 'utf-8');
  }
}
