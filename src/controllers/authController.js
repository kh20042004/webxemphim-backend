// ==================== AUTH CONTROLLER ====================
//
// Mô tả: Xử lý logic cho các API xác thực (register, login, logout, getMe)
// Sử dụng: const authController = require('../controllers/authController');
//

const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const User = require('../models/User');
const { HTTP_STATUS, MESSAGES, USER_ROLES } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// ==================== HỆ THỐNG TẠO TOKEN JWT ====================

/**
 * Hàm tạo JWT token
 * @param {string} userId - ID của user
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload
    config.JWT_SECRET, // Secret key
    { expiresIn: config.JWT_EXPIRE } // Options (7d)
  );
};

// ==================== API: ĐĂNG KÝ TÀI KHOẢN ====================

/**
 * POST /api/auth/register
 * Mô tả: Đăng ký tài khoản mới
 * Body: { email, password, passwordConfirm, fullName }
 * Response: { success, token, user }
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, fullName } = req.body;

    // ============ VALIDATE DỮ LIỆU ====================
    // Kiểm tra các field bắt buộc
    if (!email || !password || !passwordConfirm || !fullName) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng nhập đầy đủ thông tin (email, password, passwordConfirm, fullName)'
      );
    }

    // Kiểm tra password khớp với passwordConfirm
    if (password !== passwordConfirm) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu không khớp'
      );
    }

    // Kiểm tra password độ dài >= 6
    if (password.length < 6) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu phải ít nhất 6 ký tự'
      );
    }

    // Kiểm tra email đã tồn tại chưa
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        MESSAGES.EMAIL_EXISTS // 'Email đã tồn tại'
      );
    }

    // ============ TẠO USER MỚI ====================
    user = await User.create({
      email: email.toLowerCase(),
      password, // Sẽ được hash tự động trong middleware pre('save')
      fullName,
      role: USER_ROLES.USER, // Role mặc định là 'user'
      avatar: null,
    });

    // ============ TẠO TOKEN ====================
    const token = generateToken(user._id);

    // ============ TRẢ VỀ RESPONSE ====================
    return sendSuccess(
      res,
      {
        token,
        user: user.toJSON(), // Không trả về password
      },
      'Đăng ký thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: ĐĂNG NHẬP ====================

/**
 * POST /api/auth/login
 * Mô tả: Đăng nhập
 * Body: { email, password }
 * Response: { success, token, user }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ============ VALIDATE DỮ LIỆU ====================
    if (!email || !password) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng nhập email và mật khẩu'
      );
    }

    // ============ TÌM USER THEO EMAIL ====================
    // .select('+password') vì password có select: false ở Model
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Email hoặc mật khẩu không đúng'
      );
    }

    // ============ KIỂM TRA PASSWORD ====================
    // Dùng method matchPassword từ User model
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Email hoặc mật khẩu không đúng'
      );
    }

    // ============ CẬP NHẬT LAST LOGIN ====================
    user.lastLogin = new Date();
    await user.save();

    // ============ TẠO TOKEN ====================
    const token = generateToken(user._id);

    // ============ TRẢ VỀ RESPONSE ====================
    return sendSuccess(
      res,
      {
        token,
        user: user.toJSON(), // Không trả về password
      },
      'Đăng nhập thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: LẤY THÔNG TIN USER HIỆN TẠI ====================

/**
 * GET /api/auth/me
 * Mô tả: Lấy thông tin user từ token hiện tại
 * Headers: Authorization: Bearer <token>
 * Response: { success, user }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.getMe = async (req, res, next) => {
  try {
    // ============ LẤY USER TỪ REQUEST ====================
    // req.user được set bởi middleware protect
    const user = req.user;

    // ============ TRẢ VỀ RESPONSE ====================
    return sendSuccess(
      res,
      user.toJSON(),
      'Lấy thông tin profile thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: ĐĂNG XUẤT ====================

/**
 * POST /api/auth/logout
 * Mô tả: Đăng xuất (xóa token ở client)
 * Headers: Authorization: Bearer <token>
 * Response: { success, message }
 * Middleware: protect (yêu cầu đăng nhập)
 * 
 * Note: JWT là stateless, nên server không cần xóa token
 * Client sẽ tự xóa token từ localStorage/sessionStorage
 */
exports.logout = async (req, res, next) => {
  try {
    // ============ LOGIC ====================
    // JWT là stateless, nên server không cần làm gì
    // Client sẽ tự xóa token từ localStorage

    // Nếu muốn logout "hard" (blacklist token), cần tạo Redis/DB list
    // Nhưng bây giờ thì đơn giản là:
    // - Client xóa token
    // - Server trả về success

    // ============ TRẢ VỀ RESPONSE ====================
    return sendSuccess(
      res,
      null,
      'Đăng xuất thành công'
    );
  } catch (error) {
    next(error);
  }
};
