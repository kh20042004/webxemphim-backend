// ==================== ADMIN MOVIE CONTROLLER ====================
// Người làm: Tuấn Anh
// Chức năng: Admin quản lý phim (Xem danh sách, Thêm, Sửa, Xóa)
// ================================================================

const Movie = require('../../models/Movie');
const { sendSuccess, sendCreated } = require('../../utils/responseHandler');
const { NotFoundError } = require('../../utils/errorHandling');

/**
 * @desc    [READ] Lấy danh sách TẤT CẢ phim cho Admin (Mới nhất lên đầu)
 * @route   GET /api/admin/movies
 */
exports.getAllMovies = async (req, res, next) => {
    try {
        // Sắp xếp theo ngày tạo giảm dần (-1)
        const movies = await Movie.find().sort({ createdAt: -1 });
        return sendSuccess(res, movies, 'Lấy danh sách phim thành công');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    [CREATE] Thêm phim mới vào hệ thống
 * @route   POST /api/admin/movies
 */
exports.createMovie = async (req, res, next) => {
    try {
        const newMovie = await Movie.create(req.body);
        return sendCreated(res, newMovie, 'Thêm phim mới thành công!');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    [UPDATE] Cập nhật thông tin phim HOẶC Thêm tập phim mới
 * @route   PUT /api/admin/movies/:id
 */
exports.updateMovie = async (req, res, next) => {
    try {
        const movieId = req.params.id;

        // { new: true } để MongoDB trả về dữ liệu MỚI SAU KHI SỬA
        const updatedMovie = await Movie.findByIdAndUpdate(
            movieId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedMovie) {
            return next(new NotFoundError('Không tìm thấy phim để cập nhật'));
        }

        return sendSuccess(res, updatedMovie, 'Cập nhật phim thành công!');
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    [DELETE] Xóa hoàn toàn một bộ phim
 * @route   DELETE /api/admin/movies/:id
 */
exports.deleteMovie = async (req, res, next) => {
    try {
        const movieId = req.params.id;
        const deletedMovie = await Movie.findByIdAndDelete(movieId);

        if (!deletedMovie) {
            return next(new NotFoundError('Không tìm thấy phim để xóa'));
        }

        return sendSuccess(res, null, 'Đã xóa phim khỏi hệ thống!');
    } catch (error) {
        next(error);
    }
};