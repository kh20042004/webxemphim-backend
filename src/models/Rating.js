const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  star: {
    type: Number,
    required: [true, 'Số sao là bắt buộc (1-5)'],
    min: 1,
    max: 5,
  },
}, {
  timestamps: true,
});

// Mỗi user chỉ được đánh giá 1 phim 1 lần
ratingSchema.index({ movieId: 1, userId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
