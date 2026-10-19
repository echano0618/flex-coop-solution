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
  private static cachedConfig: PayMongoConfig | null = null;
  private static lastFetchTime = 0;
  private static CACHE_TTL_MS = 30000; // 30 seconds cache

  private static getBaseUrl(): string {
    return 'https://api.paymongo.com/v1';
  }

  /**
   * Retrieves the current PayMongo configuration (from Firestore with in-memory caching)
   */
  public static async getConfig(): Promise<PayMongoConfig> {
    const now = Date.now();
    if (this.cachedConfig && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedConfig;
    }

    try {
      const fs = FirestoreCoopService.getInstance();
      const doc = await fs.getPlatformConfig('paymongo');
      if (doc && doc.secretKey) {
        this.cachedConfig = {
          secretKey: doc.secretKey,
          publicKey: doc.publicKey || DEFAULT_PAYMONGO_CONFIG.publicKey,
          webhookSecret: doc.webhookSecret || DEFAULT_PAYMONGO_CONFIG.webhookSecret,
          environment: doc.environment || 'test',
          isEnabled: doc.isEnabled !== undefined ? Boolean(doc.isEnabled) : true,
          updatedAt: doc.updatedAt || new Date().toISOString(),
          updatedBy: doc.updatedBy || 'Platform Operator',
        };
        this.lastFetchTime = now;
        return this.cachedConfig;
      }
    } catch (err) {
      console.warn('[PAYMONGO] Failed to load config from Firestore, using defaults:', err);
    }

    this.cachedConfig = { ...DEFAULT_PAYMONGO_CONFIG };
    this.lastFetchTime = now;
    return this.cachedConfig;
  }

  /**
   * Saves updated PayMongo configuration to Cloud Firestore
   */
  public static async saveConfig(
    updated: Partial<PayMongoConfig>,
    updatedBy: string
  ): Promise<PayMongoConfig> {
    const current = await this.getConfig();
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
      console.warn('[PAYMONGO] Warning saving to Firestore:', err);
    }

    this.cachedConfig = newConfig;
    this.lastFetchTime = Date.now();
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
    const config = await this.getConfig();
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
  public static async createQRPhPayment(params: {
    amount: number; // in PHP
    description: string;
    metadata?: Record<string, any>;
  }): Promise<{
    paymentIntentId: string;
    clientKey: string;
    qrImageUrl: string;
    expiresAt: string;
    status: string;
    totalAmount: number;
  }> {
    const config = await this.getConfig();
    if (!config.isEnabled) {
      throw new Error('PayMongo integration is currently disabled by Platform Administration.');
    }

    const secretKey = config.secretKey;
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
    const amountInCentavos = Math.round(params.amount * 100);

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
            metadata: params.metadata || {},
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
    const qrImageUrl = nextAction?.data?.image_url || '';
    const expiresAt = nextAction?.data?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString();
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
  public static async createCheckoutLink(params: {
    amount: number; // in PHP
    description: string;
    remarks?: string;
  }): Promise<{
    linkId: string;
    checkoutUrl: string;
    referenceNumber: string;
    status: string;
    amount: number;
  }> {
    const config = await this.getConfig();
    if (!config.isEnabled) {
      throw new Error('PayMongo integration is currently disabled by Platform Administration.');
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
   * Checks the status of a Payment Intent
   */
  public static async checkPaymentIntentStatus(intentId: string): Promise<{
    status: string;
    isPaid: boolean;
    paymentId?: string;
    amount?: number;
  }> {
    const config = await this.getConfig();
    const secretKey = config.secretKey;
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    const res = await fetch(`${this.getBaseUrl()}/payment_intents/${intentId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data: any = await res.json();
    if (!res.ok || !data?.data) {
      throw new Error('Payment Intent not found on PayMongo.');
    }

    const status = data.data.attributes.status;
    const payments = data.data.attributes.payments || [];
    const isPaid = status === 'succeeded' || payments.some((p: any) => p.attributes?.status === 'paid');
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
   * Checks the status of a PayMongo Checkout Link
   */
  public static async checkCheckoutLinkStatus(linkId: string): Promise<{
    status: string;
    isPaid: boolean;
    paymentId?: string;
  }> {
    const config = await this.getConfig();
    const secretKey = config.secretKey;
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    const res = await fetch(`${this.getBaseUrl()}/links/${linkId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data: any = await res.json();
    if (!res.ok || !data?.data) {
      throw new Error('Checkout Link not found on PayMongo.');
    }

    const status = data.data.attributes.status;
    const isPaid = status === 'paid';
    const payments = data.data.attributes.payments || [];

    return {
      status,
      isPaid,
      paymentId: payments[0]?.id,
    };
  }
}
