// ==================== TEAM MODEL ====================
//
// Mô tả: Schema MongoDB cho Team (Đội Bóng)
// Ví dụ: Manchester United, Liverpool, Barcelona...
//

const mongoose = require('mongoose');

// ==================== ĐỊNH NGHĨA SCHEMA ====================
const teamSchema = new mongoose.Schema(
  {
    // ============ Thông tin cơ bản ============
    name: {
      type: String,
      required: [true, 'Tên đội bóng là bắt buộc'],
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },

    // ============ Logo & Hình ảnh ============
    logo: {
      type: String, // URL từ Cloudinary
      default: null,
    },

    // ============ Thông tin địa chỉ ============
    country: {
      type: String,
      required: true,
      // Ví dụ: "England", "Spain", "Italy"
    },

    stadium: {
      type: String,
      default: null,
      // Ví dụ: "Old Trafford", "Anfield"
    },

    // ============ Lịch sử ============
    founded: {
      type: Number,
      default: null,
      // Ví dụ: 1878
    },

    // ============ Thông tin hiện tại ============
    coach: {
      type: String,
      default: null,
      // Tên huấn luyện viên
    },

    players: {
      type: Number,
      default: 0,
    },

    // ============ Mô tả ============
    description: {
      type: String,
      default: null,
    },

    // ============ Statistics ============
    wins: {
      type: Number,
      default: 0,
    },

    draws: {
      type: Number,
      default: 0,
    },

    losses: {
      type: Number,
      default: 0,
    },

    goalsFor: {
      type: Number,
      default: 0,
    },

    goalsAgainst: {
      type: Number,
      default: 0,
    },

    // ============ Active Status ============
    isActive: {
      type: Boolean,
      default: true,
    },

    // ============ League Reference ============
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
teamSchema.index({ slug: 1 });
teamSchema.index({ country: 1 });
teamSchema.index({ isActive: 1 });

// ==================== PHƯƠNG THỨC CUSTOM ====================

/**
 * Tính điểm của đội (Wins * 3 + Draws)
 */
teamSchema.methods.getPoints = function () {
  return this.wins * 3 + this.draws;
};

/**
 * Tính goalDifference
 */
teamSchema.methods.getGoalDifference = function () {
  return this.goalsFor - this.goalsAgainst;
};

/**
 * Tính tổng trận đấu
 */
teamSchema.methods.getTotalMatches = function () {
  return this.wins + this.draws + this.losses;
};

// ==================== TẠO VÀ EXPORT MODEL ====================
const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
