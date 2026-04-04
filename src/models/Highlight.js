// ==================== HIGHLIGHT MODEL ====================
//
// Mô tả: Schema MongoDB cho Highlight (Video Nổi Bật)
// Ví dụ: Match highlights, Goal compilations, Best moments...
//

const mongoose = require('mongoose');

// ==================== ĐỊNH NGHĨA SCHEMA ====================
const highlightSchema = new mongoose.Schema(
  {
    // ============ Thông tin cơ bản ============
    title: {
      type: String,
      required: [true, 'Tiêu đề highlight là bắt buộc'],
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

    // ============ Video & Hình ảnh ============
    videoUrl: {
      type: String, // URL từ Cloudinary
      required: true,
    },

    thumbnailImage: {
      type: String, // URL ảnh đại diện
      default: null,
    },

    duration: {
      type: Number, // Seconds
      required: true,
      // Ví dụ: 342 = 5:42
    },

    // ============ References ============
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      default: null,
    },

    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      required: true,
    },

    // ============ Chi tiết trận đấu ============
    homeTeamName: {
      type: String,
      default: null,
    },

    awayTeamName: {
      type: String,
      default: null,
    },

    // ============ Thống kê ============
    uploadedDate: {
      type: Date,
      default: Date.now,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    likes: {
      type: Number,
      default: 0,
    },

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // ============ Quyền truy cập ============
    isVip: {
      type: Boolean,
      default: false,
      // Cần VIP để xem?
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    // ============ Goals ============
    goals: [
      {
        player: String,        // "Bruno Fernandes"
        team: String,           // "Manchester United"
        minute: Number,         // 45
        description: String,    // "siêu phẩm sút xa"
      },
    ],

    // ============ Metadata ============
    tags: [String],
    // Ví dụ: ["ngoại hạng anh", "manchester united", "highlights", "bóng đá"]

    keywords: [String],
    // Để tối ưu SEO
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
highlightSchema.index({ slug: 1 });
highlightSchema.index({ leagueId: 1 });
highlightSchema.index({ matchId: 1 });
highlightSchema.index({ uploadedDate: -1 });
highlightSchema.index({ viewCount: -1 });
highlightSchema.index({ isPublished: 1 });

// ==================== PHƯƠNG THỨC CUSTOM ====================

/**
 * Format duration thành HH:MM:SS
 */
highlightSchema.methods.getFormattedDuration = function () {
  const seconds = this.duration;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

/**
 * Tăng lượt xem
 */
highlightSchema.methods.incrementViewCount = async function () {
  this.viewCount++;
  return await this.save();
};

/**
 * Thêm like
 */
highlightSchema.methods.addLike = async function (userId) {
  // Kiểm tra user đã like chưa
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
    this.likes++;
  }
  return await this.save();
};

/**
 * Bỏ like
 */
highlightSchema.methods.removeLike = async function (userId) {
  this.likedBy = this.likedBy.filter(id => id.toString() !== userId.toString());
  if (this.likes > 0) {
    this.likes--;
  }
  return await this.save();
};

/**
 * Kiểm tra user đã like chưa
 */
highlightSchema.methods.isLikedBy = function (userId) {
  return this.likedBy.some(id => id.toString() === userId.toString());
};

// ==================== TẠO VÀ EXPORT MODEL ====================
const Highlight = mongoose.model('Highlight', highlightSchema);

module.exports = Highlight;
