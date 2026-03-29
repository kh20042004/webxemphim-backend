// ==================== USER CONTROLLER ====================
//
// Mô tả: Xử lý logic liên quan tới thông tin người dùng (profile, password, ...)
// Sử dụng: const userController = require('../controllers/userController');
//

const User = require('../models/User');
const { HTTP_STATUS, PATTERNS } = require('../config/constants');
const { sendSuccess, sendError } = require('../utils/responseHandler');

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
    // Chuẩn bị object tối cập nhật
    const updateData = {};

    // Nếu fullName được cung cấp, thêm vào updateData
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

    // Nếu avatar được cung cấp, thêm vào updateData
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

    // Kiểm tra có dữ liệu để cập nhật không
    if (Object.keys(updateData).length === 0) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Vui lòng cung cấp ít nhất 1 field để cập nhật (fullName hoặc avatar)'
      );
    }

    // ============ CẬP NHẬT USER ====================
    // {new: true} để trả về user sau khi update
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true } // runValidators để chạy validation schema
    );

    // ============ TRẢ VỀ RESPONSE ====================
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

    // Kiểm tra newPassword và passwordConfirm khớp
    if (newPassword !== passwordConfirm) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới không khớp'
      );
    }

    // Kiểm tra newPassword có ít nhất 6 ký tự
    if (newPassword.length < 6) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới phải ít nhất 6 ký tự'
      );
    }

    // Kiểm tra oldPassword không được bằng newPassword
    if (oldPassword === newPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Mật khẩu mới phải khác mật khẩu cũ'
      );
    }

    // ============ LẤY USER CÙNG VỚI PASSWORD ====================
    // .select('+password') vì password có select: false ở Model
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'User không tồn tại'
      );
    }

    // ============ KIỂM TRA OLD PASSWORD ====================
    // Dùng method matchPassword từ User model
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
    // .save() sẽ trigger middleware pre('save') để hash password
    await user.save();

    // ============ TRẢ VỀ RESPONSE ====================
    return sendSuccess(
      res,
      null,
      'Cập nhật mật khẩu thành công'
    );
  } catch (error) {
    next(error);
  }
};

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
