// ==================== AUTHENTICATION MIDDLEWARE ====================
//
// Middleware để kiểm tra JWT token
// Sử dụng: app.use(authMiddleware) hoặc router.get('/protected', authMiddleware, controller)
//

const jwt = require('jsonwebtoken');
const config = require('../config/environment');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Middleware kiểm tra JWT token
 * 
 * Lấy token từ header: Authorization: Bearer <token>
 * Verify token và lưu user info vào req.user
 * 
 * Sử dụng trong route:
 * router.get('/profile', authMiddleware, userController.getProfile);
 */
const authMiddleware = (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED,
        code: 'NO_TOKEN',
      });
    }

    // Tách token: "Bearer <token>" -> "<token>"
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Lưu user info vào req
    req.user = decoded;
    next();
  } catch (error) {
    // Token không hợp lệ hoặc hết hạn
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: error.message === 'jwt expired' ? 'Token đã hết hạn' : 'Token không hợp lệ',
      code: 'INVALID_TOKEN',
    });
  }
};

/**
 * Middleware kiểm tra role admin
 * Sử dụng TRONG CÙNG 1 route với authMiddleware
 * 
 * Ví dụ:
 * router.post('/movies', authMiddleware, adminMiddleware, movieController.create);
 */
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: MESSAGES.FORBIDDEN,
      code: 'NOT_ADMIN',
    });
  }

  next();
};

/**
 * Middleware kiểm tra VIP status
 * Sử dụng TRONG CÙNG 1 route với authMiddleware
 * 
 * Ví dụ:
 * router.get('/premium-movies', authMiddleware, vipMiddleware, movieController.getPremium);
 */
const vipMiddleware = (req, res, next) => {
  // Kiểm tra nếu có expiryDate và expiryDate > now
  const hasVIP = req.user?.subscription?.expiryDate && new Date(req.user.subscription.expiryDate) > new Date();

  if (!hasVIP) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: MESSAGES.NO_VIP,
      code: 'NO_VIP',
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  vipMiddleware,
};
