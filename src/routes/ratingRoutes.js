const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authMiddleware } = require('../middleware/auth');

// Đánh giá phim (Cần đăng nhập)
router.post('/', authMiddleware, ratingController.rateMovie);

// Lấy thống kê sao (Public)
router.get('/stats', ratingController.getMovieRatingStatus);

module.exports = router;
