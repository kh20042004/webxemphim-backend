const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Thêm hoặc cập nhật đánh giá phim
 * POST /api/ratings
 */
const rateMovie = async (req, res) => {
  try {
    const { movieId, star } = req.body;
    const userId = req.user.userId;

    if (!movieId || !star) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Thiếu movieId hoặc số sao' });
    }

    if (star < 1 || star > 5) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Số sao chỉ từ 1 đến 5' });
    }

    const rating = await Rating.findOneAndUpdate(
      { movieId, userId },
      { star },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Cập nhật đánh giá thành công', data: rating });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Lấy đánh giá của phim (trung bình sao dời qua MovieController sau này)
 */
const getMovieRatingStatus = async (req, res) => {
  try {
    const { movieId } = req.query;
    if (!movieId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Vui lòng cung cấp movieId' });
    }

    // Tổng số lượt & Trung bình cộng
    const stats = await Rating.aggregate([
      { $match: { movieId: new mongoose.Types.ObjectId(movieId) } },
      {
        $group: {
          _id: '$movieId',
          average: { $avg: '$star' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(HTTP_STATUS.OK).json({ success: true, data: stats[0] || { average: 0, count: 0 } });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

module.exports = {
  rateMovie,
  getMovieRatingStatus,
};
