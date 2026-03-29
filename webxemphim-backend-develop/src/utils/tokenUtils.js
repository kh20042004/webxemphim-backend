// ==================== JWT TOKEN UTILITIES ====================
//
// Helper functions để tạo và xử lý JWT tokens
// Sử dụng: const { createToken, verifyToken } = require('../utils/tokenUtils');
//

const jwt = require('jsonwebtoken');
const config = require('../config/environment');

/**
 * Tạo JWT token
 * 
 * @param {object} payload - Dữ liệu để encode vào token (VD: { userId: '123', email: 'user@email.com' })
 * @param {string} expiresIn - Thời gian hết hạn (VD: '7d', '24h', '60m')
 * @returns {string} - JWT token
 * 
 * Ví dụ:
 * const token = createToken({ userId: user._id, email: user.email });
 */
const createToken = (payload, expiresIn = config.JWT_EXPIRE) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
};

/**
 * Verify & Decode JWT token
 * 
 * @param {string} token - JWT token cần verify
 * @returns {object} - Decoded payload nếu thành công, throw error nếu không
 * 
 * Ví dụ:
 * try {
 *   const decoded = verifyToken(token);
 *   console.log(decoded.userId);
 * } catch (error) {
 *   console.log('Token không hợp lệ');
 * }
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.JWT_SECRET);
};

/**
 * Tạo cặp token (Access Token + Refresh Token)
 * 
 * Ở tương lai có thể implement refresh token
 * Hiện tại chỉ tạo 1 access token
 * 
 * @param {object} payload - User data
 * @returns {object} - { accessToken, refreshToken }
 */
const createTokenPair = (payload) => {
  const accessToken = createToken(payload, '7d');        // Hết hạn sau 7 ngày
  // const refreshToken = createToken(payload, '30d');   // Tương lai implement
  
  return {
    accessToken,
    // refreshToken,
  };
};

/**
 * Decode token mà không cần verify (để lấy thông tin từ expired token)
 * Dùng cho refresh token logic
 * 
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  createToken,
  verifyToken,
  createTokenPair,
  decodeToken,
};
