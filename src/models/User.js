// ==================== USER MODEL ====================
//
// Mô tả: Schema MongoDB cho User (Người dùng)
// Dùng để: Lưu thông tin tài khoản (email, password, fullName, avatar, role)
// Sử dụng: const User = require('../models/User');
//

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

// ==================== ĐỊNH NGHĨA SCHEMA ====================
const userSchema = new mongoose.Schema(
  {
    // ============ Thông tin cơ bản ============
    email: {
      type: String,
      required: [true, 'Email là bắt buộc'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Vui lòng nhập email hợp lệ'
      ],
    },

    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc'],
      minlength: [6, 'Mật khẩu phải ít nhất 6 ký tự'],
      select: false, // Không trả về password khi query mà không chỉ định rõ
    },

    fullName: {
      type: String,
      required: [true, 'Họ tên là bắt buộc'],
      trim: true,
    },

    avatar: {
      type: String,
      default: null, // URL ảnh đại diện (từ Cloudinary)
    },

    // ============ Vai trò & Quyền hạn ============
    role: {
      type: String,
      enum: Object.values(USER_ROLES), // 'user', 'admin', 'moderator'
      default: USER_ROLES.USER,
    },

    // ============ Trạng thái tài khoản ============
    isActive: {
      type: Boolean,
      default: true,
    },

    // ============ Lịch sử ============
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,
  }
);

// ==================== MIDDLEWARE MONGOOSE ====================

/**
 * Middleware: Trước khi lưu (save), hash password nếu password bị thay đổi
 * Dùng cho: register, update password
 */
userSchema.pre('save', async function (next) {
  // Chỉ hash password nếu password được thay đổi (isModified)
  if (!this.isModified('password')) {
    next();
  }

  try {
    // Tạo salt để hash password
    const salt = await bcrypt.genSalt(10);
    // Hash password với salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== PHƯƠNG THỨC CUSTOM ====================

/**
 * Phương thức: So sánh password nhập vào với password đã hash trong DB
 * Dùng cho: Login verification
 * @param {string} inputPassword - Password người dùng nhập vào
 * @returns {Promise<boolean>} - True nếu khớp, False nếu không
 */
userSchema.methods.matchPassword = async function (inputPassword) {
  try {
    // So sánh password nhập với password hash trong DB
    return await bcrypt.compare(inputPassword, this.password);
  } catch (error) {
    throw error;
  }
};

/**
 * Phương thức: Kiểm tra user có phải admin không
 * Dùng cho: Authorization check
 * @returns {boolean} - True nếu là admin
 */
userSchema.methods.isAdmin = function () {
  return this.role === USER_ROLES.ADMIN;
};

/**
 * Phương thức: Trả về object user mà không có sensitive data
 * Dùng cho: Response API
 * @returns {object} - User object không có password
 */
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password; // Xóa password
  return userObject;
};

// ==================== INDEX ====================
// Tạo index cho email để tìm kiếm nhanh hơn
userSchema.index({ email: 1 });

// ==================== STATIC METHODS ====================

/**
 * Static method: Lấy user theo email
 * @param {string} email - User email
 * @returns {Promise<object>} User object
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ==================== TẠO VÀ EXPORT MODEL ====================
const User = mongoose.model('User', userSchema);

module.exports = User;
