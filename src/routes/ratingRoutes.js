const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
// Sử dụng middleware 'protect' để kiểm tra JWT token (tên đúng được export từ middleware/auth.js)
const { protect } = require('../middleware/auth');

// Đánh giá phim (cần đăng nhập)
router.post('/', protect, ratingController.rateMovie);

// Lấy thống kê sao của phim (Public - không cần đăng nhập)
router.get('/stats', ratingController.getMovieRatingStatus);

module.exports = router;
