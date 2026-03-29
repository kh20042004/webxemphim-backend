// ==================== ERROR RESPONSE HANDLER ====================
//
// Middleware để format response lỗi chuẩn cho toàn hệ thống
// Sử dụng: res.error(message, status) từ bất kỳ controller nào
//

const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Middleware để thêm hàm error vào res object
 * Sử dụng: res.error('Message', 400)
 */
const errorHandler = (req, res, next) => {
  // Hàm gửi lỗi theo chuẩn thống nhất
  res.error = (message, status = HTTP_STATUS.SERVER_ERROR, code = 'ERROR') => {
    return res.status(status).json({
      success: false,
      message: message || MESSAGES.ERROR,
      code,
    });
  };

  // Hàm gửi success theo chuẩn thống nhất
  res.success = (data, message = MESSAGES.SUCCESS, status = HTTP_STATUS.OK) => {
    return res.status(status).json({
      success: true,
      data,
      message,
    });
  };

  // Hàm gửi danh sách (có pagination)
  res.successWithPagination = (data, pagination, message = MESSAGES.SUCCESS) => {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data,
      pagination,
      message,
    });
  };

  next();
};

module.exports = errorHandler;
