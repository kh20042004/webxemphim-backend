// ==================== RESPONSE HELPER FUNCTIONS ====================
//
// Helper functions để format response chuẩn cho API
// Sử dụng: const { sendSuccess, sendError } = require('../utils/responseHandler');
//

const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Gửi response thành công
 * 
 * @param {object} res - Express response object
 * @param {object} data - Dữ liệu trả về
 * @param {string} message - Message (optional)
 * @param {number} status - HTTP status code (optional, default 200)
 * 
 * Ví dụ:
 * sendSuccess(res, { userName: 'Khanh' }, 'Lấy user thành công');
 */
const sendSuccess = (res, data, message = MESSAGES.SUCCESS, status = HTTP_STATUS.OK) => {
  return res.status(status).json({
    success: true,
    data,
    message,
  });
};

/**
 * Gửi response lỗi
 * 
 * @param {object} res - Express response object
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code (optional)
 * 
 * Ví dụ:
 * sendError(res, 400, 'Email không hợp lệ', 'INVALID_EMAIL');
 */
const sendError = (res, status = HTTP_STATUS.SERVER_ERROR, message = MESSAGES.ERROR, code = 'ERROR') => {
  return res.status(status).json({
    success: false,
    message,
    code,
  });
};

/**
 * Gửi response danh sách (có pagination)
 * 
 * @param {object} res - Express response object
 * @param {array} data - Dữ liệu danh sách
 * @param {object} pagination - { page, limit, total, totalPages, hasNext }
 * @param {string} message - Message (optional)
 * 
 * Ví dụ:
 * const movies = await Movie.find().limit(10).skip(0);
 * const total = await Movie.countDocuments();
 * sendPaginatedSuccess(res, movies, {
 *   page: 1,
 *   limit: 10,
 *   total: total,
 *   totalPages: Math.ceil(total / 10),
 *   hasNext: 1 < Math.ceil(total / 10)
 * });
 */
const sendPaginatedSuccess = (res, data, pagination, message = MESSAGES.SUCCESS) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data,
    pagination,
    message,
  });
};

/**
 * Gửi response tạo mới
 * 
 * @param {object} res - Express response object
 * @param {object} data - Dữ liệu đã tạo
 * @param {string} message - Message (optional)
 * 
 * Ví dụ:
 * const user = await User.create(userData);
 * sendCreated(res, user, 'Tạo user thành công');
 */
const sendCreated = (res, data, message = 'Tạo mới thành công') => {
  return res.status(HTTP_STATUS.CREATED).json({
    success: true,
    data,
    message,
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedSuccess,
  sendCreated,
};
