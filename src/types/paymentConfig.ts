export interface ShopPaymentSettings {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  exchangeRate: number; // e.g. 25000
  transferPrefix: string; // e.g. "PORTFOLIO"
  qrTimerMinutes: number; // e.g. 15
  enableCardPayment: boolean;
  enableQrPayment: boolean;
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
  bankName: 'MB BANK (Ngân hàng Quân Đội)',
  accountNumber: '0988889999',
  accountHolder: 'TRAN VAN TRUNG',
  exchangeRate: 25000,
  transferPrefix: 'PORTFOLIO',
  qrTimerMinutes: 15,
  enableCardPayment: true,
  enableQrPayment: true,
  stripePublishableKey: 'pk_test_sample_key_12345',
  isSandboxMode: true,
  defaultSubdomainSuffix: '.portfolio-shop.com',
  checkoutTitle: 'Portfolio Shop Checkout',
  perk1: 'Sở hữu trọn đời — Không phí duy trì hàng tháng',
  perk2: 'Cấp Subdomain tốc độ cao qua Cloudflare Edge',
  perk3: 'Bàn giao toàn quyền chỉnh sửa nội dung & SEO',
  successMessage: 'Chúc Mừng Bạn Đã Sở Hữu Portfolio!'
};

export const getSavedPaymentSettings = (): ShopPaymentSettings => {
  if (typeof window === 'undefined') return DEFAULT_PAYMENT_SETTINGS;
  try {
    const saved = localStorage.getItem('shop_payment_settings');
    if (saved) {
      return { ...DEFAULT_PAYMENT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading payment settings:', e);
  }
  return DEFAULT_PAYMENT_SETTINGS;
};

export const savePaymentSettings = (settings: ShopPaymentSettings): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('shop_payment_settings', JSON.stringify(settings));
};
