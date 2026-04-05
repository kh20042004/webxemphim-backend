const History = require('../models/History');
const Movie = require('../models/Movie'); // Cần import để populate() hoạt động
const { HTTP_STATUS } = require('../config/constants');


/**
 * Lấy lịch sử xem của user hiện tại
 * GET /api/history
 */
const getHistory = async (req, res) => {
  try {
    // req.user là object User đầy đủ được gán bởi middleware 'protect'
    // phải dùng _id thay vì userId
    const userId = req.user._id;

    const history = await History.find({ userId })
      .populate('movieId', 'title poster description') // Xóa slug vì Movie model không có field này
      .sort({ updatedAt: -1 }); // Mới xem xong đưa lên đầu

    res.status(HTTP_STATUS.OK).json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Cập nhật tiến trình xem (Lúc xem phim bấm lưu hoặc tự động lưu)
 * POST /api/history
 */
const updateHistory = async (req, res) => {
  try {
    const { movieId, timestamp } = req.body;
    // req.user là object User đầy đủ được gán bởi middleware 'protect'
    const userId = req.user._id;

    if (!movieId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Thiếu movieId' });
    }

    // Upsert để chỉ có 1 bản ghi phim đó cho 1 user
    const history = await History.findOneAndUpdate(
      { userId, movieId },
      { timestamp, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lưu tiến độ thành công', data: history });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Xóa 1 lịch sử phim cụ thể
 */
const deleteHistory = async (req, res) => {
  try {
    const { movieId } = req.params;
    // req.user là object User đầy đủ được gán bởi middleware 'protect'
    const userId = req.user._id;

    await History.findOneAndDelete({ userId, movieId });

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa lịch sử thành công' });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Xóa toàn bộ lịch sử xem của user
 * DELETE /api/history/clear
 */
const clearHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await History.deleteMany({ userId });

    res.status(HTTP_STATUS.OK).json({ 
      success: true, 
      message: `Đã xóa ${result.deletedCount} lịch sử xem thành công` 
    });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

module.exports = {
  getHistory,
  updateHistory,
  deleteHistory,
  clearHistory,
};
