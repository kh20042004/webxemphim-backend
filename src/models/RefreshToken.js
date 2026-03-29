// ========================================
// REFRESH TOKEN MODEL
// ========================================
// File: src/models/RefreshToken.js
// Mục đích: Lưu trữ refresh tokens trong database
// Sử dụng: Cho phép renew access token mà không cần login lại

const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * ============================================================
 * REFRESH TOKEN SCHEMA
 * ============================================================
 * Schema để lưu refresh token
 * - Mỗi user có thể có nhiều refresh tokens (multi-device)
 * - Token có thời hạn (30 ngày)
 * - Có thể revoke (thu hồi) token khi logout hoặc nghi ngờ bị hack
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    // ============ Token Information ============
    
    /**
     * Token string (hash)
     * - Lưu dạng hash để bảo mật
     * - Token gốc chỉ gửi cho user 1 lần khi login
     */
    token: {
      type: String,
      required: [true, 'Token là bắt buộc'],
      unique: true,
      index: true, // Index để tìm nhanh
    },
    
    // ============ User Reference ============
    
    /**
     * User sở hữu token này
     * - Tham chiếu tới User model
     * - Index để query nhanh tất cả tokens của 1 user
     */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID là bắt buộc'],
      index: true,
    },
    
    // ============ Expiration ============
    
    /**
     * Thời điểm hết hạn
     * - Mặc định: 30 ngày từ khi tạo
     * - Sau thời gian này, token không thể dùng
     */
    expiresAt: {
      type: Date,
      required: [true, 'Ngày hết hạn là bắt buộc'],
      index: true, // Index để xóa expired tokens
    },
    
    // ============ Revocation Status ============
    
    /**
     * Token đã bị thu hồi chưa
     * - true: Token bị vô hiệu hóa (logout, security breach)
     * - false: Token còn hợp lệ
     */
    isRevoked: {
      type: Boolean,
      default: false,
      index: true, // Index để filter tokens còn hợp lệ
    },
    
    /**
     * Lý do thu hồi token
     * - 'logout': User đăng xuất
     * - 'security': Nghi ngờ bị hack
     * - 'replaced': Token bị thay thế (rotation)
     * - 'expired': Hết hạn
     */
    revokedReason: {
      type: String,
      enum: ['logout', 'security', 'replaced', 'expired'],
    },
    
    /**
     * Thời điểm thu hồi
     */
    revokedAt: {
      type: Date,
    },
    
    // ============ Device Information ============
    
    /**
     * Thông tin thiết bị (optional)
     * - Giúp user quản lý đăng nhập trên nhiều thiết bị
     * - Có thể logout từ thiết bị cụ thể
     */
    deviceInfo: {
      userAgent: String,    // Browser/device info
      ip: String,           // IP address
      platform: String,     // 'web', 'mobile', 'tablet'
    },
    
    // ============ Token Rotation ============
    
    /**
     * Token cha (token cũ đã bị replace)
     * - Dùng để theo dõi refresh token chain
     * - Phát hiện token reuse attack
     */
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RefreshToken',
    },
  },
  {
    // Tự động thêm createdAt và updatedAt
    timestamps: true,
  }
);

// ============================================================
// INDEXES - Tối ưu hóa query
// ============================================================

/**
 * Compound index để query tokens còn hợp lệ của user
 * Query: Tìm tất cả tokens hợp lệ của user X
 */
refreshTokenSchema.index({ userId: 1, isRevoked: 1, expiresAt: 1 });

/**
 * Index để tự động xóa expired tokens
 * TTL index: Tự động xóa documents sau khi expiresAt
 */
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// ============================================================
// STATIC METHODS - Phương thức của Model
// ============================================================

/**
 * Tạo refresh token mới cho user
 * @param {ObjectId} userId - ID của user
 * @param {Object} deviceInfo - Thông tin thiết bị (optional)
 * @returns {Promise<{token: string, refreshTokenDoc: Object}>}
 */
refreshTokenSchema.statics.createToken = async function(userId, deviceInfo = {}) {
  // Tạo token ngẫu nhiên (64 bytes = 128 hex chars)
  const tokenString = crypto.randomBytes(64).toString('hex');
  
  // Hash token trước khi lưu database
  const tokenHash = crypto
    .createHash('sha256')
    .update(tokenString)
    .digest('hex');
  
  // Tính thời gian hết hạn (30 ngày)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  // Tạo document trong database
  const refreshToken = await this.create({
    token: tokenHash,
    userId,
    expiresAt,
    deviceInfo,
  });
  
  // Trả về token gốc (chưa hash) và document
  // ⚠️ Token gốc chỉ trả về 1 lần, không lưu lại
  return {
    token: tokenString,        // Token gốc (gửi cho client)
    refreshTokenDoc: refreshToken,  // Document trong DB
  };
};

/**
 * Verify refresh token
 * @param {string} tokenString - Token string từ client
 * @returns {Promise<Object|null>} RefreshToken document hoặc null
 */
refreshTokenSchema.statics.verifyToken = async function(tokenString) {
  // Hash token từ client
  const tokenHash = crypto
    .createHash('sha256')
    .update(tokenString)
    .digest('hex');
  
  // Tìm token trong database
  const refreshToken = await this.findOne({
    token: tokenHash,
    isRevoked: false,           // Chưa bị thu hồi
    expiresAt: { $gt: new Date() }, // Chưa hết hạn
  }).populate('userId', '-password -resetPasswordToken');
  
  return refreshToken;
};

/**
 * Revoke (thu hồi) token
 * @param {string} tokenString - Token string cần revoke
 * @param {string} reason - Lý do revoke
 * @returns {Promise<boolean>} True nếu thành công
 */
refreshTokenSchema.statics.revokeToken = async function(tokenString, reason = 'logout') {
  // Hash token
  const tokenHash = crypto
    .createHash('sha256')
    .update(tokenString)
    .digest('hex');
  
  // Update token
  const result = await this.updateOne(
    { token: tokenHash },
    {
      isRevoked: true,
      revokedReason: reason,
      revokedAt: new Date(),
    }
  );
  
  return result.modifiedCount > 0;
};

/**
 * Revoke tất cả tokens của user
 * Dùng khi: User đổi password, hoặc logout all devices
 * @param {ObjectId} userId - ID của user
 * @param {string} reason - Lý do revoke
 * @returns {Promise<number>} Số lượng tokens đã revoke
 */
refreshTokenSchema.statics.revokeAllUserTokens = async function(userId, reason = 'security') {
  const result = await this.updateMany(
    { userId, isRevoked: false },
    {
      isRevoked: true,
      revokedReason: reason,
      revokedAt: new Date(),
    }
  );
  
  return result.modifiedCount;
};

/**
 * Rotate refresh token (tạo mới và revoke cái cũ)
 * Security best practice: Mỗi lần refresh, tạo token mới
 * @param {string} oldTokenString - Token cũ
 * @param {Object} deviceInfo - Device info
 * @returns {Promise<Object>} Token mới
 */
refreshTokenSchema.statics.rotateToken = async function(oldTokenString, deviceInfo = {}) {
  // Verify token cũ
  const oldToken = await this.verifyToken(oldTokenString);
  
  if (!oldToken) {
    throw new Error('Token không hợp lệ hoặc đã hết hạn');
  }
  
  // Tạo token mới
  const { token: newTokenString, refreshTokenDoc: newToken } = await this.createToken(
    oldToken.userId,
    deviceInfo
  );
  
  // Revoke token cũ và link với token mới
  await this.updateOne(
    { _id: oldToken._id },
    {
      isRevoked: true,
      revokedReason: 'replaced',
      revokedAt: new Date(),
      replacedBy: newToken._id,
    }
  );
  
  return {
    token: newTokenString,
    refreshTokenDoc: newToken,
  };
};

/**
 * Xóa tất cả expired/revoked tokens (cleanup)
 * Chạy định kỳ để giữ database sạch
 * @returns {Promise<number>} Số lượng tokens đã xóa
 */
refreshTokenSchema.statics.cleanupTokens = async function() {
  const result = await this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },  // Đã hết hạn
      { isRevoked: true },                 // Đã revoke
    ],
  });
  
  return result.deletedCount;
};

/**
 * Lấy tất cả active tokens của user
 * Dùng để hiển thị danh sách devices đang login
 * @param {ObjectId} userId - ID của user
 * @returns {Promise<Array>} Danh sách tokens
 */
refreshTokenSchema.statics.getUserActiveTokens = async function(userId) {
  return await this.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
  .select('deviceInfo createdAt expiresAt')
  .sort({ createdAt: -1 });
};

// ============================================================
// INSTANCE METHODS - Phương thức của document
// ============================================================

/**
 * Kiểm tra token có còn hợp lệ không
 * @returns {boolean}
 */
refreshTokenSchema.methods.isValid = function() {
  return !this.isRevoked && this.expiresAt > new Date();
};

/**
 * Kiểm tra token sắp hết hạn (còn < 7 ngày)
 * @returns {boolean}
 */
refreshTokenSchema.methods.isExpiringSoon = function() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return this.expiresAt < sevenDaysFromNow;
};

/**
 * Format token info để trả về client
 * @returns {Object}
 */
refreshTokenSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Xóa sensitive fields
  delete obj.token;  // Không bao giờ trả token hash về client
  
  return obj;
};

// ============================================================
// MIDDLEWARE
// ============================================================

/**
 * Pre-save hook: Đảm bảo expiresAt luôn được set
 */
refreshTokenSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Nếu chưa set expiresAt, set mặc định 30 ngày
    this.expiresAt = new Date();
    this.expiresAt.setDate(this.expiresAt.getDate() + 30);
  }
  next();
});

// ============================================================
// EXPORTS
// ============================================================
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
