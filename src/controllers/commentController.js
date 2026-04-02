const Comment = require('../models/Comment');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');

/**
 * Lấy danh sách bình luận của phim
 * GET /api/comments?movieId=xyz
 */
const getCommentsByMovie = async (req, res) => {
  try {
    const { movieId } = req.query;
    if (!movieId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message: 'Vui lòng cung cấp movieId' });
    }

    const comments = await Comment.find({ movieId })
      .populate('userId', 'username avatar') // Hiển thị tên & ảnh user
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    res.status(HTTP_STATUS.OK).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    res.status(HTTP_STATUS.SERVER_ERROR).json({ success: false, message: error.message });
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
