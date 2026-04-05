# 🚀 CLOUDINARY SETUP HƯỚNG DẪN CHI TIẾT

## 1️⃣ Lấy Cloudinary Credentials

### Bước 1: Đăng nhập Cloudinary
- Truy cập: https://cloudinary.com
- Đăng nhập bằng account của bạn

### Bước 2: Tìm API Keys
```
Cloudinary Dashboard > Settings > API Keys
hoặc truy cập: https://cloudinary.com/console/settings/api-keys
```

### Bước 3: Copy Credentials

Từ hình ảnh bạn gửi, lấy các thông tin sau:

```
Cloud Name:       dykzfyb4t
API Key:          146992899872728

API Secret:       (Click vào API Key "webphim" > Copy API Secret)
                  ⚠️ KHÔNG SHARE SECRET CÔNG KHAI!
                  LƯU VÀO .env LÀ ĐƯỢC, KHÔNG COMMIT GIT
```

---

## 📝 Bước 4: Tạo File `.env`

**Tại thư mục backend (`webxemphim-backend/`):**

```bash
# Tạo .env từ .env.example
cp .env.example .env
```

**Hoặc tạo file `.env` mới:**

```env
# ==================== CLOUDINARY ====================
CLOUDINARY_NAME=dykzfyb4t
CLOUDINARY_API_KEY=146992899872728
CLOUDINARY_API_SECRET=<dán_api_secret_bạn_copy_ở_trên>

# Các config khác...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
...
```

---

## 🔧 Bước 5: Cài Dependencies

```bash
# Nếu chưa cài npm packages
npm install

# Packages cần thiết đã có:
# - cloudinary ^1.32.0
# - multer ^1.4.5-lts.1
```

---

## 📂 Bước 6: Tạo Folder Tạm Thời

```bash
# Tạo folder để lưu file tạm
mkdir temp-uploads
```

**Hoặc add vào `.gitignore` nếu chưa có:**

```
temp-uploads/           # Folder file tạm từ upload
```

---

## 🎬 Bước 7: Test Upload

### Option A: Dùng Example Code (UPLOAD_EXAMPLE.js)

1. **Copy route example vào `server.js`:**

```javascript
// src/server.js - Thêm vào trước line "app.listen()"

const uploadRoutes = require('./routes/UPLOAD_EXAMPLE');
app.use('/api/upload', uploadRoutes);
```

2. **Chạy server:**

```bash
npm run dev
```

3. **Test với Postman:**

```
POST http://localhost:5000/api/upload/poster

Headers:
  Authorization: Bearer <your_jwt_token>
  Content-Type: multipart/form-data

Body (form-data):
  file: <chọn ảnh từ máy>

Response:
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "publicId": "webxemphim/posters/poster-123",
    "width": 1000,
    "height": 1500
  }
}
```

### Option B: Dùng Trong Controller

```javascript
// Trong controller của bạn
const { uploadImage } = require('../utils/uploadHandler');

exports.uploadMoviePoster = async (req, res, next) => {
  try {
    // File đó từ multer (req.file)
    const result = await uploadImage(req.file.path, {
      folder: 'webxemphim/movies',
      filename: `movie-${movieId}`
    });

    // Lưu URL vào database
    await Movie.findByIdAndUpdate(movieId, {
      poster: result.url,
      posterPublicId: result.publicId,
    });

    res.json({ success: true, url: result.url });
  } catch (error) {
    next(error);
  }
};
```

---

## 📚 API Uploadhandler Functions

### Upload Hình Ảnh

```javascript
const { uploadImage } = require('../utils/uploadHandler');

const result = await uploadImage(filePath, {
  folder: 'webxemphim/images',
  filename: 'my-image'
});

// result = {
//   url: "https://res.cloudinary.com/...",
//   publicId: "webxemphim/images/my-image",
//   width: 1920,
//   height: 1080,
//   size: 245000
// }
```

### Upload Video

```javascript
const { uploadVideo } = require('../utils/uploadHandler');

const result = await uploadVideo(filePath, {
  folder: 'webxemphim/videos',
  filename: 'episode-1'
});

// result = {
//   url: "https://res.cloudinary.com/...",
//   publicId: "webxemphim/videos/episode-1",
//   duration: 5400,     // Giây
//   size: 524288000     // Bytes
// }
```

### Xóa File

```javascript
const { deleteFile } = require('../utils/uploadHandler');

const success = await deleteFile('webxemphim/images/my-image');
// true hoặc false
```

### Lấy Thumbnail Video

```javascript
const { getVideoThumbnail } = require('../utils/uploadHandler');

const thumbnailUrl = getVideoThumbnail('webxemphim/videos/episode-1', 10);
// URL ảnh tại giây thứ 10
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. File Tạm Phải Xóa

```javascript
// Sau khi upload lên Cloudinary, phải xóa file tạm
const fs = require('fs');
fs.unlinkSync(req.file.path);  // Hoặc deleteFile()
```

### 2. Phần API Secret

```
❌ KHÔNG bao giờ:
- Commit .env lên Git
- Share API Secret công khai
- Hardcode secret trong code

✅ CẦN:
- Lưu API Secret trong .env
- .env phải trong .gitignore
- Chi có Khanh biết secret
```

### 3. Video Upload Mất Thời Gian

```
Video nhỏ (100MB): 1-5 phút
Video lớn (500MB): 10-30 phút

Nên:
- Dùng async/await, không đợi
- Thông báo user "đang xử lý"
- Lưu publicId khi có thể dùng webhook callback
```

### 4. Folder Organization

```
webxemphim/
├── posters/       # Poster phim
├── banners/       # Banner phim
├── avatars/       # Avatar user
├── thumbnails/    # Thumbnail
├── episodes/      # Video episode
├── images/        # Ảnh khác
└── uploads/       # File khác
```

---

## 🧪 Test Checklist

- [ ] .env có `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] `npm install` đã chạy
- [ ] Folder `temp-uploads/` tạo sẵn
- [ ] Server chạy: `npm run dev`
- [ ] Test upload poster với Postman
- [ ] File hiển thị trên Cloudinary dashboard
- [ ] File tạm bị xóa khỏi server
- [ ] DB được update với URL picture

---

## 📞 Troubleshooting

### Lỗi: "Cannot find module 'cloudinary'"
```bash
npm install
```

### Lỗi: "CLOUDINARY_NAME is undefined"
Kiểm tra `.env` file có `CLOUDINARY_NAME` chưa

### Lỗi: "Invalid credentials"
Kiểm tra `CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` có copy đúng không

### Lỗi: "File size too large"
Default limit 500MB. Nếu muốn tăng:
```javascript
limits: {
  fileSize: 1000 * 1024 * 1024 // 1GB
}
```

---

## 🎉 Xong!

Bạn đã setup Cloudinary thành công. Giờ mọi người có thể:

1. **Upload hình ảnh** (poster, banner, avatar)
2. **Upload video** (episodes)
3. **Xóa file** từ Cloudinary
4. **Lấy URL** để lưu vào database

Hết! 🚀
