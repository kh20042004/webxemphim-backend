// ==================== CLOUDINARY UPLOAD HANDLER ====================
//
// Helper function để upload file tới Cloudinary
// Sử dụng: const { uploadImage, uploadVideo } = require('../utils/uploadHandler');
//

const cloudinary = require('cloudinary').v2;
const config = require('../config/environment');

// ============ CẤU HÌNH CLOUDINARY ============
cloudinary.config({
  cloud_name: config.CLOUDINARY_NAME,      // Cloud name từ .env
  api_key: config.CLOUDINARY_API_KEY,      // API Key từ .env
  api_secret: config.CLOUDINARY_API_SECRET, // API Secret từ .env
});

/**
 * Upload hình ảnh (poster, banner, avatar)
 * 
 * @param {string} filePath - Đường dẫn file hoặc URL
 * @param {object} options - Tùy chọn
 * @param {string} options.folder - Folder trên Cloudinary (default: 'webxemphim/images')
 * @param {string} options.filename - Tên file (default: auto)
 * @returns {Promise<object>} - { url, publicId, width, height }
 * 
 * Ví dụ:
 * const result = await uploadImage('./poster.jpg', { 
 *   folder: 'webxemphim/movies',
 *   filename: 'movie-123'
 * });
 * console.log(result.url); // URL của ảnh trên Cloudinary
 */
exports.uploadImage = async (filePath, options = {}) => {
  try {
    const {
      folder = 'webxemphim/images',
      filename = undefined,
    } = options;

    const uploadOptions = {
      folder,                          // Folder để tổ chức
      resource_type: 'image',          // Loại: image
      overwrite: true,                 // Ghi đè file cùng tên
      use_filename: !!filename,        // Dùng filename nếu có
      public_id: filename,             // Public ID của file
      transformation: [
        { quality: 'auto' },           // Auto optimize quality
        { fetch_format: 'auto' },      // Auto format (webp, jpg, etc)
      ],
    };

    console.log(`📤 Uploading image to Cloudinary: ${folder}/${filename || 'auto'}`);

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.secure_url,          // HTTPS URL
      publicId: result.public_id,      // ID để delete/update
      width: result.width,
      height: result.height,
      size: result.bytes,
    };
  } catch (error) {
    console.error('❌ Image upload failed:', error.message);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

/**
 * Upload video (phim)
 * 
 * @param {string} filePath - Đường dẫn file video hoặc URL
 * @param {object} options - Tùy chọn
 * @param {string} options.folder - Folder trên Cloudinary (default: 'webxemphim/videos')
 * @param {string} options.filename - Tên file
 * @param {function} options.onProgress - Callback khi upload (dùng cho progress bar)
 * @returns {Promise<object>} - { url, publicId, duration, size }
 * 
 * ⚠️ VIDEO UPLOAD CÓ THỂ MẤT THỜI GIAN (tùy kích thước)
 * 
 * Ví dụ:
 * const result = await uploadVideo('./movie.mp4', {
 *   folder: 'webxemphim/episodes',
 *   filename: 'episode-1',
 *   onProgress: (progress) => console.log(`${progress}% uploaded`)
 * });
 */
exports.uploadVideo = async (filePath, options = {}) => {
  try {
    const {
      folder = 'webxemphim/videos',
      filename = undefined,
      onProgress = undefined,
    } = options;

    const uploadOptions = {
      folder,                          // Folder để tổ chức
      resource_type: 'video',          // Loại: video
      overwrite: true,
      use_filename: !!filename,
      public_id: filename,
      eager: [
        { streaming_profile: 'hd' },   // Tạo HLS format cho streaming
      ],
      eager_async: true,               // Process async (không chờ)
      tags: ['webxemphim'],            // Tag để dễ quản lý
    };

    console.log(`📹 Uploading video to Cloudinary: ${folder}/${filename || 'auto'}`);
    console.log(`⏳ Video upload có thể mất thời gian tùy kích thước file...`);

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration,       // Độ dài video (giây)
      size: result.bytes,
      format: result.format,
      videoCodec: result.video_codec,
    };
  } catch (error) {
    console.error('❌ Video upload failed:', error.message);
    throw new Error(`Video upload failed: ${error.message}`);
  }
};

/**
 * Upload file tổng quát (hình, video, file)
 * 
 * @param {string} filePath - Đường dẫn file
 * @param {object} options - Tùy chọn
 * @returns {Promise<object>} - File info
 */
exports.uploadFile = async (filePath, options = {}) => {
  try {
    const {
      folder = 'webxemphim/uploads',
      filename = undefined,
    } = options;

    const uploadOptions = {
      folder,
      overwrite: true,
      use_filename: !!filename,
      public_id: filename,
    };

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      type: result.type,
      size: result.bytes,
    };
  } catch (error) {
    console.error('❌ File upload failed:', error.message);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

/**
 * Xóa file từ Cloudinary
 * 
 * @param {string} publicId - Public ID của file (nhận từ uploadImage/uploadVideo)
 * @returns {Promise<boolean>} - true nếu xóa thành công
 * 
 * Ví dụ:
 * await deleteFile('webxemphim/images/poster-123');
 */
exports.deleteFile = async (publicId) => {
  try {
    console.log(`🗑️ Deleting file: ${publicId}`);
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    return result.result === 'ok';
  } catch (error) {
    console.error('❌ File delete failed:', error.message);
    throw new Error(`File delete failed: ${error.message}`);
  }
};

/**
 * Lấy danh sách file trong folder
 * 
 * @param {string} folder - Folder path (VD: 'webxemphim/images')
 * @returns {Promise<array>} - Danh sách file
 */
exports.getFilesInFolder = async (folder) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 100,
    });

    return result.resources;
  } catch (error) {
    console.error('❌ Get files failed:', error.message);
    throw new Error(`Get files failed: ${error.message}`);
  }
};

/**
 * Tạo thumbnail từ video tại thời điểm nhất định
 * 
 * @param {string} publicId - Public ID của video
 * @param {number} seconds - Giây cần extract (default: 0)
 * @returns {string} - URL của thumbnail
 * 
 * Ví dụ:
 * const thumbnail = getVideoThumbnail('webxemphim/videos/ep1', 10);
 * // URL của ảnh tại giây thứ 10
 */
exports.getVideoThumbnail = (publicId, seconds = 0) => {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    fetch_format: 'jpg',
    quality: 'auto',
    transformation: [
      { offset: seconds }, // Offset thời gian (giây)
    ],
  });
};

// Lưu ý: Tất cả các hàm đã được export ở trên bằng cú pháp exports.xxx
// Không cần ghi lại module.exports ở đây

