// ==================== ENTRY POINT CHÍNH CỦA BACKEND ====================
//
// File này là điểm khởi động của server
// Chạy: npm run dev (development) hoặc npm start (production)
//

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import config & database
const config = require('./config/environment');
const connectDB = require('./config/database');
const { HTTP_STATUS } = require('./config/constants');

// ==================== KHỞI TẠO EXPRESS APP ====================
const app = express();

// ==================== MIDDLEWARE CHUNG ====================

// Bảo mật header
app.use(helmet());

// CORS (cho phép request từ frontend)
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Parse JSON body
app.use(express.json());

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// ==================== LOG REQUEST ====================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== HEALTH CHECK ENDPOINT (KỂM TRA SERVER CÓ CHẠY KHÔNG) ====================
app.get('/api/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: '✅ Server đang chạy',
    timestamp: new Date(),
  });
});

// ==================== IMPORT ROUTES ====================
// Import các route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// ==================== MOUNT ROUTES ====================
// Xác thực & User
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Các routes khác (mỗi người thêm vào đây)
// app.use('/api/movies', require('./routes/movieRoutes'));
// app.use('/api/comments', require('./routes/commentRoutes'));
// ...

// ==================== 404 NOT FOUND ====================
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Endpoint không tồn tại',
    path: req.path,
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  res.status(err.status || HTTP_STATUS.SERVER_ERROR).json({
    success: false,
    message: err.message || 'Lỗi server',
    error: config.NODE_ENV === 'development' ? err : {},
  });
});

// ==================== KẾT NỐI DATABASE VÀ START SERVER ====================
const startServer = async () => {
  try {
    // Kết nối MongoDB
    await connectDB();

    // Start server
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`\n🚀 Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`📝 Environment: ${config.NODE_ENV}`);
      console.log(`🌐 Frontend URL: ${config.FRONTEND_URL}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Khởi động server
startServer();

module.exports = app;
