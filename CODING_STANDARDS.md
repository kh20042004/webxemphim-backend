# 📝 CODING STANDARDS - Film+ Backend Team

File này định nghĩa cách naming, cấu trúc code, comment để toàn team thống nhất.

---

## 1️⃣ NAMING CONVENTIONS (Cách đặt tên)

### File & Folder Names

```javascript
// Controllers - PascalCase + Controller.js
userController.js          ✅ ĐÚNG
movie-controller.js        ❌ SAI
MovieController.js         ❌ SAI (folder không dùng PascalCase)

// Routes - lowercase + Routes.js
userRoutes.js              ✅ ĐÚNG
UserRoutes.js              ❌ SAI

// Models - PascalCase.js
User.js                    ✅ ĐÚNG
user.js                    ❌ SAI
UserModel.js               ❌ SAI (không cần Model suffix)

// Utils & Middleware - camelCase + Keyword
tokenUtils.js              ✅ ĐÚNG
token-utils.js             ❌ SAI
TokenUtils.js              ❌ SAI

// Constants - camelCase + constants.js
constants.js               ✅ ĐÚNG
CONSTANTS.js               ❌ SAI
```

### Variable & Function Names

```javascript
// Variables - camelCase
const userName = 'Khanh';                ✅ ĐÚNG
const user_name = 'Khanh';               ❌ SAI
const UserName = 'Khanh';                ❌ SAI

// Functions - camelCase
function getUserById(id) { }             ✅ ĐÚNG
function get_user_by_id(id) { }          ❌ SAI
function GetUserById(id) { }             ❌ SAI

// Constants (hằng số) - UPPER_SNAKE_CASE
const MAX_LIMIT = 100;                   ✅ ĐÚNG
const max_limit = 100;                   ❌ SAI
const maxLimit = 100;                    ❌ SAI (nhưng dùng hằng số thường)

// Classes & Models - PascalCase
class User { }                           ✅ ĐÚNG
class user { }                           ❌ SAI
const User = require('./User');          ✅ ĐÚNG
```

---

## 2️⃣ FILE STRUCTURE (Cấu trúc file)

### Controller Structure

```javascript
// ==================== USER CONTROLLER ====================
// Mô tả: Xử lý logic liên quan tới user

const { AppError } = require('../utils/errorHandling');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const User = require('../models/User');

/**
 * Lấy thông tin user hiện tại
 * @route GET /api/user/profile
 * @access Private
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return sendError(res, 404, 'User không tồn tại');
    }

    sendSuccess(res, user, 'Lấy profile thành công');
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật profile user
 * @route PUT /api/user/profile
 * @access Private
 */
exports.updateProfile = async (req, res, next) => {
  // Implement here
};
```

### Routes Structure

```javascript
// ==================== USER ROUTES ====================

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const userController = require('../controllers/userController');
const userValidation = require('../validation/userValidation'); // Tương lai

const router = express.Router();

// Protected routes - cần đăng nhập
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validateRequest(userValidation.updateSchema), userController.updateProfile);

module.exports = router;
```

---

## 3️⃣ CODE STYLE (Kiểu viết code)

### Comment Style

```javascript
// ==================== MAIN SECTION TITLE ====================
// Mô tả ngắn gọn về section này

// Sub-section comment
const name = 'value';

/**
 * JSDoc comment cho function
 * 
 * @param {type} paramName - Mô tả param
 * @param {object} options - Options object
 * @param {string} options.field - Một field trong options
 * @returns {type} - Mô tả return value
 * 
 * @example
 * functionName('hello', { field: 'value' });
 */
function functionName(param, options) {
  // Inline comment cho logic phức tạp
  return param + options.field;
}
```

### Error Handling

```javascript
// ❌ SAI
try {
  // code
} catch (error) {
  console.log(error);
  res.status(500).send('Error');
}

// ✅ ĐÚNG
try {
  const user = await User.findById(id);
  
  if (!user) {
    return sendError(res, 404, 'User không tồn tại', 'USER_NOT_FOUND');
  }

  sendSuccess(res, user);
} catch (error) {
  // Truyền error lên middleware handle
  next(error);
}
```

### Async/Await Usage

```javascript
// ❌ SAI - callback hell
User.findById(id, (err, user) => {
  if (err) return res.status(500).send(err);
  Movie.find({ userId: user._id }, (err, movies) => {
    // ...
  });
});

// ✅ ĐÚNG - async/await
async function getUserWithMovies(id) {
  try {
    const user = await User.findById(id);
    const movies = await Movie.find({ userId: user._id });
    return { user, movies };
  } catch (error) {
    throw error;
  }
}
```

---

## 4️⃣ DATABASE NAMING

### Model/Schema Names

```javascript
// User model - singular, PascalCase
const UserSchema = new Schema({
  email: String,              // camelCase field
  password: String,
  fullName: String,           // ✅ ĐÚNG
  full_name: String,          // ❌ SAI
  vipEnd: Date,
  createdAt: Date,
  updatedAt: Date,
});

module.exports = mongoose.model('User', UserSchema);
```

### Index Naming

```javascript
// Luôn index các field dùng trong query thường xuyên
UserSchema.index({ email: 1 });    // ✅ ĐÚNG
UserSchema.index({ email: 1, deletedAt: 1 });  // ✅ Compound index
```

---

## 5️⃣ API ENDPOINT NAMING

```javascript
// ✅ RESTful Convention

// Collections
GET    /api/movies                         // Lấy danh sách
POST   /api/movies                         // Tạo mới
GET    /api/movies/:id                     // Chi tiết
PUT    /api/movies/:id                     // Cập nhật
DELETE /api/movies/:id                     // Xóa

// Sub-resources
GET    /api/movies/:id/episodes            // Episodes của movie
GET    /api/episodes/:episodeId            // Chi tiết episode

// Query params cho filter & pagination
GET    /api/movies?category=action&page=1&limit=10

// Actions (khi không phải CRUD)
POST   /api/users/:id/send-email           // ✅ ĐÚNG
GET    /api/search?q=keyword                // ✅ ĐÚNG
```

---

## 6️⃣ GIT COMMIT MESSAGE

```bash
# Format: [Type] Message

# Types:
# feat: Thêm feature mới
# fix: Fix bug
# refactor: Refactor code (không thay đổi logic)
# docs: Sửa documentation
# style: Sửa formatting (không thay đổi logic)
# test: Thêm/sửa test

✅ ĐÚNG:
git commit -m "feat: add user authentication endpoints"
git commit -m "fix: resolve password validation bug"
git commit -m "refactor: reorganize movie controller"

❌ SAI:
git commit -m "update"
git commit -m "Fix bugs and add features"
git commit -m "asdf"
```

---

## 7️⃣ BRANCH NAMING

```bash
# Format: type/description

feature/authentication        ✅ ĐÚNG - thêm feature
bugfix/user-validation        ✅ ĐÚNG - fix bug
refactor/movie-controller     ✅ ĐÚNG - refactor
docs/api-documentation        ✅ ĐÚNG - docs

main                          # Production
develop                       # Development branch (merge feature vào đây)

❌ SAI naming:
my-branch
khanhs-feature
123
```

---

## 8️⃣ CODE REVIEW CHECKLIST

Trước khi commit & push:

- [ ] Code được test (chạy `npm run dev` và test endpoint)
- [ ] Không có `console.log()` vô nghĩa
- [ ] Tất cả error được handle (try-catch hoặc next(error))
- [ ] Response format chuẩn (success/error)
- [ ] Middleware được sử dụng đúng (`authMiddleware`, `validateRequest`)
- [ ] Comment bằng tiếng Việt
- [ ] Không có hardcoded value (dùng constants)
- [ ] Function có JSDoc comment
- [ ] Không thay đổi file trong `src/config/` mà không báo

---

## 9️⃣ UTILITY IMPORTS

```javascript
// Import thứ tự: modules -> config -> middleware -> models -> utils -> services

const express = require('express');            // modules
const config = require('../config/environment'); // config
const { authMiddleware } = require('../middleware/auth'); // middleware
const User = require('../models/User');         // models
const { sendSuccess } = require('../utils/responseHandler'); // utils
```

---

Nếu có câu hỏi, hãy hỏi **Khanh (Leader)** hoặc **Kiệt (Tech Lead)**!
