/**
 * storageUtils.ts
 * Tiện ích dọn dẹp và quản lý dữ liệu lưu trữ trên trình duyệt theo chuẩn 3 TH:
 * - TH1: guest_tpl_{templateId}
 * - TH2: user_{userId}_tpl_{templateId}
 * - TH3: Thuần Supabase Database, không dùng LocalStorage
 */

/**
 * Xóa sạch 100% dữ liệu dùng thử của Khách vãng lai (Guest)
 * Được gọi tự động ngay khi người dùng đăng nhập tài khoản thành công!
 */
export const clearGuestTrialData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Xóa tất cả các key dùng thử của khách vãng lai
      if (
        key.startsWith('guest_tpl_') ||
        key.startsWith('portfolio_data_draft-guest') ||
        key.startsWith('portfolio_preview_guest') ||
        key.startsWith('videograph_portfolio_data') ||
        key === 'portfolio_data_guest'
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
    });

    console.info(`[StorageUtils] Đã dọn dẹp ${keysToRemove.length} bản ghi rác của khách vãng lai khi đăng nhập.`);
  } catch (err) {
    console.warn('[StorageUtils] Lỗi khi dọn dẹp dữ liệu guest:', err);
  }
};
