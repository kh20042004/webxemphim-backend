const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/auth');

// Mọi route profile đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile); // Đổi mật khẩu / update avatar
router.post('/subscribe', userController.subscribeVIP);

module.exports = router;
