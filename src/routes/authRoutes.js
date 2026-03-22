// ==================== AUTH ROUTES ====================
//
// Mô tả: Định nghĩa các API routes liên quan tới xác thực
// Sử dụng: app.use('/api/auth', require('./routes/authRoutes'));
//

const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// ==================== TẠO ROUTER ====================
const router = express.Router();

// ==================== PUBLIC ROUTES (KHÔNG CẦN ĐĂNG NHẬP) ====================

/**
 * POST /api/auth/register
 * Mô tả: Đăng ký tài khoản mới
 * Body: { email, password, passwordConfirm, fullName }
 * Response: { success, token, user }
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Mô tả: Đăng nhập
 * Body: { email, password }
 * Response: { success, token, user }
 */
router.post('/login', authController.login);

// ==================== PROTECTED ROUTES (CẦN ĐĂNG NHẬP) ====================

/**
 * GET /api/auth/me
 * Mô tả: Lấy thông tin user hiện tại (từ token)
 * Headers: Authorization: Bearer <token>
 * Response: { success, user }
 * Middleware: protect (kiểm tra JWT token)
 */
router.get('/me', protect, authController.getMe);

/**
 * POST /api/auth/logout
 * Mô tả: Đăng xuất
 * Headers: Authorization: Bearer <token>
 * Response: { success, message }
 * Middleware: protect (kiểm tra JWT token)
 */
router.post('/logout', protect, authController.logout);

// ==================== EXPORT ROUTER ====================
module.exports = router;
