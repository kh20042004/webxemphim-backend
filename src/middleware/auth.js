// ==================== AUTH MIDDLEWARE ====================
//
// Mô tả: Middleware kiểm tra JWT token và xác thực user
// Dùng cho: Bảo vệ các route cần đăng nhập
// Sử dụng:
//   const { protect, authorize, requireAdmin } = require('../middleware/auth');
//   router.get('/profile', protect, profileController);
//   router.delete('/admin/users', protect, authorize('admin'), deleteUser);
//

const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const User = require('../models/User');
const { HTTP_STATUS, MESSAGES, USER_ROLES, VIP_PLANS } = require('../config/constants');

// ==================== MIDDLEWARE: KIỂM TRA ĐĂNG NHẬP ====================

/**
 * Middleware: Kiểm tra user có token hợp lệ không
 * Nếu hợp lệ: Lấy user từ DB, gán vào req.user
 * Nếu không: Trả về lỗi 401 Unauthorized
 * 
 * Cách dùng token:
 * - Header: Authorization: Bearer <token>
 */
exports.protect = async (req, res, next) => {
  let token;

  // ============ Lấy token từ header ============
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Format: "Bearer token_value"
    token = req.headers.authorization.split(' ')[1];
  }

  // ============ Kiểm tra token có tồn tại không ============
  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.UNAUTHORIZED, // 'Bạn chưa đăng nhập'
    });
  }

  try {
    // ============ Giải mã token (verify) ============
    // Nếu token không hợp lệ hoặc hết hạn, jwt.verify sẽ throw error
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // ============ Lấy user từ database ============
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'User không tồn tại',
      });
    }

    // ============ Kiểm tra user có active không ============
    if (!user.isActive) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    // ============ Gán user vào req.user để dùng ở controller ============
    req.user = user;
    next();
  } catch (error) {
    // ============ Xử lý lỗi token ============
    let message = MESSAGES.UNAUTHORIZED;

    // Kiểm tra loại lỗi
    if (error.name === 'TokenExpiredError') {
      message = 'Token đã hết hạn';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token không hợp lệ';
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: message,
    });
  }
};

// ==================== MIDDLEWARE: KIỂM TRA ROLE (ADMIN) ====================

/**
 * Middleware: Kiểm tra user có role yêu cầu không
 * Dùng kèm với protect middleware
 * 
 * Cách dùng:
 * router.delete('/admin/users', protect, authorize('admin'), deleteUser);
 * router.put('/moderator/comments', protect, authorize('admin', 'moderator'), approveComment);
 * 
 * @param {...string} roles - Danh sách roles được phép
 * @returns {function} - Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Kiểm tra user có role không
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
      });
    }

    // Kiểm tra user.role có nằm trong danh sách roles được phép không
    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN, // 'Bạn không có quyền'
      });
    }

    next();
  };
};

// ==================== MIDDLEWARE: VIP CHECK ====================

/**
 * Middleware: Kiểm tra user có VIP còn hạn không
 * Nếu không có VIP hoặc hết hạn: Trả về 403 Forbidden
 * 
 * Cách dùng:
 * router.get('/premium-feature', protect, vipMiddleware, premiumController);
 */
exports.vipMiddleware = (req, res, next) => {
  // Kiểm tra nếu có subscription với expiryDate > now
  // Lưu ý: gói miễn phí là VIP_PLANS.FREE, không phải USER_ROLES.FREE (USER_ROLES chỉ có user/admin/moderator)
  const hasValidVIP =
    req.user?.subscription &&
    req.user.subscription.plan !== VIP_PLANS.FREE &&
    req.user.subscription.expiryDate &&
    new Date(req.user.subscription.expiryDate) > new Date();

  if (!hasValidVIP) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Tính năng này yêu cầu VIP còn hạn',
    });
  }

  next();
};

// ==================== MIDDLEWARE: SHORTCUT ====================

/**
 * Middleware: Kiểm tra admin
 * Equivalent to: authorize('admin')
 */
exports.requireAdmin = exports.authorize('admin');

/**
 * Middleware: Kiểm tra admin hoặc moderator
 */
exports.requireModerator = exports.authorize(USER_ROLES.ADMIN, USER_ROLES.MODERATOR);


