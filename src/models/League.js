// ==================== LEAGUE MODEL ====================
//
// Mô tả: Schema MongoDB cho League (Giải Đấu)
// Ví dụ: Premier League, La Liga, Serie A...
//

const mongoose = require('mongoose');

// ==================== ĐỊNH NGHĨA SCHEMA ====================
const leagueSchema = new mongoose.Schema(
  {
    // ============ Thông tin cơ bản ============
    name: {
      type: String,
      required: [true, 'Tên giải đấu là bắt buộc'],
      trim: true,
      unique: true,
    },

    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      // Ví dụ: "PL" (Premier League), "LA" (La Liga)
    },

    description: {
      type: String,
      default: null,
    },

    // ============ Hình ảnh & CDN ============
    logo: {
      type: String, // URL từ Cloudinary
      default: null,
    },

    // ============ Địa chỉ & Thông tin ============
    country: {
      type: String,
      required: true,
      // Ví dụ: "England", "Spain", "Italy"
    },

    season: {
      type: Number,
      required: true,
      // Ví dụ: 2025 (mùa giải 2025-2026)
    },

    // ============ Thời gian ============
    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    // ============ Thông tin thống kê ============
    matchesPerSeason: {
      type: Number,
      default: 380,
    },

    teamsCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ['active', 'upcoming', 'finished'],
      default: 'upcoming',
    },

    // ============ References ============
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],

    matches: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
leagueSchema.index({ slug: 1 });
leagueSchema.index({ code: 1 });
leagueSchema.index({ status: 1 });
leagueSchema.index({ season: 1 });

// ==================== TẠO VÀ EXPORT MODEL ====================
const League = mongoose.model('League', leagueSchema);

module.exports = League;
