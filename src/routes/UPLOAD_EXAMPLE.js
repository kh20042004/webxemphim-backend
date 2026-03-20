// ==================== VÍ DỤ: UPLOAD ROUTE ====================
//
// File này là VÍ DỤ cách sử dụng uploadHandler
// Bạn có thể tham khảo để tạo routes upload cho movie, episode, etc
//
// Thực tế sẽ nằm ở: routes/movieRoutes.js hoặc routes/uploadRoutes.js
//

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { uploadImage, uploadVideo, deleteFile } = require('../utils/uploadHandler');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { AppError } = require('../utils/errorHandling');

const router = express.Router();

// ============ CẤU HÌNH MULTER (Nhận file từ req.file) ============
// Lưu file tạm vào folder temp, rồi upload lên Cloudinary

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp-uploads/');  // Folder tạm
  },
  filename: (req, file, cb) => {
    // Tên file: timestamp-originFileName
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter: Chỉ cho upload ảnh & video
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type không hợp lệ (chỉ chấp nhận ảnh & video)', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
});

// ============ UPLOAD HÌNH ẢNH (Poster, Banner) ============

/**
 * Upload poster phim
 * @route POST /api/upload/poster
 * @access Private (Admin)
 * @body {file} file - File ảnh
 * 
 * Ví dụ (dùng Postman):
 * - Method: POST
 * - URL: http://localhost:5000/api/upload/poster
 * - Headers: Authorization: Bearer <token>
 * - Body > form-data:
 *   - file: <chọn file ảnh>
 *   - movieId: 123
 */
router.post(
  '/poster',
  authMiddleware,
  adminMiddleware,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'Bạn chưa chọn file');
      }

      console.log(`📤 Uploading poster: ${req.file.filename}`);

      // Upload lên Cloudinary
      const result = await uploadImage(req.file.path, {
        folder: 'webxemphim/posters',
        filename: `poster-${Date.now()}`,
      });

      // Xóa file tạm
      const fs = require('fs');
      fs.unlinkSync(req.file.path);

      sendSuccess(res, {
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
      }, 'Upload poster thành công');
    } catch (error) {
      // Xóa file tạm nếu lỗi
      if (req.file) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// ============ UPLOAD BANNER ============

router.post(
  '/banner',
  authMiddleware,
  adminMiddleware,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'Bạn chưa chọn file');
      }

      const result = await uploadImage(req.file.path, {
        folder: 'webxemphim/banners',
        filename: `banner-${Date.now()}`,
      });

      const fs = require('fs');
      fs.unlinkSync(req.file.path);

      sendSuccess(res, {
        url: result.url,
        publicId: result.publicId,
      }, 'Upload banner thành công');
    } catch (error) {
      if (req.file) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// ============ UPLOAD VIDEO (EPISODE) ============
// ⚠️ VIDEO UPLOAD CÓ THỂ MẤT THỜI GIAN!

/**
 * Upload video episode
 * @route POST /api/upload/video
 * @access Private (Admin)
 * @body {file} file - File video (.mp4)
 * 
 * ⚠️ Có thể mất 5-30 phút tùy kích thước file!
 */
router.post(
  '/video',
  authMiddleware,
  adminMiddleware,
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return sendError(res, 400, 'Bạn chưa chọn file video');
      }

      console.log(`📹 Uploading video: ${req.file.filename} (${req.file.size} bytes)`);
      console.log(`⏳ Process có thể mất thời gian...`);

      // Upload lên Cloudinary
      const result = await uploadVideo(req.file.path, {
        folder: 'webxemphim/episodes',
        filename: `episode-${Date.now()}`,
      });

      // Xóa file tạm
      const fs = require('fs');
      fs.unlinkSync(req.file.path);

      sendSuccess(res, {
        url: result.url,
        publicId: result.publicId,
        duration: result.duration,
        size: result.size,
      }, 'Upload video thành công');
    } catch (error) {
      if (req.file) {
        const fs = require('fs');
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

// ============ XÓA FILE ============

/**
 * Xóa file từ Cloudinary
 * @route DELETE /api/upload/:publicId
 * @access Private (Admin)
 * 
 * Ví dụ:
 * DELETE /api/upload/webxemphim%2Fposters%2Fposter-123
 * (publicId encoded as URL param)
 */
router.delete(
  '/:publicId',
  authMiddleware,
  adminMiddleware,
  async (req, res, next) => {
    try {
      const { publicId } = req.params;
      const decodedId = decodeURIComponent(publicId);

      const success = await deleteFile(decodedId);

      if (success) {
        sendSuccess(res, null, 'Xóa file thành công');
      } else {
        sendError(res, 400, 'Xóa file thất bại');
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

// ==================== HƯỚNG DẪN DÙNG POSTMAN ====================
//
// 1. Upload Poster:
//    - Method: POST
//    - URL: http://localhost:5000/api/upload/poster
//    - Headers: 
//      * Authorization: Bearer <JWT_token>
//    - Body > form-data:
//      * file: <chọn file ảnh từ máy>
//    - Response: { url, publicId, width, height }
//
// 2. Upload Video:
//    - Tương tự, nhưng upload.single('file') sẽ handle video
//    - URL: http://localhost:5000/api/upload/video
//    - File mp4 sẽ upload lên Cloudinary
//    - ⏳ Có thể mất thời gian!
//
// 3. Xóa File:
//    - Method: DELETE
//    - URL: http://localhost:5000/api/upload/webxemphim%2Fposters%2Fposter-123
//    - Headers: Authorization: Bearer <token>
//
