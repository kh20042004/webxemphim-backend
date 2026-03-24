const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, VIP_PLANS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên đăng nhập'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Vui lòng cung cấp email'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Vui lòng cung cấp email hợp lệ'],
  },
  password: {
    type: String,
    required: [true, 'Vui lòng cung cấp mật khẩu'],
    minlength: 6,
    select: false, // Không trả về password trong kết quả query mặc định
  },
  fullName: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: 'default-avatar.png',
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.USER,
  },
  // Thông tin VIP / Subscription
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Middleware mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Kiểm tra xem VIP còn hạn không
userSchema.methods.isVIPActive = function() {
  if (this.subscription.plan === VIP_PLANS.FREE) return false;
  if (!this.subscription.expiryDate) return false;
  return new Date() < this.subscription.expiryDate;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
