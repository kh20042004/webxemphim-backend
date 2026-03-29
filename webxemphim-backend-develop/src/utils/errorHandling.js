// ==================== CUSTOM ERROR CLASSES ====================
//
// File định nghĩa các custom error classes để dễ handling lỗi
// Sử dụng: const { AppError } = require('../utils/errorHandling');
//

/**
 * Custom App Error
 * Giúp tracking lỗi dễ dàng hơn với status code, message, code
 * 
 * Ví dụ sử dụng:
 * throw new AppError('Email đã tồn tại', 409, 'EMAIL_EXISTS');
 */
class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.timestamp = new Date();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

/**
 * Not Found Error
 */
class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Unauthorized Error
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Bạn chưa đăng nhập') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden Error
 */
class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Database Error
 */
class DatabaseError extends AppError {
  constructor(message = 'Lỗi database') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError,
};
