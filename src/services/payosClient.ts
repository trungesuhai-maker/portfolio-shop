import { DEFAULT_PAYMENT_SETTINGS, getSavedPaymentSettings } from '../types/paymentConfig';

export interface PayosLinkResponse {
  success: boolean;
  orderCode: number;
  amount: number;
  checkoutUrl?: string;
  qrCode?: string;
  qrImageUrl?: string;
  accountNumber?: string;
  accountName?: string;
  description?: string;
  paymentLinkId?: string;
  message?: string;
  error?: any;
}

/**
 * Calculates HMAC-SHA256 signature in browser/client environment using Web Crypto API.
 */
async function calculateHmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Creates payOS Payment Link with Dual-Engine Fallback:
 * 1. Tries Backend API (/api/payment/create-payos-link)
 * 2. If backend fails or returns 405, falls back directly to payOS API with CORS support
 */
export async function createPayosPaymentLink(
  amount: number,
  orderCodeInput?: number | string,
  descInput?: string
): Promise<PayosLinkResponse> {
  const settings = getSavedPaymentSettings() || DEFAULT_PAYMENT_SETTINGS;
  const clientId = settings.payosClientId || DEFAULT_PAYMENT_SETTINGS.payosClientId || 'c2121c0c-5885-4bb0-98bb-3bb2b7829295';
  const apiKey = settings.payosApiKey || DEFAULT_PAYMENT_SETTINGS.payosApiKey || 'dd08ccd2-51cf-4374-a33e-aa5d90d42004';
  const checksumKey = settings.payosChecksumKey || DEFAULT_PAYMENT_SETTINGS.payosChecksumKey || 'd61a7decd1193bc851d69344fbfd2844a90d5f764e1ee1c5ae0565ae22b91595';

  const numericAmount = Math.max(1000, Number(amount) || 2000);
  let orderCode = Number(orderCodeInput);
  if (!orderCode || isNaN(orderCode) || orderCode <= 0) {
    orderCode = Math.floor(100000 + Math.random() * 899000);
  }

  let cleanDesc = (descInput || `ORD${orderCode}`)
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .substring(0, 25);
  if (!cleanDesc) cleanDesc = `ORD${orderCode}`;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.webcuaban.site';
  const returnUrl = `${origin}/checkout?orderCode=${orderCode}&status=success`;
  const cancelUrl = `${origin}/checkout?orderCode=${orderCode}&status=cancel`;

  // --- ENGINE 1: Backend Server / Serverless Endpoint ---
  try {
    const res = await fetch('/api/payment/create-payos-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode,
        amount: numericAmount,
        description: cleanDesc,
        returnUrl,
        cancelUrl
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return data;
      }
    }
  } catch (backendErr) {
    console.warn('Backend payOS creation failed, switching to Direct payOS Client Engine:', backendErr);
  }

  // --- ENGINE 2: Direct Client-Side payOS API Call (Bypass all backend routing issues) ---
  try {
    const signData = `amount=${numericAmount}&cancelUrl=${cancelUrl}&description=${cleanDesc}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
    const signature = await calculateHmacSha256(checksumKey, signData);

    const directRes = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
      method: 'POST',
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderCode,
        amount: numericAmount,
        description: cleanDesc,
        cancelUrl,
        returnUrl,
        signature
      })
    });

    const directData = await directRes.json();
    if (directData && directData.code === '00' && directData.data) {
      const d = directData.data;
      return {
        success: true,
        orderCode,
        amount: numericAmount,
        checkoutUrl: d.checkoutUrl,
        qrCode: d.qrCode,
        qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(d.qrCode)}`,
        accountNumber: d.accountNumber,
        accountName: d.accountName,
        description: d.description,
        paymentLinkId: d.paymentLinkId
      };
    } else {
      console.warn('Direct payOS returned non-zero code:', directData);
    }
  } catch (directErr) {
    console.error('Direct payOS client call error:', directErr);
  }

  return {
    success: false,
    orderCode,
    amount: numericAmount,
    message: 'Không thể kết nối payOS'
  };
}

/**
 * Direct Polling against payOS API
 * Returns true if payOS confirms PAID
 */
export async function checkPayosPaymentDirect(orderCode: number | string): Promise<{ paid: boolean; payment?: any }> {
  const numericCode = parseInt(String(orderCode).replace(/\D/g, ''), 10);
  if (!numericCode || isNaN(numericCode)) return { paid: false };

  const settings = getSavedPaymentSettings() || DEFAULT_PAYMENT_SETTINGS;
  const clientId = settings.payosClientId || DEFAULT_PAYMENT_SETTINGS.payosClientId || 'c2121c0c-5885-4bb0-98bb-3bb2b7829295';
  const apiKey = settings.payosApiKey || DEFAULT_PAYMENT_SETTINGS.payosApiKey || 'dd08ccd2-51cf-4374-a33e-aa5d90d42004';

  try {
    const res = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${numericCode}`, {
      method: 'GET',
      headers: {
        'x-client-id': clientId,
        'x-api-key': apiKey
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.code === '00' && json.data?.status === 'PAID') {
        return {
          paid: true,
          payment: {
            orderId: String(numericCode),
            amount: json.data.amountPaid || json.data.amount,
            status: 'success',
            paid: true,
            provider: 'payos',
            reference: json.data.transactions?.[0]?.reference || 'PAYOS_DIRECT'
          }
        };
      }
    }
  } catch (e) {
    // Ignore transient errors
  }

  return { paid: false };
}
