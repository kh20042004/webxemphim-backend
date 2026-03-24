const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authMiddleware } = require('../middleware/auth');

// Mọi route lịch sử đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get('/', historyController.getHistory);
router.post('/', historyController.updateHistory);
router.delete('/:movieId', historyController.deleteHistory);

module.exports = router;
