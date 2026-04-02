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
const { sendResetPasswordEmail } = require('../utils/emailService');

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

// ==================== API: QUÊN MẬT KHẨU - BƯỚC 1 ====================

/**
 * POST /api/auth/forgot-password
 * Mô tả: Gửi mã reset password tới email
 * Body: { email }
 * Response: { success, message }
 */
/**
 * POST /api/auth/forgot-password - BƯỚC 1: GỬI MÃ RESET PASSWORD QUA EMAIL
 * 
 * Quy trình:
 * 1. User gửi email
 * 2. Server tạo mã reset password, lưu vào DB
 * 3. Server gửi mã qua email
 * 💡 TIP: Chỉ hoạt động khi Gmail App Password đã cấu hình đúng
 * 
 * Body: { email }
 * Response: { success, message }
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // ============ VALIDATE DỮ LIỆU ====================
    // Kiểm tra user nhập email chưa
    if (!email) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng nhập email'
      );
    }

    // ============ TÌM USER THEO EMAIL ====================
    // Tìm user từ database
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // ⚠️ Bảo mật: Không nói email không tồn tại (vì vậy kẻ xấu không biết email nào đã dùng)
      // Luôn trả về thông báo chung
      return sendSuccess(
        res,
        null,
        'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã reset password'
      );
    }

    // ============ TẠO MÃ RESET PASSWORD ====================
    // Gọi method từ User model - tạo token 6 chữ số
    // Token này sẽ được gửi qua email
    const resetToken = user.createPasswordResetToken();
    
    // Lưu token vào database (validateBeforeSave: false tránh validate các field khác)
    await user.save({ validateBeforeSave: false });

    // ============ GỬI EMAIL ====================
    // 📧 Dùng Nodemailer + Gmail SMTP để gửi mã reset password
    // ❌ Nếu email service lỗi, xóa token, không lưu trạng thái
    try {
      await sendResetPasswordEmail(user.email, resetToken);
      console.log(`${new Date().toISOString()} - ✅ Email reset password đã gửi tới: ${user.email}`);
    } catch (emailError) {
      // Lỗi gửi email - xóa token không hợp lệ
      console.error(`${new Date().toISOString()} - ❌ Lỗi gửi email reset password:`, emailError.message);
      
      // Xóa reset token nếu gửi email thất bại (tránh user spam request)
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save({ validateBeforeSave: false });
      
      // Trả về lỗi cho frontend
      return sendError(
        res,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'Không thể gửi email. Kiểm tra: 1. Gmail credentials trong .env 2. Mạng internet 📧'
      );
    }

    // ============ TRẢ VỀ RESPONSE THÀNH CÔNG ====================
    // Không nên nói email tồn tại hay không (lý do bảo mật)
    return sendSuccess(
      res,
      { email: user.email },
      'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã reset password'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: RESET MẬT KHẨU - BƯỚC 2 ====================

/**
 * POST /api/auth/reset-password - BƯỚC 2: XÁC NHẬN MÃ VÀ ĐẶT MẬT KHẨU MỚI
 * 
 * Quy trình:
 * 1. User nhận email với mã 6 chữ số
 * 2. User nhập mã + mật khẩu mới
 * 3. Server xác minh mã (phải đúng và chưa hết hạn)
 * 4. Server lưu mật khẩu mới (đã hash)
 * 
 * Body: { email, code, newPassword, confirmPassword }
 * Response: { success, message }
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    // ============ VALIDATE DỮ LIỆU ====================
    // Kiểm tra tất cả field bắt buộc có được gửi không
    if (!email || !code || !newPassword || !confirmPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng nhập đầy đủ thông tin (email, code, newPassword, confirmPassword)'
      );
    }

    // Kiểm tra 2 password có khớp không
    if (newPassword !== confirmPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới không khớp'
      );
    }

    // Kiểm tra mật khẩu có đủ dài không (ít nhất 6 ký tự)
    if (newPassword.length < 6) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu phải ít nhất 6 ký tự'
      );
    }

    // ============ XÁC MINH MÃ RESET PASSWORD ====================
    // Mã được gửi qua email là plaintext 6 chữ số
    // Nhưng lưu trong DB đã hash (bảo mật)
    // Cần hash mã người dùng gửi lại và so sánh
    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    // Tìm user với 3 điều kiện:
    // 1. Email khớp
    // 2. Reset token (mã hash) khớp
    // 3. Reset token chưa hết hạn (resetPasswordExpire > hiện tại)
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedCode,
      resetPasswordExpire: { $gt: new Date() } // $gt = greater than (>)
    }).select('+password');

    // Nếu không tìm được user hoặc token hết hạn
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Mã reset password không hợp lệ hoặc đã hết hạn (15 phút)'
      );
    }

    // ============ CẬP NHẬT MẬT KHẨU MỚI ====================
    // Gán mật khẩu mới - lưu ý: sẽ được hash tự động bởi pre('save') middleware
    user.password = newPassword;
    
    // Xóa mã reset password (chỉ dùng 1 lần thôi)
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    
    // Lưu vào database - password sẽ được hash tự động
    await user.save();

    // ============ TRẢ VỀ RESPONSE THÀNH CÔNG ====================
    console.log(`${new Date().toISOString()} - ✅ User ${email} đã đặt lại mật khẩu thành công`);
    
    return sendSuccess(
      res,
      null,
      'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: GOOGLE OAUTH CALLBACK ====================

/**
 * GET /api/auth/google/callback
 * Mô tả: Xử lý callback từ Google OAuth
 * Middleware: passport.authenticate('google')
 * Logic: Tạo JWT token và redirect tới frontend với token
 */
exports.googleCallback = async (req, res, next) => {
  try {
    console.log('\n========== GOOGLE CALLBACK START ==========');
    console.log('req.user:', req.user);
    console.log('typeof req.user:', typeof req.user);
    
    // req.user được set bởi Passport sau khi authenticate thành công
    const user = req.user;

    if (!user) {
      console.error('❌ NO USER IN req.user');
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Không thể xác thực với Google'
      );
    }

    console.log('✅ User found:', user._id);

    // ============ TẠO JWT TOKEN ====================
    let token;
    try {
      token = generateToken(user._id);
      console.log('✅ Token generated successfully');
    } catch (tokenError) {
      console.error('❌ Token generation error:', tokenError.message);
      throw tokenError;
    }

    // ============ CẬP NHẬT LAST LOGIN ====================
    try {
      user.lastLogin = new Date();
      await user.save();
      console.log('✅ User lastLogin updated');
    } catch (saveError) {
      console.error('❌ Error saving user:', saveError.message);
      // Continue anyway, don't fail the whole callback
    }

    console.log('✅ Google OAuth Success - Redirecting to:', `${config.FRONTEND_URL}?token=${token}`);
    
    // ============ REDIRECT TỚI FRONTEND VỚI TOKEN ====================
    // Send only token - frontend will fetch user data using /api/auth/me
    res.redirect(
      `${config.FRONTEND_URL}?token=${token}`
    );
    
    console.log('========== GOOGLE CALLBACK END ==========\n');
  } catch (error) {
    console.error('\n❌ GOOGLE CALLBACK ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('=========================================\n');
    next(error);
  }
};
