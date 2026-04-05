const Comment = require('../models/Comment');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { paginateQuery, getPaginationParams } = require('../utils/paginationHelper'); // ⭐ Import pagination helper

/**
 * Lấy danh sách bình luận của phim với pagination
 * GET /api/comments?movieId=xyz&page=1&limit=10
 * 
 * ⭐ CẢI THIỆN: Đã thêm pagination
 * - ?movieId=xyz&page=1&limit=10 → Trang 1, mỗi trang 10 comments
 * - ?movieId=xyz&page=2&limit=20 → Trang 2, mỗi trang 20 comments
 * - Mặc định: page=1, limit=10
 * - Sort: Mới nhất trước (-createdAt)
 */
const getCommentsByMovie = async (req, res) => {
  try {
    // ============ VALIDATE movieId ====================
    const { movieId } = req.query;
    if (!movieId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        success: false, 
        message: 'Vui lòng cung cấp movieId' 
      });
    }

    // ============ PAGINATION PARAMS ====================
    const { page, limit } = getPaginationParams(req.query);

    // ============ QUERY VỚI PAGINATION ====================
    const result = await paginateQuery(Comment, { movieId }, {
      page,
      limit,
      sort: { createdAt: -1 }, // Mới nhất lên đầu
      populate: {
        path: 'userId',
        select: 'username avatar fullName', // Hiển thị tên & ảnh user
      },
    });

    // ============ TRẢ VỀ RESPONSE ====================
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Lấy danh sách bình luận thành công`,
      ...result, // Spread data và pagination
    });

  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Thêm bình luận mới
 * POST /api/comments
 */
const addComment = async (req, res) => {
  try {
    const { movieId, content } = req.body;
    // req.user là object User đầy đủ được gán bởi middleware 'protect'
    // phải dùng _id thay vì userId
    const userId = req.user._id;

    if (!movieId || !content) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Thiếu movieId hoặc nội dung' });
    }

    const newComment = new Comment({
      movieId,
      userId,
      content,
    });

    await newComment.save();
    
    // Trả về kèm info user để frontend hiển thị ngay
    const populatedComment = await Comment.findById(newComment._id).populate('userId', 'username avatar');

    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Bình luận thành công', data: populatedComment });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

/**
 * Xóa bình luận
 * DELETE /api/comments/:id
 */
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    // req.user là object User đầy đủ được gán bởi middleware 'protect'
    const userId = req.user._id;
    const userRole = req.user.role;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Bình luận không tồn tại' });
    }

    // Chỉ chủ nhân hoặc Admin/Moderator mới được xóa
    if (comment.userId.toString() !== userId && userRole === USER_ROLES.USER) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ success: false, message: 'Bạn không có quyền xóa bình luận này' });
    }

    await Comment.findByIdAndDelete(id);

    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Xóa bình luận thành công' });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCommentsByMovie,
  addComment,
  deleteComment,
};
