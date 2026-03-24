const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  timestamp: {
    type: Number, // Lấy theo s (giây) hoặc phút (tuỳ client)
    default: 0,
  },
}, {
  timestamps: true,
});

// Mỗi user xem 1 phim thì chỉ 1 bản ghi được cập nhật timestamp
historySchema.index({ userId: 1, movieId: 1 }, { unique: true });

const History = mongoose.model('History', historySchema);

module.exports = History;
