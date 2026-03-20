# 🎬 Film+ - Hệ Thống Web Xem Phim Online

Nền tảng streaming video tương tự Netflix nhỏ gọn, cho phép người dùng xem phim, tìm kiếm, đánh giá và bình luận.

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|-----------|----------|
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB + Mongoose |
| **Authentication** | JWT + Bcrypt |
| **File Storage** | Cloudinary |
| **Server** | Heroku / Railway |

---

## 📁 Cấu Trúc Thư Mục

```
webxemphim-backend/
├── src/
│   ├── config/          # Cấu hình chung (chung cho cả nhóm)
│   ├── middleware/      # Middleware (chung cho cả nhóm)
│   ├── models/          # MongoDB schemas (mỗi người tạo schema riêng)
│   ├── controllers/     # Xử lý logic (mỗi người tạo controller riêng)
│   ├── routes/          # API routes (mỗi người tạo routes riêng)
│   ├── utils/           # Hàm tiện ích chung (chung cho cả nhóm)
│   └── server.js        # Entry point
├── docs/                # Tài liệu
├── .env.example         # Template biến môi trường
├── .gitignore
├── package.json
└── README.md
```

Xem chi tiết: [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)

---

## 🚀 Bắt Đầu

### 1. Clone Repo
```bash
git clone <repo_url>
cd webxemphim-backend
```

### 2. Cài Dependencies
```bash
npm install
```

### 3. Copy File Environment
```bash
cp .env.example .env
```

### 4. Chạy Server
```bash
# Chế độ development (tự restart khi có thay đổi)
npm run dev

# Chế độ production
npm start
```

Server sẽ chạy tại: `http://localhost:5000`

---

## 👥 Phân Công Công Việc

| Tên | Vai Trò | Chủ Yếu Phụ Trách |
|-----|---------|-------------------|
| **Khanh** | Leader | Config, Middleware, Auth API, Deploy |
| **Kiệt** | Senior Dev | Movies, Episodes, Comments, Ratings APIs |
| **Nhất** | Junior Dev | History, VIP APIs, Helper functions |
| **Thu Hà** | Frontend | Search, Filter, UI Pages |
| **Nghĩa** | Backend | Admin Panel, File Upload, VIP |
| **Tuấn Anh** | QA | Testing, Documentation, Optimization |

---

## 📚 Tài Liệu

- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Cấu trúc folder chi tiết
- **[API_SPEC.md](./docs/API_SPEC.md)** - Danh sách API (sắp tới)
- **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Cấu trúc Database (sắp tới)

---

## 🔧 Script Liệu Dụng

```bash
# Chạy server (development mode)
npm run dev

# Chạy server (production mode)
npm start

# Chạy test
npm test
```

---

## ⚠️ Quy Tắc Quan Trọng

### ❌ NÊN TRÁNH
- ❌ Sửa file trong `src/config/` mà không báo với Khanh
- ❌ Commit file `.env` lên Git (nó đã trong `.gitignore`)
- ❌ Tạo file mới trong folder của người khác

### ✅ CẦN LÀM
- ✅ Tạo branch riêng cho feature của mình: `git checkout -b feature/your-feature`
- ✅ Commit thường xuyên với message rõ ràng
- ✅ Pull request để review trước khi merge vào main
- ✅ Comment code bằng tiếng Việt để dễ hiểu

---

## 🔐 Biến Môi Trường (Variables)

Tương các field trong `.env.example`:

```
MONGODB_URI     - Chuỗi kết nối MongoDB
JWT_SECRET      - Key mã hóa JWT token
PORT            - Port chạy server (mặc định 5000)
NODE_ENV        - Môi trường (development/production)
CLOUDINARY_*    - Cấu hình Cloudinary (upload ảnh/video)
FRONTEND_URL    - URL frontend để CORS
```

---

## 📞 Liên Hệ & Support

- **Leader**: Khanh - Nếu có vấn đề về config, deploy
- **Tech Lead**: Kiệt - Nếu có vấn đề về API structure
- **Team Chat**: Discord / Telegram

---

## 📝 License

MIT

---

**Made with ❤️ by Film+ Team**
