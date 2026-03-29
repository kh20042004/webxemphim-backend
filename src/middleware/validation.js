// ==================== VALIDATION HELPER ====================
//
// Middleware & function để validate request data
// Sử dụng: validateRequest(schema)(req, res, next)
//

const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Middleware factory để validate request body
 * @param {object} schema - Joi schema để validate
 * @returns {function} - Middleware function
 * 
 * Ví dụ sử dụng:
 * const schema = Joi.object({
 *   email: Joi.string().email().required(),
 *   password: Joi.string().min(6).required(),
 * });
 * 
 * router.post('/register', validateRequest(schema), controller);
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,        // Lấy tất cả lỗi, không dừng lại ở lỗi đầu
      stripUnknown: true,       // Xóa field không trong schema
    });

    if (error) {
      // Format error messages
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.INVALID_INPUT,
        errors: messages,
      });
    }

    // Validate thành công, thay thế req.body bằng dữ liệu đã validate
    req.body = value;
    next();
  };
};

/**
 * Hàm validate query params
 * @param {object} schema - Joi schema
 * @returns {function} - Middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.INVALID_INPUT,
        error: error.message,
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  validateRequest,
  validateQuery,
};
