/**
 * Comprehensive Auto-Translation Engine for Vietnamese <-> English
 * Automatically parses, matches and translates any current or future UI text.
 */

// Common vocabulary dictionary for phrase & sentence replacement
export const DICTIONARY_VI_TO_EN: Array<[RegExp | string, string]> = [
  // Full Dashboard phrases & sentences
  ['Quản Lý Tên Miền & Subdomain', 'Manage Domains & Subdomains'],
  ['Lịch Sử Mua Template & Đơn Hàng', 'Template Purchase & Order History'],
  ['Template Của Tôi', 'My Templates'],
  ['Cài Đặt Tài Khoản', 'Account Settings'],
  ['Khám phá Giao diện', 'Explore Templates'],
  ['Kho Template', 'Template Store'],
  ['Admin Control Panel', 'Admin Control Panel'],
  ['Đang Hoạt Động (Online)', 'Active (Online)'],
  ['Đã Tắt (Offline - Lỗi 404)', 'Turned Off (Offline - 404 Error)'],
  ['Đang Bật (Active • Online)', 'Active (Online)'],
  ['Đã Tắt (Off • 404 Error)', 'Turned Off (404 Error)'],
  ['Tổng Template Sở Hữu', 'Total Owned Templates'],
  ['Không Gian Thương Hiệu Gốc Của Bạn', 'Your Primary Brand Subdomain'],
  ['Mọi Template bạn mua sẽ nằm trong thư mục con của tên miền này', 'Every template you purchase will reside under subpaths of this domain'],
  ['Đổi Tên Subdomain', 'Change Subdomain'],
  ['Lưu Tên Mới', 'Save New Name'],
  ['Mở Website', 'Open Website'],
  ['Xem Website', 'View Website'],
  ['Quản Trị Template', 'Admin Template'],
  ['Quản Trị', 'Admin'],
  ['Danh Sách Template Sở Hữu', 'Owned Templates List'],
  ['Mỗi template là một folder độc lập dưới tên miền chính', 'Each template is an isolated subfolder under your primary domain'],
  ['Gắn Tên Miền Riêng (Custom Domain)', 'Connect Custom Domain'],
  ['Trỏ tên miền của riêng bạn (ví dụ: tranvantrung.vn) về hệ thống', 'Point your own domain (e.g. yourname.com) to the system'],
  ['Thêm Tên Miền Riêng', 'Add Custom Domain'],
  ['Kết Nối Tên Miền Của Bạn', 'Connect Your Domain'],
  ['Xác Nhận Kết Nối', 'Confirm Connection'],
  ['Tên Miền Đã Kết Nối:', 'Connected Domains:'],
  ['SSL Miễn Phí Đã Bật', 'Free SSL Active'],
  ['SSL Active', 'SSL Active'],
  ['Gỡ bỏ', 'Remove'],
  ['Loại (Type)', 'Type'],
  ['Tên / Host', 'Host / Name'],
  ['Giá trị trỏ đến (Points to)', 'Points to'],
  ['Tự động (3600)', 'Auto (3600)'],
  ['Thông Tin Hồ Sơ & Định Danh', 'Profile Information & User ID'],
  ['Tự động đồng bộ từ tài khoản Google hoặc Số điện thoại', 'Automatically synced with your Google account or Phone number'],
  ['Quản lý Tên miền & Subdomain', 'Manage Domains & Subdomains'],
  ['User ID (Định danh hệ thống) *', 'User ID (System Identifier) *'],
  ['Subdomain gắn với User ID:', 'Subdomain linked to User ID:'],
  ['Dùng cho Subdomain', 'Used for Subdomain'],
  ['Họ và Tên', 'Full Name'],
  ['Địa Chỉ Email', 'Email Address'],
  ['Số Điện Thoại', 'Phone Number'],
  ['Lưu Thay Đổi Thông Tin', 'Save Profile Changes'],
  ['Thiết Lập & Đổi Mật Khẩu', 'Set & Change Password'],
  ['Tạo hoặc đổi mật khẩu mới để đăng nhập nhanh', 'Create or update your password for fast login'],
  ['Mật Khẩu Mới', 'New Password'],
  ['Xác Nhận Mật Khẩu Mới', 'Confirm New Password'],
  ['Cập Nhật Mật Khẩu', 'Update Password'],
  ['Lọc trạng thái:', 'Status Filter:'],
  ['Đang Bật', 'Active'],
  ['Đã Tắt', 'Turned Off'],
  ['Tất cả', 'All'],
  ['Đã Thanh Toán', 'Paid'],
  ['Chưa Thanh Toán', 'Unpaid'],
  ['Thời gian mua:', 'Purchased Date:'],
  ['Thời hạn sở hữu:', 'Duration:'],
  ['Hạn dùng đến:', 'Expires on:'],
  ['Số tiền đã thanh toán', 'Total Paid Amount'],
  ['Hóa Đơn', 'Invoice'],
  ['Gia Hạn', 'Renew'],
  ['Gia Hạn Bản Quyền Template', 'Renew Template License'],
  ['Chọn Gói Thời Gian Gia Hạn:', 'Select Renewal Duration Plan:'],
  ['Quét QR Chuyển Khoản Gia Hạn:', 'Scan QR Code to Renew:'],
  ['Cú pháp:', 'Content:'],
  ['Hóa Đơn Dịch Vụ Điện Tử', 'Electronic Service Invoice'],
  ['Đơn vị phát hành:', 'Issuer:'],
  ['Khách hàng:', 'Customer:'],
  ['Template dịch vụ:', 'Template:'],
  ['Thời hạn sử dụng:', 'License Duration:'],
  ['Hình thức thanh toán:', 'Payment Method:'],
  ['TỔNG TIỀN THANH TOÁN:', 'TOTAL AMOUNT:'],
  ['In Hóa Đơn / Lưu PDF', 'Print Invoice / Save PDF'],
  ['Đóng', 'Close'],
  ['Sao chép', 'Copy'],
  ['Đã sao chép', 'Copied'],
  ['Trạng thái tên miền', 'Domain Status'],
  ['BẬT (Online)', 'ON (Online)'],
  ['TẮT (Offline)', 'OFF (Offline)'],
  ['BẬT', 'ON'],
  ['TẮT', 'OFF'],
  ['Đang Hoạt Động', 'Active'],
  ['Đăng xuất', 'Sign Out'],
  ['Đăng nhập', 'Sign In'],
  ['Đăng ký', 'Sign Up'],
  ['Tổng quan', 'Overview'],
  ['Đơn hàng', 'Orders'],
  ['Cài đặt', 'Settings'],
  ['Tìm kiếm', 'Search'],
  ['Giao diện', 'Templates'],
  ['Trang chủ', 'Home'],
  ['Xin chào', 'Hello'],
  ['Bảo Mật & CDN', 'Security & CDN'],
  ['Template Đang Bật', 'Active Templates'],
  ['Subdomain Chính', 'Primary Subdomain'],
  ['Template Gần Đây', 'Recent Templates'],
  ['Xem tất cả', 'View All'],
  ['Chưa có đơn hàng nào', 'No orders yet'],
  ['Chưa có Template nào', 'No templates yet'],
  ['Bạn chưa sở hữu Template nào', 'You do not own any templates yet'],
  ['Khám Phá Template Ngay', 'Explore Templates Now'],
  ['Khám Phá Giao Diện', 'Explore Templates'],
  ['Mua Template Đầu Tiên', 'Buy First Template'],
  ['Trọn Đời', 'Lifetime'],
  ['1 Năm', '1 Year'],
  ['2 Năm', '2 Years'],
  ['1 Tháng', '1 Month'],
  ['3 Tháng', '3 Months'],
  ['6 Tháng', '6 Months'],
  ['Năm', 'Year(s)'],
  ['Tháng', 'Month(s)'],
  ['Ngày', 'Day(s)'],
  ['Tiết kiệm', 'Save'],
  ['Phổ biến', 'Popular'],
  ['Đã Hết Hạn', 'Expired'],
  ['Sắp hết hạn', 'Expiring soon'],
  ['Còn', 'Remaining'],
  ['ngày', 'days'],
  ['tháng', 'months'],
  ['năm', 'years'],
  ['Hủy', 'Cancel'],
  ['Lưu', 'Save'],
  ['Xóa', 'Delete'],
  ['Sửa', 'Edit'],
  ['Chỉnh sửa', 'Edit'],
  ['Tạo mới', 'Create New'],
  ['Xác nhận', 'Confirm'],
  ['Thành công', 'Success'],
  ['Thất bại', 'Failed'],
  ['Đang tải...', 'Loading...'],
  ['Đang lưu...', 'Saving...'],
  ['Đang cập nhật...', 'Updating...'],
  ['Vui lòng chờ...', 'Please wait...'],
];

// Regex / Token based universal dynamic translation
export function translateText(text: string, targetLang: 'vi' | 'en'): string {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  // If target is Vietnamese, check if it's already translated or can be mapped back
  if (targetLang === 'vi') {
    for (const [vi, en] of DICTIONARY_VI_TO_EN) {
      if (typeof vi === 'string' && typeof en === 'string' && trimmed.toLowerCase() === en.toLowerCase()) {
        return text.replace(new RegExp(en, 'i'), vi);
      }
    }
    return text;
  }

  // Target is English:
  let translated = text;

  // 1. Direct exact or substring match in dictionary
  for (const [pattern, replacement] of DICTIONARY_VI_TO_EN) {
    if (typeof pattern === 'string') {
      if (translated.includes(pattern)) {
        translated = translated.split(pattern).join(replacement);
      }
    } else if (pattern instanceof RegExp) {
      translated = translated.replace(pattern, replacement);
    }
  }

  // 2. Dynamic Pattern Translators
  // e.g., "Còn 25 ngày" -> "25 days remaining"
  translated = translated.replace(/Còn\s+(\d+)\s+ngày/gi, '$1 days left');
  // e.g., "Sắp hết hạn (10 ngày)" -> "Expiring soon (10 days)"
  translated = translated.replace(/Sắp hết hạn\s*\(([^)]+)\)/gi, 'Expiring soon ($1)');
  // e.g., "Tổng sở hữu: 5 Template" -> "Total owned: 5 Templates"
  translated = translated.replace(/Tổng sở hữu:\s*(\d+)\s*Template/gi, 'Total owned: $1 Templates');
  // e.g., "Tổng số: 5 trang" -> "Total: $1 pages"
  translated = translated.replace(/Tổng số:\s*(\d+)\s*trang/gi, 'Total: $1 pages');
  // e.g., "Đơn hàng: #ORD-123" -> "Order: #ORD-123"
  translated = translated.replace(/Đơn hàng:\s*(#[A-Za-z0-9-_]+)/gi, 'Order: $1');
  // e.g., "Mã hóa đơn: INV-123" -> "Invoice ID: INV-123"
  translated = translated.replace(/Mã hóa đơn:\s*([A-Za-z0-9-_]+)/gi, 'Invoice ID: $1');
  // e.g., "Gia hạn thành công" -> "Renewed successfully"
  translated = translated.replace(/Gia hạn thành công/gi, 'Renewed successfully');

  return translated;
}
