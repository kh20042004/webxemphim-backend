// ==================== CẤU HÌNH BIẾN MÔI TRƯỜNG ====================
// 
// File này load tất cả biến từ .env và export ra để dùng trong toàn app
// Sử dụng: const config = require('../config/environment');
// Note: dotenv được load trong server.js trước khi import file này
//

const config = {
  // ============ Cấu hình Server ============
  PORT: process.env.PORT || 5000,                          // Port chạy server
  NODE_ENV: process.env.NODE_ENV || 'development',         // Môi trường (development/production)

  // ============ Cấu hình Database MongoDB ============
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/webxemphim',

  // ============ Cấu hình JWT (Authentication) ============
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key', // Key để mã hóa JWT Token
  JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',              // Token hết hạn sau bao lâu

  // ============ Cấu hình Cloudinary (Upload file) ============
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,            // Tên Cloudinary account
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,      // API Key của Cloudinary
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,// API Secret của Cloudinary

  // ============ Cấu hình Frontend (CORS) ============
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000', // URL frontend để CORS

  // ============ Cấu hình Admin (Tài khoản admin mặc định) ============
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@webxemphim.com',     // Email admin default
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123456',        // Password admin default

  // ============ Cấu hình Email (Gửi email) ============
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'tk04052k4@gmail.com', // Email gửi đi
  SMTP_FROM_PASSWORD: process.env.SMTP_FROM_PASSWORD || '',           // App Password từ Google

  // ============ Cấu hình Google OAuth ============
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
};

module.exports = config;
