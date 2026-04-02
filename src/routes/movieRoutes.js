const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

// Lấy chi tiết phim bằng ID
router.get('/:id', movieController.getMovieById);

module.exports = router;