// ==================== ENTRY POINT CHÍNH CỦA BACKEND ====================
//
// File này là điểm khởi động của server
// Chạy: npm run dev (development) hoặc npm start (production)
//

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');

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

// Session middleware (cho Passport.js)
app.use(session({
  secret: config.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: config.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Parse JSON body
app.use(express.json());

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true }));

// ==================== SERVE FRONTEND STATIC FILES ====================
const frontendPath = path.join(__dirname, '../../webxemphim-frontend/frontend');
app.use(express.static(frontendPath));

// ==================== PASSPORT MIDDLEWARE ====================
app.use(passport.initialize());
app.use(passport.session());

// Require & setup Passport strategies
require('./config/passport')(passport);

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
const commentRoutes = require('./routes/commentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const historyRoutes = require('./routes/historyRoutes');

// ==================== MOUNT ROUTES ====================
// Xác thực & Tài khoản người dùng
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Bình luận, Đánh giá & Lịch sử xem phim
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/history', historyRoutes);

// Lưu ý: Thêm route mới vào đây khi cần
// app.use('/api/movies', require('./routes/movieRoutes'));

// ==================== SPA FALLBACK - PHỤC VỤ TRANG CHÍNH (OPTIONAL) ====================
// Nếu bạn có index.html, uncomment dòng này:
// app.get('/', (req, res) => {
//   res.sendFile(path.join(frontendPath, 'index.html'));
// });

// ==================== 404 NOT FOUND ====================
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Endpoint không tồn tại',
    path: req.path,
  });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
// Lưu ý: Express nhận biết đây là error middleware khi có đúng 4 tham số (err, req, res, next)
// Tham số 'next' BẮT BUỘC phải có dù không dùng tới, nếu xóa Express sẽ không dùng middleware này xử lý lỗi
// eslint-disable-next-line no-unused-vars
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
