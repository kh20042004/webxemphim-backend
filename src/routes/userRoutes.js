// ==================== USER ROUTES ====================
//
// Mô tả: Định nghĩa các API routes liên quan tới user profile, password, VIP
// Sử dụng: app.use('/api/user', require('./routes/userRoutes'));
//

const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// ==================== TẠO ROUTER ====================
const router = express.Router();

// ==================== TẤT CẢ ROUTES CẦN ĐĂNG NHẬP ====================

/**
 * GET /api/user/profile
 * Mô tả: Lấy thông tin profile user hiện tại
 * Headers: Authorization: Bearer <token>
 * Response: { success, user }
 */
router.get('/profile', protect, userController.getProfile);

/**
 * PUT /api/user/profile
 * Mô tả: Cập nhật profile user (fullName, avatar)
 * Headers: Authorization: Bearer <token>
 * Body: { fullName, avatar }
 * Response: { success, user }
 */
router.put('/profile', protect, userController.updateProfile);

/**
 * PUT /api/user/password
 * Mô tả: Cập nhật mật khẩu user
 * Headers: Authorization: Bearer <token>
 * Body: { oldPassword, newPassword, passwordConfirm }
 * Response: { success, message }
 */
router.put('/password', protect, userController.updatePassword);

/**
 * POST /api/user/subscribe
 * Mô tả: Đăng ký/Gia hạn gói VIP
 * Headers: Authorization: Bearer <token>
 * Body: { plan } - "premium" hoặc "vip"
 * Response: { success, message, data: { plan, expiryDate } }
 */
router.post('/subscribe', protect, userController.subscribeVIP);

// ==================== EXPORT ROUTER ====================
module.exports = router;
