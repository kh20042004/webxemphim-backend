// ==================== AUTH ROUTES ====================
//
// Mô tả: Định nghĩa các API routes liên quan tới xác thực
// Sử dụng: app.use('/api/auth', require('./routes/authRoutes'));
//

const express = require('express');
const passport = require('passport');
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

/**
 * POST /api/auth/forgot-password
 * Mô tả: Gửi mã reset password tới email
 * Body: { email }
 * Response: { success, message }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Mô tả: Đặt lại mật khẩu bằng mã reset password
 * Body: { email, code, newPassword, confirmPassword }
 * Response: { success, message }
 */
router.post('/reset-password', authController.resetPassword);

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

// ==================== GOOGLE OAUTH ROUTES ====================

/**
 * GET /api/auth/google
 * Mô tả: Redirect tới Google để xác thực
 * Middleware: passport.authenticate('google')
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * GET /api/auth/google/callback
 * Mô tả: Google callback sau khi user xác thực
 * Lưu ý: Frontend sẽ bị redirect tới URL này
 * Response: Redirect hoặc trả về JWT token
 */

// Middleware to log callback info
const logCallbackInfo = (req, res, next) => {
  console.log('\n🔐 CALLBACK MIDDLEWARE - Before Passport');
  console.log('req.user before passport:', req.user);
  console.log('req.session:', req.session ? 'exists' : 'undefined');
  next();
};

const afterPassport = (req, res, next) => {
  console.log('🔐 CALLBACK MIDDLEWARE - After Passport');
  console.log('req.user after passport:', req.user);
  console.log('req.session:', req.session);
  next();
};

router.get(
  '/google/callback',
  logCallbackInfo,
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000?error=google_auth_failed'
  }),
  afterPassport,
  authController.googleCallback
);

// ==================== EXPORT ROUTER ====================
module.exports = router;
