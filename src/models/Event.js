// ==================== EVENT MODEL ====================
//
// Mô tả: Schema MongoDB cho Event (Sự Kiện Trực Tiếp)
// Ví dụ: "Ngoại Hạng Anh Vòng 25", "Champions League Bán Kết"...
//

const mongoose = require('mongoose');

// ==================== ĐỊNH NGHĨA SCHEMA ====================
const eventSchema = new mongoose.Schema(
  {
    // ============ Thông tin cơ bản ============
    title: {
      type: String,
      required: [true, 'Tiêu đề sự kiện là bắt buộc'],
      trim: true,
    },

    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      default: null,
    },

    // ============ Hình ảnh ============
    postImage: {
      type: String, // URL từ Cloudinary
      default: null,
    },

    // ============ Thời gian sự kiện ============
    eventDate: {
      type: Date,
      required: true,
    },

    eventTime: {
      type: String,
      required: true,
      // Format: "20:00"
    },

    // ============ Reference ============
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },

    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      default: null,
    },

    // ============ Trạng thái ============
    type: {
      type: String,
      enum: ['live', 'upcoming', 'replay'],
      default: 'upcoming',
    },

    status: {
      type: String,
      enum: ['live', 'coming_soon', 'finished'],
      default: 'coming_soon',
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      // Hiển thị nổi bật trên trang chủ
    },

    // ============ Lượt xem ============
    viewers: {
      type: Number,
      default: 0,
      // Số người đang xem live
    },

    viewCount: {
      type: Number,
      default: 0,
      // Tổng lượt xem
    },

    // ============ Thời gian còn lại ============
    timeTillStart: {
      type: String,
      default: null,
      // "Trong 2 tiếng", "Trong 4 tiếng"
    },

    // ============ Metadata ============
    tags: [String],
    // Ví dụ: ["bóng đá", "ngoại hạng anh", "trực tiếp"]
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
eventSchema.index({ slug: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ matchId: 1 });
eventSchema.index({ leagueId: 1 });
eventSchema.index({ isFeatured: 1 });

// ==================== PHƯƠNG THỨC CUSTOM ====================

/**
 * Bắt đầu trực tiếp
 */
eventSchema.methods.startLive = async function () {
  this.status = 'live';
  this.isLive = true;
  return await this.save();
};

/**
 * Kết thúc trực tiếp
 */
eventSchema.methods.endLive = async function () {
  this.status = 'finished';
  this.isLive = false;
  this.type = 'replay';
  return await this.save();
};

/**
 * Tăng lượt xem live
 */
eventSchema.methods.addViewer = async function () {
  this.viewers++;
  return await this.save();
};

/**
 * Giảm lượt xem live
 */
eventSchema.methods.removeViewer = async function () {
  if (this.viewers > 0) {
    this.viewers--;
  }
  return await this.save();
};

/**
 * Tính thời gian còn lại
 */
eventSchema.methods.calculateTimeToStart = function () {
  const now = new Date();
  const diff = this.eventDate - now;
  
  if (diff <= 0) return 'Đang diễn ra';
  
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  
  if (hours > 0) {
    return `Trong ${hours} tiếng`;
  } else if (minutes > 0) {
    return `Trong ${minutes} phút`;
  } else {
    return 'Sắp bắt đầu';
  }
};

// ==================== TẠO VÀ EXPORT MODEL ====================
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
