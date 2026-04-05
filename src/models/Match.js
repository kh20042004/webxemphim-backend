// ==================== MATCH MODEL ====================
//
// Mô tả: Schema MongoDB cho Match (Trận Đấu)
// Ví dụ: Man United vs Liverpool, Barcelona vs Real Madrid...
//

const mongoose = require('mongoose');

// ==================== ĐỊNH NGHĨA SCHEMA ====================
const matchSchema = new mongoose.Schema(
  {
    // ============ References ============
    leagueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'League',
      required: true,
    },

    homeTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },

    awayTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },

    // ============ Thông tin đội ============
    homeTeamName: {
      type: String,
      required: true,
    },

    awayTeamName: {
      type: String,
      required: true,
    },

    homeTeamLogo: {
      type: String,
      default: null,
    },

    awayTeamLogo: {
      type: String,
      default: null,
    },

    // ============ Lịch trình ============
    scheduleDate: {
      type: Date,
      required: true,
    },

    scheduleTime: {
      type: String,
      required: true,
      // Format: "20:00"
    },

    // ============ Tỉ số ============
    homeScore: {
      type: Number,
      default: null,
    },

    awayScore: {
      type: Number,
      default: null,
    },

    // ============ Trạng thái ============
    status: {
      type: String,
      enum: ['upcoming', 'live', 'finished'],
      default: 'upcoming',
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    // ============ Thông tin chi tiết ============
    round: {
      type: Number,
      default: null,
      // Vòng thứ mấy
    },

    stadium: {
      type: String,
      default: null,
      // Sân vận động
    },

    referee: {
      type: String,
      default: null,
      // Trọng tài
    },

    description: {
      type: String,
      default: null,
    },

    // ============ Highlight Video ============
    highlightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Highlight',
      default: null,
    },

    // ============ Statistics ============
    possession: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },

    shots: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },

    shotsOnTarget: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },

    passes: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },

    // ============ Engagement ============
    viewCount: {
      type: Number,
      default: 0,
    },

    liveViewers: {
      type: Number,
      default: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ==================== INDEXES ====================
matchSchema.index({ leagueId: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ scheduleDate: 1 });
matchSchema.index({ homeTeamId: 1, awayTeamId: 1 });

// ==================== PHƯƠNG THỨC CUSTOM ====================

/**
 * Cập nhật tỉ số
 */
matchSchema.methods.updateScore = async function (homeScore, awayScore) {
  this.homeScore = homeScore;
  this.awayScore = awayScore;
  this.status = 'finished';
  this.isLive = false;
  return await this.save();
};

/**
 * Bắt đầu trực tiếp
 */
matchSchema.methods.startLive = async function () {
  this.status = 'live';
  this.isLive = true;
  return await this.save();
};

/**
 * Kết thúc trực tiếp
 */
matchSchema.methods.endLive = async function () {
  this.isLive = false;
  return await this.save();
};

/**
 * Tăng lượt xem
 */
matchSchema.methods.incrementViewCount = async function () {
  this.viewCount++;
  return await this.save();
};

// ==================== TẠO VÀ EXPORT MODEL ====================
const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
