# 📁 Backend Folder Structure - Film+ (Hệ thống xem phim)

```
webxemphim-backend/
├── src/
│   ├── config/              # Cấu hình chung
│   │   ├── environment.js   # Config từ .env
│   │   ├── constants.js     # Hằng số chung
│   │   └── database.js      # Kết nối MongoDB
│   │
│   ├── middleware/          # Middleware chung
│   │   ├── auth.js          # JWT authentication
│   │   ├── errorHandler.js  # Xử lý lỗi
│   │   └── validation.js    # Validate request
│   │
│   ├── models/              # Schema MongoDB
│   │   ├── User.js
│   │   ├── Movie.js
│   │   ├── Episode.js
│   │   ├── Comment.js
│   │   ├── Rating.js
│   │   ├── History.js
│   │   ├── VipPackage.js
│   │   └── Subscription.js
│   │
│   ├── controllers/         # Xử lý logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── movieController.js
│   │   ├── episodeController.js
│   │   ├── commentController.js
│   │   ├── ratingController.js
│   │   ├── historyController.js
│   │   ├── vipController.js
│   │   └── admin/
│   │       ├── adminMovieController.js
│   │       └── adminUserController.js
│   │
│   ├── routes/              # API Routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── movieRoutes.js
│   │   ├── episodeRoutes.js
│   │   ├── commentRoutes.js
│   │   ├── ratingRoutes.js
│   │   ├── historyRoutes.js
│   │   ├── vipRoutes.js
│   │   └── admin/
│   │       ├── adminMovieRoutes.js
│   │       └── adminUserRoutes.js
│   │
│   ├── utils/              # Hàm tiện ích
│   │   ├── validators.js    # Validate data (Joi/Yup)
│   │   ├── responseHandler.js # Format response chuẩn
│   │   ├── errorHandling.js   # Custom error classes
│   │   ├── uploadHandler.js   # Cloudinary upload
│   │   └── tokenUtils.js      # JWT functions
│   │
│   └── server.js           # Entry point chính
│
├── docs/                    # Documentation
│   ├── API.md               # API documentation
│   ├── SCHEMA.md            # Database schema
│   └── GUIDE.md             # Developer guide
│
├── .env.example             # Template environment
├── .gitignore
├── package.json
├── README.md
└── FOLDER_STRUCTURE.md      # File này
```

## 📋 Hướng dẫn sử dụng

### Mỗi người khi dev cần:

1. **Clone repo**
   ```bash
   git clone <repo_url>
   cd webxemphim-backend
   ```

2. **Copy .env.example → .env**
   ```bash
   cp .env.example .env
   ```

3. **Cài dependencies**
   ```bash
   npm install
   ```

4. **Tạo file của mình theo cấu trúc trên**

### Quy tắc chung:

- ✅ Tất cả file nếu không nằm trong `src/config` hoặc `src/utils` thì mình tạo riêng
- ✅ `src/config` chỉ có file cấu hình chung dùng cho toàn hệ thống
- ✅ `src/utils` chỉ có hàm dùng chung cho nhiều người
- ✅ Mỗi feature (auth, movie, comment...) là 1 nhóm: Model + Controller + Routes
- ✅ Sửa `.env` file nhưng **KHÔNG commit .env lên Git**

## 👥 Ai phụ trách cái gì:

- **Khanh (Leader)**: config, middleware, server.js, utils
- **Kiệt**: movieController, episodeController, commentController, ratingController
- **Nhất**: historyController, userController (profile)
- **Nghĩa**: vipController, admin controllers
- **Tuấn Anh**: Hoàn thiện, testing

---

**Thêm file nào cần được duyệt bởi Khanh trước khi commit!**
