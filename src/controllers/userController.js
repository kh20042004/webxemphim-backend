// ==================== USER CONTROLLER ====================
//
// Mô tả: Xử lý logic liên quan tới thông tin người dùng (profile, password, VIP, ...)
// Sử dụng: const userController = require('../controllers/userController');
//

const User = require('../models/User');
const { HTTP_STATUS, PATTERNS, VIP_PLANS } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// ==================== API: LẤY PROFILE ====================

/**
 * GET /api/user/profile
 * Mô tả: Lấy thông tin profile của user hiện tại
 * Headers: Authorization: Bearer <token>
 * Response: { success, user }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = req.user;

    return sendSuccess(
      res,
      user.toJSON(),
      'Lấy profile thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: CẬP NHẬT PROFILE ====================

/**
 * PUT /api/user/profile
 * Mô tả: Cập nhật thông tin user hiện tại (fullName, avatar)
 * Headers: Authorization: Bearer <token>
 * Body: { fullName, avatar }
 * Response: { success, user }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, avatar } = req.body;
    const userId = req.user._id;

    // ============ VALIDATE DỮ LIỆU ====================
    const updateData = {};

    if (fullName) {
      if (typeof fullName !== 'string' || fullName.trim().length === 0) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Họ tên không hợp lệ (phải là chuỗi, không trống)'
        );
      }
      updateData.fullName = fullName.trim();
    }

    if (avatar) {
      if (typeof avatar !== 'string' || avatar.trim().length === 0) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Avatar không hợp lệ (phải là URL, không trống)'
        );
      }
      updateData.avatar = avatar.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp ít nhất 1 field để cập nhật (fullName hoặc avatar)'
      );
    }

    // ============ CẬP NHẬT USER ====================
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    return sendSuccess(
      res,
      user.toJSON(),
      'Cập nhật profile thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: CẬP NHẬT MẬT KHẨU ====================

/**
 * PUT /api/user/password
 * Mô tả: Cập nhật mật khẩu user
 * Headers: Authorization: Bearer <token>
 * Body: { oldPassword, newPassword, passwordConfirm }
 * Response: { success, message }
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword, passwordConfirm } = req.body;
    const userId = req.user._id;

    // ============ VALIDATE DỮ LIỆU ====================
    if (!oldPassword || !newPassword || !passwordConfirm) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng nhập đầy đủ thông tin (oldPassword, newPassword, passwordConfirm)'
      );
    }

    if (newPassword !== passwordConfirm) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới không khớp'
      );
    }

    if (newPassword.length < 6) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới phải ít nhất 6 ký tự'
      );
    }

    if (oldPassword === newPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới phải khác mật khẩu cũ'
      );
    }

    // ============ LẤY USER CÙNG VỚI PASSWORD ====================
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'User không tồn tại'
      );
    }

    // ============ KIỂM TRA OLD PASSWORD ====================
    const isOldPasswordCorrect = await user.matchPassword(oldPassword);

    if (!isOldPasswordCorrect) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Mật khẩu cũ không đúng'
      );
    }

    // ============ CẬP NHẬT MẬT KHẨU MỚI ====================
    user.password = newPassword;
    await user.save();

    return sendSuccess(
      res,
      null,
      'Cập nhật mật khẩu thành công'
    );
  } catch (error) {
    next(error);
  }
};

// ==================== API: ĐĂNG KÝ VIP ====================

/**
 * POST /api/user/subscribe
 * Mô tả: Đăng ký/Gia hạn gói VIP
 * Headers: Authorization: Bearer <token>
 * Body: { plan } (premium, vip)
 * Response: { success, message, data: { plan, expiryDate } }
 * Logic: Cộng dồn 30 ngày từ ngày hết hạn cũ hoặc hôm nay
 * Middleware: protect (yêu cầu đăng nhập)
 */
exports.subscribeVIP = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    // ============ VALIDATE PLAN ====================
    if (!plan || !Object.values(VIP_PLANS).includes(plan) || plan === VIP_PLANS.FREE) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Loại gói không hợp lệ (phải là premium hoặc vip)'
      );
    }

    // ============ LẤY USER ====================
    const user = await User.findById(userId);

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'User không tồn tại'
      );
    }

    // ============ TÍnh toán ngày hết hạn ====================
    const DAYS_TO_ADD = 30; // 1 tháng mặc định
    let startDate = new Date();

    // Nếu đang là VIP và còn hạn, cộng dồn từ ngày hết hạn cũ
    if (
      user.subscription &&
      user.subscription.plan !== VIP_PLANS.FREE &&
      new Date(user.subscription.expiryDate) > new Date()
    ) {
      startDate = new Date(user.subscription.expiryDate);
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + DAYS_TO_ADD);

    // ============ CẬP NHẬT SUBSCRIPTION ====================
    user.subscription = {
      plan,
      startDate: new Date(),
      expiryDate,
    };

    await user.save();

    return sendSuccess(
      res,
      {
        plan: user.subscription.plan,
        expiryDate: user.subscription.expiryDate,
      },
      `Đăng ký gói ${plan} thành công!`
    );
  } catch (error) {
    next(error);
  }
};
