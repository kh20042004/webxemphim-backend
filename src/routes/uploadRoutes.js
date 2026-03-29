// ==================== UPLOAD ROUTES ====================
// Người làm: Tuấn Anh
// Chức năng: API Upload File (Chỉ Admin mới được dùng)
// =======================================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import đúng tên middleware của Leader Khanh
const { protect, requireAdmin } = require('../middleware/auth');
const { uploadImage, uploadVideo } = require('../utils/uploadHandler');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { AppError } = require('../utils/errorHandling');

const router = express.Router();

// 1. CẤU HÌNH MULTER (Nơi nhận file tạm)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'temp-uploads/'); // Lưu vào folder vừa tạo
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new AppError('Chỉ chấp nhận file ảnh (jpg, png, webp) hoặc video (mp4, mov)', 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 500 * 1024 * 1024 }, // Tối đa 500MB
});

// 2. API UPLOAD ẢNH POSTER (POST /api/upload/poster)
// Chỉ admin mới được upload ảnh poster lên Cloudinary
router.post(
    '/poster',
    protect,        // Bước 1: Kiểm tra đăng nhập (JWT token hợp lệ)
    requireAdmin,   // Bước 2: Kiểm tra role phải là 'admin'
    upload.single('File'),
    async (req, res, next) => {
        try {
            if (!req.file) return sendError(res, 400, 'Bạn chưa chọn file ảnh');

            // Đẩy lên Cloudinary
            const result = await uploadImage(req.file.path, {
                folder: 'webxemphim/posters',
                filename: `poster-${Date.now()}`,
            });

            // Xóa file tạm trong máy sau khi đã upload lên Cloudinary thành công
            fs.unlinkSync(req.file.path);

            return sendSuccess(res, { url: result.url, publicId: result.publicId }, 'Upload poster thành công');
        } catch (error) {
            // Nếu lỗi, vẫn xóa file tạm để không ứ đọng
            if (req.file) fs.unlinkSync(req.file.path);
            next(error);
        }
    }
);

// 3. API UPLOAD VIDEO TẬP PHIM (POST /api/upload/video)
// Chỉ admin mới được upload video lên Cloudinary
router.post(
    '/video',
    protect,        // Bước 1: Kiểm tra đăng nhập (JWT token hợp lệ)
    requireAdmin,   // Bước 2: Kiểm tra role phải là 'admin'
    upload.single('File'),
    async (req, res, next) => {
        try {
            if (!req.file) return sendError(res, 400, 'Bạn chưa chọn file video');

            const result = await uploadVideo(req.file.path, {
                folder: 'webxemphim/episodes',
                filename: `episode-${Date.now()}`,
            });

            // Xóa file tạm trong máy sau khi đã upload lên Cloudinary thành công
            fs.unlinkSync(req.file.path);

            return sendSuccess(res, { url: result.url, publicId: result.publicId, duration: result.duration }, 'Upload video thành công');
        } catch (error) {
            // Nếu lỗi, vẫn xóa file tạm để không ứ đọng
            if (req.file) fs.unlinkSync(req.file.path);
            next(error);
        }
    }
);

module.exports = router;