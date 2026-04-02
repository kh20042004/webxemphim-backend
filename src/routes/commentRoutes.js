const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
// Sử dụng middleware 'protect' để kiểm tra JWT token (tên đúng được export từ middleware/auth.js)
const { protect } = require('../middleware/auth');

// Lấy danh sách bình luận (Public - không cần đăng nhập để xem)
router.get('/', commentController.getCommentsByMovie);

// Thêm và xóa bình luận yêu cầu đăng nhập
router.post('/', protect, commentController.addComment);
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router;
