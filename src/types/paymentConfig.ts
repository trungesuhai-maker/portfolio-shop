import { DEFAULT_SETTINGS } from '../services/defaultSettings';

export interface VietQrBank {
  code: string; // e.g. "MB", "VCB", "TCB"
  bin: string; // e.g. "970422"
  shortName: string;
  name: string;
}

export const VIETQR_BANKS: VietQrBank[] = [
  { code: 'MB', bin: '970422', shortName: 'MBBank', name: 'Ngân hàng Quân Đội (MB Bank)' },
  { code: 'VCB', bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương (Vietcombank)' },
  { code: 'TCB', bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương (Techcombank)' },
  { code: 'ACB', bin: '970416', shortName: 'ACB', name: 'Ngân hàng Á Châu (ACB)' },
  { code: 'VPB', bin: '970432', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)' },
  { code: 'ICB', bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng Công Thương (VietinBank)' },
  { code: 'BIDV', bin: '970418', shortName: 'BIDV', name: 'Ngân hàng Đầu tư & Phát triển (BIDV)' },
  { code: 'TPB', bin: '970423', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong (TPBank)' },
  { code: 'STB', bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)' },
  { code: 'HDB', bin: '970437', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM (HDBank)' },
  { code: 'OCB', bin: '970448', shortName: 'OCB', name: 'Ngân hàng Phương Đông (OCB)' },
  { code: 'VIB', bin: '970441', shortName: 'VIB', name: 'Ngân hàng Quốc Tế (VIB)' },
  { code: 'MSB', bin: '970426', shortName: 'MSB', name: 'Ngân hàng Hàng Hải (MSB)' },
  { code: 'SHB', bin: '970443', shortName: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)' },
  { code: 'LPB', bin: '970449', shortName: 'LPBank', name: 'Ngân hàng Bưu Điện Liên Việt (LPBank)' },
  { code: 'CAKE', bin: '546034', shortName: 'CAKE', name: 'Ngân hàng số CAKE by VPBank' },
  { code: 'TIMO', bin: '963388', shortName: 'Timo', name: 'Ngân hàng số Timo by BVBank' },
];

export interface ShopPaymentSettings {
  bankCode?: string; // Standard VietQR Bank Code e.g. "MB", "VCB", "TCB"
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  exchangeRate: number; // e.g. 25000
  transferPrefix: string; // e.g. "PORTFOLIO"
  qrTimerMinutes: number; // e.g. 15
  enableCardPayment: boolean;
  enableQrPayment: boolean;
  enablePayOS?: boolean;
  payosClientId?: string;
  payosApiKey?: string;
  payosChecksumKey?: string;
  stripePublishableKey: string;
  isSandboxMode: boolean;
  defaultSubdomainSuffix: string; // e.g. ".portfolio-shop.com"
  checkoutTitle: string; // e.g. "Portfolio Shop Checkout"
  perk1: string;
  perk2: string;
  perk3: string;
  successMessage: string;
}

export const DEFAULT_PAYMENT_SETTINGS: ShopPaymentSettings = {
  bankCode: 'ACB',
  bankName: 'ACB (Ngân hàng Á Châu)',
  accountNumber: '13316437',
  accountHolder: 'TRAN QUANG TRUNG',
  exchangeRate: 25000,
  transferPrefix: 'PORTFOLIO',
  qrTimerMinutes: 15,
  enableCardPayment: true,
  enableQrPayment: true,
  enablePayOS: true,
  payosClientId: 'c2121c0c-5885-4bb0-98bb-3bb2b7829295',
  payosApiKey: 'dd08ccd2-51cf-4374-a33e-aa5d90d42004',
  payosChecksumKey: 'd61a7decd1193bc851d69344fbfd2844a90d5f764e1ee1c5ae0565ae22b91595',
  stripePublishableKey: 'pk_test_sample_key_12345',
  isSandboxMode: true,
  defaultSubdomainSuffix: '.portfolio-shop.com',
  checkoutTitle: 'Portfolio Shop Checkout',
  perk1: 'Sở hữu trọn đời — Không phí duy trì hàng tháng',
  perk2: 'Cấp Subdomain tốc độ cao qua Cloudflare Edge',
  perk3: 'Bàn giao toàn quyền chỉnh sửa nội dung & SEO',
  successMessage: 'Chúc Mừng Bạn Đã Sở Hữu Portfolio!'
};

/**
 * Generates an official, standard VietQR (Napas 247) image URL
 * that all Vietnamese banking apps (MB, VCB, TCB, VPB, TPB, BIDV, etc.)
 * scan and auto-fill amount, account, and transfer memo.
 */
export const generateVietQrUrl = (
  settings: Partial<ShopPaymentSettings>,
  amountVND: number,
  transferMemo: string
): string => {
  const bankCode = (settings.bankCode || 'MB').trim().toUpperCase();
  const foundBank = VIETQR_BANKS.find(b => b.code === bankCode || b.shortName.toUpperCase() === bankCode);
  const bankIdentifier = foundBank ? foundBank.bin : bankCode;

  const cleanStk = (settings.accountNumber || '').replace(/[^0-9a-zA-Z]/g, '').trim();
  // Strip hyphens and special characters so banking app scanners don't reject the memo
  const cleanMemo = (transferMemo || '').replace(/[-_]/g, ' ').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const cleanHolder = (settings.accountHolder || '').trim().toUpperCase();
  const cleanAmount = Math.max(0, Math.round(amountVND));

  if (!cleanStk) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NO_ACCOUNT_CONFIGURED`;
  }

  // Official VietQR standard format (compact2 template includes Napas logo, bank logo, amount & memo)
  const encodedMemo = encodeURIComponent(cleanMemo);
  const encodedHolder = encodeURIComponent(cleanHolder);
  return `https://img.vietqr.io/image/${bankIdentifier}-${cleanStk}-compact2.png?amount=${cleanAmount}&addInfo=${encodedMemo}&accountName=${encodedHolder}`;
};

export const getSavedPaymentSettings = (): ShopPaymentSettings => {
  const defaultFromCode = (DEFAULT_SETTINGS as any)?.paymentSettings || DEFAULT_PAYMENT_SETTINGS;
  if (typeof window === 'undefined') return defaultFromCode;
  try {
    const saved = localStorage.getItem('shop_payment_settings');
    if (saved) {
      return { ...defaultFromCode, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading payment settings:', e);
  }
  return defaultFromCode;
};

export const savePaymentSettings = (settings: ShopPaymentSettings): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('shop_payment_settings', JSON.stringify(settings));
};
