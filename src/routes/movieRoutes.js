const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Đảm bảo movieController.getMovies đã được định nghĩa ở Bước 2
router.get('/', movieController.getMovies);

module.exports = router;