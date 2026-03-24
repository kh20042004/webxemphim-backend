const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { authMiddleware } = require('../middleware/auth');

// Lấy danh sách bình luận (Public hoặc Auth tùy nhu cầu - ở đây để Public cho tiện xem phim)
router.get('/', commentController.getCommentsByMovie);

// Các thao tác thay đổi phải đăng nhập
router.post('/', authMiddleware, commentController.addComment);
router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;
