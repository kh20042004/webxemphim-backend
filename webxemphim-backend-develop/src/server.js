// ==================== ENTRY POINT CHÍNH CỦA BACKEND ====================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors'); // Khai báo 1 lần duy nhất ở đây
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');

// Import config & database
const config = require('./config/environment');
const connectDB = require('./config/database');
const { HTTP_STATUS } = require('./config/constants');
const movieRoutes = require('./routes/movieRoutes');

// ==================== KHỞI TẠO EXPRESS APP ====================
const app = express();

// ==================== MIDDLEWARE CHUNG ====================

// 1. Bảo mật header
app.use(helmet());

// 2. Cấu hình CORS (Chỉ dùng 1 lần với cấu hình chuẩn)
app.use(cors());

// 3. Parse JSON & URL-encoded body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Session middleware (cho Passport.js)
app.use(session({
    secret: config.JWT_SECRET || 'secret_key_mac_dinh',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: config.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));

// ==================== PASSPORT MIDDLEWARE ====================
app.use(passport.initialize());
app.use(passport.session());

// ==================== LOG REQUEST ====================
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ==================== ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: '✅ Server đang chạy tốt!',
        timestamp: new Date(),
    });
});

// Import các route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Mount các Route chính
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/movies', movieRoutes);

// ==================== 404 NOT FOUND ====================
app.use((req, res) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Endpoint không tồn tại',
        path: req.path,
    });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.status || HTTP_STATUS.SERVER_ERROR).json({
        success: false,
        message: err.message || 'Lỗi server',
        error: config.NODE_ENV === 'development' ? err : {},
    });
});

// ==================== KHỞI ĐỘNG SERVER ====================
const startServer = async() => {
    try {
        // 1. Kết nối MongoDB
        await connectDB();

        // 2. Start listening
        const PORT = config.PORT || 5000;
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

startServer();

module.exports = app;