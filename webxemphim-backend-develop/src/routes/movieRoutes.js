const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// 1. Lấy danh sách + Tìm kiếm + Lọc (Tất cả dùng chung hàm getMovies)
router.get('/', movieController.getMovies);

// 2. Lấy chi tiết theo ID (Luôn để dưới cùng)
router.get('/:id', movieController.getMovieById);

module.exports = router;