// ==================== HẰNG SỐ CHUNG CỦA DỰ ÁN ====================
//
// File này chứa tất cả các hằng số (constant) dùng chung cho cả project
// Sử dụng: const { MOVIE_TYPES, ... } = require('../config/constants');
//

// ============ Loại Phim ============
const MOVIE_TYPES = {
  SINGLE: 'phim_lẻ',        // Phim dài tập
  SERIES: 'phim_bộ',        // Phim nhiều tập
  TV_SHOW: 'tv_show',       // Chương trình TV
  KIDS: 'thiếu_nhi',        // Phim cho trẻ em
};

// ============ Vai Trò Người Dùng ============
const USER_ROLES = {
  USER: 'user',             // Người dùng thường
  ADMIN: 'admin',           // Admin quản lý hệ thống
  MODERATOR: 'moderator',   // Người kiểm duyệt bình luận
};

// ============ Gói VIP ============
const VIP_PLANS = {
  FREE: 'free',             // Miễn phí (không VIP)
  PREMIUM: 'premium',       // Gói Premium
  VIP: 'vip',               // Gói VIP cao cấp
};

// ============ HTTP Status Code ============
const HTTP_STATUS = {
  OK: 200,                  // Thành công
  CREATED: 201,             // Tạo mới thành công
  BAD_REQUEST: 400,         // Request không hợp lệ
  UNAUTHORIZED: 401,        // Chưa đăng nhập
  FORBIDDEN: 403,           // Không có quyền truy cập
  NOT_FOUND: 404,           // Không tìm thấy
  CONFLICT: 409,            // Xung đột (VD: email tồn tại)
  SERVER_ERROR: 500,        // Lỗi server
};

// ============ Phân Trang (Pagination) ============
const PAGINATION = {
  DEFAULT_LIMIT: 10,        // Số item mặc định/trang
  MAX_LIMIT: 100,           // Số item tối đa/trang
  DEFAULT_PAGE: 1,          // Trang mặc định
};

// ============ Thông Báo (Messages) ============
const MESSAGES = {
  SUCCESS: 'Thành công',
  ERROR: 'Lỗi',
  UNAUTHORIZED: 'Bạn chưa đăng nhập',
  FORBIDDEN: 'Bạn không có quyền',
  NOT_FOUND: 'Không tìm thấy',
  INVALID_INPUT: 'Dữ liệu không hợp lệ',
  EMAIL_EXISTS: 'Email đã tồn tại',
  INVALID_PASSWORD: 'Mật khẩu không đúng',
  NO_VIP: 'Tính năng này yêu cầu VIP',
};

// ============ Regex Patterns (Kiểm tra định dạng) ============
const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,                              // Email hợp lệ
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, // Pass phức tạp (8+ ký tự, có số, chữ hoa, chữ thường)
  PHONE: /^[0-9]{10,11}$/,                                          // Số điện thoại Việt Nam
};

module.exports = {
  MOVIE_TYPES,
  USER_ROLES,
  VIP_PLANS,
  HTTP_STATUS,
  PAGINATION,
  MESSAGES,
  PATTERNS,
};
