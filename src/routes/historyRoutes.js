const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
// Sử dụng middleware 'protect' để kiểm tra JWT token (tên đúng được export từ middleware/auth.js)
const { protect } = require('../middleware/auth');

// Tất cả các route lịch sử đều yêu cầu đăng nhập
router.use(protect);

router.get('/', historyController.getHistory);
router.post('/', historyController.updateHistory);
router.delete('/:movieId', historyController.deleteHistory);

module.exports = router;
