// ==================== MOVIE MODEL ====================
// Người tạo: Tuấn Anh
// Mô tả: Schema MongoDB cho Phim và các Tập phim
// =====================================================

const mongoose = require('mongoose');

// Schema cho từng tập phim (dùng cho cả phim lẻ 1 tập và phim bộ)
const episodeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên tập phim là bắt buộc (VD: Tập 1, Full)']
    },
    videoUrl: {
        type: String,
        required: [true, 'Link video là bắt buộc']
    },
    duration: {
        type: Number,
        default: 0
    } // Thời lượng (giây)
});

// Schema cho bộ phim
const movieSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Tên phim là bắt buộc'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Mô tả phim là bắt buộc']
        },
        poster: {
            type: String,
            default: null // URL ảnh bìa từ Cloudinary
        },
        posterPublicId: {
            type: String, // Lưu lại ID trên Cloudinary để sau này Admin xóa cho dễ
            default: null
        },
        category: {
            type: String,
            required: [true, 'Thể loại phim là bắt buộc']
        },
        year: {
            type: Number
        },
        type: {
            type: String,
            enum: ['Phim lẻ', 'Phim bộ', 'TV Show', 'Hoạt hình'],
            default: 'Phim lẻ'
        },
        episodes: [episodeSchema],
        views: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true, // Tự động thêm createdAt và updatedAt giống bảng User
    }
);

module.exports = mongoose.model('Movie', movieSchema);