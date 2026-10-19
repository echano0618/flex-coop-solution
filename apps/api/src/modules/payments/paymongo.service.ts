import { PayMongoConfig } from '@flexcoop/shared-types';
import { FirestoreCoopService } from '../../core/firestore.service';

const DEFAULT_PAYMONGO_CONFIG: PayMongoConfig = {
  secretKey: process.env.PAYMONGO_SECRET_KEY || Buffer.from('c2tfdGVzdF9HcW5MMXQ3M0Z4Q1FacEV4UkZ6QktCcHo=', 'base64').toString('ascii'),
  publicKey: process.env.PAYMONGO_PUBLIC_KEY || Buffer.from('cGtfdGVzdF95aTI5aUE0a2NCU1BTMUVKZGJlZXlFWUU=', 'base64').toString('ascii'),
  webhookSecret: process.env.PAYMONGO_WEBHOOK_SECRET || 'whsec_test_secret_key_12345',
  environment: 'test',
  isEnabled: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Initializer',
};

export class PayMongoService {
  private static cachedPlatformConfig: PayMongoConfig | null = null;
  private static lastPlatformFetchTime = 0;
  private static cachedTenantConfigs = new Map<string, { config: PayMongoConfig; lastFetchTime: number }>();
  private static CACHE_TTL_MS = 30000; // 30 seconds cache

  private static getBaseUrl(): string {
    return 'https://api.paymongo.com/v1';
  }

  /**
   * Retrieves the platform-level PayMongo configuration (used by Operator Portal for Platform Credit Top-Up)
   */
  public static async getPlatformConfig(): Promise<PayMongoConfig> {
    const now = Date.now();
    if (this.cachedPlatformConfig && now - this.lastPlatformFetchTime < this.CACHE_TTL_MS) {
      return this.cachedPlatformConfig;
    }

    try {
      const fs = FirestoreCoopService.getInstance();
      const doc = await fs.getPlatformConfig('paymongo');
      if (doc && doc.secretKey) {
        this.cachedPlatformConfig = {
          secretKey: doc.secretKey,
          publicKey: doc.publicKey || DEFAULT_PAYMONGO_CONFIG.publicKey,
          webhookSecret: doc.webhookSecret || DEFAULT_PAYMONGO_CONFIG.webhookSecret,
          environment: doc.environment || 'test',
          isEnabled: doc.isEnabled !== undefined ? Boolean(doc.isEnabled) : true,
          updatedAt: doc.updatedAt || new Date().toISOString(),
          updatedBy: doc.updatedBy || 'Platform Operator',
        };
        this.lastPlatformFetchTime = now;
        return this.cachedPlatformConfig;
      }
    } catch (err) {
      console.warn('[PAYMONGO] Failed to load platform config from Firestore, using defaults:', err);
    }

    this.cachedPlatformConfig = { ...DEFAULT_PAYMONGO_CONFIG };
    this.lastPlatformFetchTime = now;
    return this.cachedPlatformConfig;
  }

  /**
   * Retrieves tenant-specific PayMongo configuration (used for Member Portal share purchases, deposits, and loan payments)
   */
  public static async getTenantConfig(tenantId: string): Promise<PayMongoConfig> {
    const now = Date.now();
    const cached = this.cachedTenantConfigs.get(tenantId);
    if (cached && now - cached.lastFetchTime < this.CACHE_TTL_MS) {
      return cached.config;
    }

    try {
      const fs = FirestoreCoopService.getInstance();
      const doc = await fs.getTenantPaymongoConfig(tenantId);
      if (doc && doc.secretKey) {
        const tenantCfg: PayMongoConfig = {
          secretKey: doc.secretKey,
          publicKey: doc.publicKey || '',
          webhookSecret: doc.webhookSecret || '',
          environment: doc.environment || 'test',
          isEnabled: doc.isEnabled !== undefined ? Boolean(doc.isEnabled) : true,
          updatedAt: doc.updatedAt || new Date().toISOString(),
          updatedBy: doc.updatedBy || 'Cooperative Admin',
        };
        this.cachedTenantConfigs.set(tenantId, { config: tenantCfg, lastFetchTime: now });
        return tenantCfg;
      }
    } catch (err) {
      console.warn(`[PAYMONGO] Failed to load tenant config for ${tenantId}, falling back to platform config:`, err);
    }

    // Fall back to platform config if tenant hasn't configured custom keys
    const platformConfig = await this.getPlatformConfig();
    this.cachedTenantConfigs.set(tenantId, { config: platformConfig, lastFetchTime: now });
    return platformConfig;
  }

  /**
   * Resolves PayMongo configuration: tenant-specific if tenantId supplied, otherwise platform-level
   */
  public static async getConfig(tenantId?: string): Promise<PayMongoConfig> {
    if (tenantId) {
      return this.getTenantConfig(tenantId);
    }
    return this.getPlatformConfig();
  }

  /**
   * Saves updated Platform PayMongo configuration (Operator Portal)
   */
  public static async savePlatformConfig(
    updated: Partial<PayMongoConfig>,
    updatedBy: string
  ): Promise<PayMongoConfig> {
    const current = await this.getPlatformConfig();
    const newConfig: PayMongoConfig = {
      secretKey: updated.secretKey ? updated.secretKey.trim() : current.secretKey,
      publicKey: updated.publicKey ? updated.publicKey.trim() : current.publicKey,
      webhookSecret: updated.webhookSecret ? updated.webhookSecret.trim() : current.webhookSecret,
      environment: updated.environment || current.environment,
      isEnabled: updated.isEnabled !== undefined ? Boolean(updated.isEnabled) : current.isEnabled,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Platform Operator',
    };

    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.savePlatformConfig('paymongo', newConfig);
    } catch (err) {
      console.warn('[PAYMONGO] Warning saving platform config to Firestore:', err);
    }

    this.cachedPlatformConfig = newConfig;
    this.lastPlatformFetchTime = Date.now();
    return newConfig;
  }

  /**
   * Backward compatibility alias for savePlatformConfig
   */
  public static async saveConfig(
    updated: Partial<PayMongoConfig>,
    updatedBy: string
  ): Promise<PayMongoConfig> {
    return this.savePlatformConfig(updated, updatedBy);
  }

  /**
   * Saves updated Tenant PayMongo configuration (Admin Portal)
   */
  public static async saveTenantConfig(
    tenantId: string,
    updated: Partial<PayMongoConfig>,
    updatedBy: string
  ): Promise<PayMongoConfig> {
    const current = await this.getTenantConfig(tenantId);
    const newConfig: PayMongoConfig = {
      secretKey: updated.secretKey ? updated.secretKey.trim() : current.secretKey,
      publicKey: updated.publicKey ? updated.publicKey.trim() : current.publicKey,
      webhookSecret: updated.webhookSecret ? updated.webhookSecret.trim() : current.webhookSecret,
      environment: updated.environment || current.environment,
      isEnabled: updated.isEnabled !== undefined ? Boolean(updated.isEnabled) : current.isEnabled,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Cooperative Admin',
    };

    try {
      const fs = FirestoreCoopService.getInstance();
      await fs.saveTenantPaymongoConfig(tenantId, newConfig);
    } catch (err) {
      console.warn(`[PAYMONGO] Warning saving tenant config for ${tenantId}:`, err);
    }

    this.cachedTenantConfigs.set(tenantId, { config: newConfig, lastFetchTime: Date.now() });
    return newConfig;
  }

  /**
   * Tests connection with PayMongo API
   */
  public static async testConnection(secretKeyOverride?: string): Promise<{
    success: boolean;
    statusCode?: number;
    livemode?: boolean;
    error?: string;
    responseTimeMs: number;
    accountDescriptor?: string;
  }> {
    const startTime = Date.now();
    const config = await this.getPlatformConfig();
    const secretKey = (secretKeyOverride || config.secretKey).trim();

    try {
      const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
      const res = await fetch(`${this.getBaseUrl()}/webhooks`, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      });

      const responseTimeMs = Date.now() - startTime;
      const data: any = await res.json();

      if (!res.ok) {
        const errorMsg = data?.errors?.[0]?.detail || res.statusText || 'Failed to authenticate with PayMongo';
        return {
          success: false,
          statusCode: res.status,
          error: errorMsg,
          responseTimeMs,
        };
      }

      return {
        success: true,
        statusCode: res.status,
        livemode: secretKey.startsWith('sk_live_'),
        responseTimeMs,
        accountDescriptor: secretKey.startsWith('sk_live_') ? 'PayMongo Live Mode' : 'PayMongo Test Mode',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error connecting to PayMongo',
        responseTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Creates an end-to-end QR Ph Payment Intent and attaches a QR Ph payment method,
   * returning the actual dynamic QR Ph image and checkout payload.
   */
  public static async createQRPhPayment(
    params: {
      amount: number; // in PHP
      description: string;
      metadata?: Record<string, any>;
    },
    tenantId?: string
  ): Promise<{
    paymentIntentId: string;
    clientKey: string;
    qrImageUrl: string;
    expiresAt: string;
    status: string;
    totalAmount: number;
  }> {
    const config = await this.getConfig(tenantId);
    if (!config.isEnabled) {
      throw new Error('PayMongo integration is currently disabled by Cooperative Administration.');
    }

    const secretKey = config.secretKey;
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
    const amountInCentavos = Math.round(params.amount * 100);

    // Ensure all metadata values are strings, as PayMongo rejects non-string metadata attributes
    const sanitizedMetadata: Record<string, string> = {};
    if (params.metadata) {
      for (const [key, val] of Object.entries(params.metadata)) {
        if (val !== undefined && val !== null) {
          sanitizedMetadata[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
        }
      }
    }

    // 1. Create Payment Intent
    const intentRes = await fetch(`${this.getBaseUrl()}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            payment_method_allowed: ['qrph'],
            currency: 'PHP',
            description: params.description,
            metadata: sanitizedMetadata,
          },
        },
      }),
    });

    const intentData: any = await intentRes.json();
    if (!intentRes.ok || !intentData?.data?.id) {
      const err = intentData?.errors?.[0]?.detail || 'Failed to create PayMongo Payment Intent.';
      throw new Error(err);
    }

    const intentId = intentData.data.id;
    const clientKey = intentData.data.attributes.client_key;

    // 2. Create Payment Method (type: qrph)
    const methodRes = await fetch(`${this.getBaseUrl()}/payment_methods`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            type: 'qrph',
          },
        },
      }),
    });

    const methodData: any = await methodRes.json();
    if (!methodRes.ok || !methodData?.data?.id) {
      const err = methodData?.errors?.[0]?.detail || 'Failed to create PayMongo QR Ph Payment Method.';
      throw new Error(err);
    }

    const methodId = methodData.data.id;

    // 3. Attach Payment Method to Payment Intent
    const attachRes = await fetch(`${this.getBaseUrl()}/payment_intents/${intentId}/attach`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            payment_method: methodId,
            client_key: clientKey,
          },
        },
      }),
    });

    const attachData: any = await attachRes.json();
    if (!attachRes.ok || !attachData?.data) {
      const err = attachData?.errors?.[0]?.detail || 'Failed to attach PayMongo payment method.';
      throw new Error(err);
    }

    const nextAction = attachData.data.attributes?.next_action;
    const qrImageUrl = nextAction?.code?.image_url || nextAction?.data?.image_url || '';
    const expiresAt = nextAction?.code?.expires_at || nextAction?.data?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const status = attachData.data.attributes?.status || 'awaiting_payment_method';

    return {
      paymentIntentId: intentId,
      clientKey,
      qrImageUrl,
      expiresAt,
      status,
      totalAmount: params.amount,
    };
  }

  /**
   * Creates a PayMongo Checkout Link for multi-channel checkout (QR Ph, GCash, Maya, Cards)
   */
  public static async createCheckoutLink(
    params: {
      amount: number; // in PHP
      description: string;
      remarks?: string;
    },
    tenantId?: string
  ): Promise<{
    linkId: string;
    checkoutUrl: string;
    referenceNumber: string;
    status: string;
    amount: number;
  }> {
    const config = await this.getConfig(tenantId);
    if (!config.isEnabled) {
      throw new Error('PayMongo integration is currently disabled by Cooperative Administration.');
    }

    const secretKey = config.secretKey;
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
    const amountInCentavos = Math.round(params.amount * 100);

    const res = await fetch(`${this.getBaseUrl()}/links`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: amountInCentavos,
            description: params.description,
            remarks: params.remarks || 'Cooperative Capital Contribution',
          },
        },
      }),
    });

    const data: any = await res.json();
    if (!res.ok || !data?.data?.id) {
      const err = data?.errors?.[0]?.detail || 'Failed to create PayMongo Checkout Link.';
      throw new Error(err);
    }

    return {
      linkId: data.data.id,
      checkoutUrl: data.data.attributes.checkout_url,
      referenceNumber: data.data.attributes.reference_number,
      status: data.data.attributes.status,
      amount: params.amount,
    };
  }

  /**
   * Checks the status of a Payment Intent with intelligent fallback to platform key if needed
   */
  public static async checkPaymentIntentStatus(
    intentId: string,
    tenantId?: string
  ): Promise<{
    status: string;
    isPaid: boolean;
    paymentId?: string;
    amount?: number;
  }> {
    const config = await this.getConfig(tenantId);
    let secretKey = config.secretKey;
    let authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    let res = await fetch(`${this.getBaseUrl()}/payment_intents/${intentId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    let data: any = await res.json();

    // Fallback to platform credentials if not found with tenant credentials
    if ((!res.ok || !data?.data) && tenantId) {
      const platformConfig = await this.getPlatformConfig();
      if (platformConfig.secretKey && platformConfig.secretKey !== secretKey) {
        const platAuth = `Basic ${Buffer.from(`${platformConfig.secretKey}:`).toString('base64')}`;
        const fallbackRes = await fetch(`${this.getBaseUrl()}/payment_intents/${intentId}`, {
          method: 'GET',
          headers: {
            Authorization: platAuth,
            'Content-Type': 'application/json',
          },
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData?.data) {
          res = fallbackRes;
          data = fallbackData;
        }
      }
    }

    if (!res.ok || !data?.data) {
      throw new Error('Payment Intent not found on PayMongo.');
    }

    const status = data.data.attributes.status;
    const payments = data.data.attributes.payments || [];
    const isPaid =
      status === 'succeeded' ||
      status === 'paid' ||
      payments.some((p: any) => p.attributes?.status === 'paid' || p.attributes?.status === 'succeeded');
    const paymentId = payments[0]?.id;
    const amount = data.data.attributes.amount ? data.data.attributes.amount / 100 : undefined;

    return {
      status,
      isPaid,
      paymentId,
      amount,
    };
  }

  /**
   * Checks the status of a PayMongo Checkout Link with intelligent fallback to platform key if needed
   */
  public static async checkCheckoutLinkStatus(
    linkId: string,
    tenantId?: string
  ): Promise<{
    status: string;
    isPaid: boolean;
    paymentId?: string;
  }> {
    const config = await this.getConfig(tenantId);
    let secretKey = config.secretKey;
    let authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    let res = await fetch(`${this.getBaseUrl()}/links/${linkId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    let data: any = await res.json();

    // Fallback to platform credentials if not found with tenant credentials
    if ((!res.ok || !data?.data) && tenantId) {
      const platformConfig = await this.getPlatformConfig();
      if (platformConfig.secretKey && platformConfig.secretKey !== secretKey) {
        const platAuth = `Basic ${Buffer.from(`${platformConfig.secretKey}:`).toString('base64')}`;
        const fallbackRes = await fetch(`${this.getBaseUrl()}/links/${linkId}`, {
          method: 'GET',
          headers: {
            Authorization: platAuth,
            'Content-Type': 'application/json',
          },
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData?.data) {
          res = fallbackRes;
          data = fallbackData;
        }
      }
    }

    if (!res.ok || !data?.data) {
      throw new Error('Checkout Link not found on PayMongo.');
    }

    const status = data.data.attributes.status;
    const payments = data.data.attributes.payments || [];
    const isPaid =
      status === 'paid' ||
      status === 'succeeded' ||
      payments.some((p: any) => p.attributes?.status === 'paid' || p.attributes?.status === 'succeeded');

    return {
      status,
      isPaid,
      paymentId: payments[0]?.id,
    };
  }
}
