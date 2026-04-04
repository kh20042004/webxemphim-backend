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
const favoritesRoutes = require('./routes/favoritesRoutes'); // Phim yêu thích
const sportsRoutes = require('./routes/sportsRoutes'); // Thể thao

// ==================== MOUNT ROUTES ====================
// Xác thực & Tài khoản người dùng
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Bình luận, Đánh giá & Lịch sử xem phim
app.use('/api/comments', commentRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/history', historyRoutes);

// Phim yêu thích - thêm/xóa/xem danh sách phim yêu thích
app.use('/api/favorites', favoritesRoutes);

// Thể thao - API cho trang sports
app.use('/api/sports', sportsRoutes);

// Movie routes (Tuấn Anh + Nghĩa + Thu Hà)
// /api/movies          → Danh sách phim (filter, pagination)
// /api/movies/trending → Phim xem nhiều nhất (NGHĨA - trang chủ)
// /api/movies/new      → Phim mới nhất (NGHĨA - trang chủ)
// /api/movies/:id      → Chi tiết phim (TUẤN ANH)
app.use('/api/movies', require('./routes/movieRoutes'));

// Upload ảnh/video lên Cloudinary (TUẤN ANH)
// POST /api/upload → trả về URL sau khi upload thành công
app.use('/api/upload', require('./routes/uploadRoutes'));

// Admin quản lý phim (TUẤN ANH - chỉ role admin)
// POST/PUT/DELETE /api/admin/movies → thêm/sửa/xóa phim
app.use('/api/admin/movies', require('./routes/admin/movieAdminRoutes'));

// ------------------------------------------------------------------
// GET /api/categories
// Lấy danh sách tất cả thể loại phim đang có trong DB (NGHĨA)
// Logic: Movie.distinct('category') → unique categories, sắp xếp A-Z
// Dùng cho: Menu điều hướng trang chủ, dropdown filter
// ------------------------------------------------------------------
app.get('/api/categories', require('./controllers/movieController').getCategories);

// ------------------------------------------------------------------
// GET /api/search?q=keyword
// Tìm kiếm phim theo từ khóa (THU HÀ)
// Logic: Dùng MongoDB $regex để tìm theo tên phim, có phân trang
// VD: /api/search?q=avengers&page=1&limit=12
// Dùng cho: Thanh tìm kiếm header, trang search.html
// ------------------------------------------------------------------
app.get('/api/search', require('./controllers/movieController').searchMovies);


// ==================== SHORTCUT ROUTES FOR PAGES ====================
// Cho phép truy cập trực tiếp /movies.html thay vì /pages/movies.html
const pagesPath = path.join(frontendPath, 'src/pages');

app.get('/movies.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'movies.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'register.html'));
});

app.get('/detail.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'detail.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'profile.html'));
});

app.get('/history.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'history.html'));
});

app.get('/favorites.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'favorites.html'));
});

app.get('/settings.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'settings.html'));
});

app.get('/subscription.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'subscription.html'));
});

app.get('/search.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'search.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(pagesPath, 'admin.html'));
});

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
