// ==================== USER MODEL ====================
//
// Mô tả: Schema MongoDB cho User (Người dùng)
// Dùng để: Lưu thông tin tài khoản (email, password, fullName, avatar, role, subscription)
// Sử dụng: const User = require('../models/User');
//

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, VIP_PLANS } = require('../config/constants');

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

    username: {
      type: String,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      // Bắt buộc khi đăng ký thường, KHÔNG bắt buộc với user Google OAuth (họ không có password)
      // Dùng function để kiểm tra điều kiện: nếu googleId tồn tại thì không cần password
      required: [
        function () {
          return !this.googleId; // Chỉ required khi không phải Google user
        },
        'Password là bắt buộc',
      ],
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

    // ============ Google OAuth ============
    googleId: {
      type: String,
      // ✅ Bỏ default: null để tránh duplicate key error
      // Khi user đăng ký bình thường (không Google OAuth), googleId sẽ undefined (không được lưu)
      unique: true,
      sparse: true, // Cho phép null/undefined values mà không bị duplicate
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // ============ Password Reset ============
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false,
    },

    // ============ VIP / Subscription ============
    subscription: {
      plan: {
        type: String,
        enum: Object.values(VIP_PLANS),
        default: VIP_PLANS.FREE,
      },
      startDate: {
        type: Date,
      },
      expiryDate: {
        type: Date,
      },
    },

    // ============ Favorites / Phim Yêu Thích ============
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie', // Tham chiếu tới Movie model
    }],
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
  // QUAN TRỌNG: phải có 'return' để dừng lại, không thì code vẫn chạy xuống dưới
  if (!this.isModified('password')) {
    return next();
  }

  // Bỏ qua nếu user Google OAuth (không có password)
  if (!this.password) {
    return next();
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
 * Phương thức: So sánh password (alias comparePassword)
 * @param {string} candidatePassword - Password cần so sánh
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
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
 * Phương thức: Kiểm tra VIP còn hạn không
 * @returns {boolean} - True nếu VIP active
 */
userSchema.methods.isVIPActive = function () {
  if (!this.subscription || this.subscription.plan === VIP_PLANS.FREE) {
    return false;
  }
  if (!this.subscription.expiryDate) {
    return false;
  }
  return new Date() < new Date(this.subscription.expiryDate);
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
userSchema.index({ username: 1 });

// ==================== STATIC METHODS ====================

/**
 * Static method: Lấy user theo email
 * @param {string} email - User email
 * @returns {Promise<object>} User object
 */
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Phương thức: Tạo token reset password
 * Dùng cho: Forgot Password flow
 * @returns {string} - Reset password token (6 digits)
 */
userSchema.methods.createPasswordResetToken = function () {
  const crypto = require('crypto');
  // Sinh token ngẫu nhiên 6 chữ số
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Hash token để lưu vào DB
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Token hết hạn sau 15 phút
  this.resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000);
  
  return resetToken;
};

// ==================== TẠO VÀ EXPORT MODEL ====================
const User = mongoose.model('User', userSchema);

module.exports = User;
