# ==============================================================================
# DOCKERFILE CHO BACKEND (Node.js/Express)
# ==============================================================================
# File này định nghĩa cách build Docker image cho backend

# BƯỚC 1: Chọn base image - Dùng Node.js phiên bản 18 (LTS)
FROM node:18-alpine

# BƯỚC 2: Thiết lập thư mục làm việc trong container
# Tất cả lệnh sau này sẽ chạy trong thư mục /app
WORKDIR /app

# BƯỚC 3: Copy file package.json và package-lock.json trước
# Làm thế này để tận dụng Docker cache - nếu dependencies không đổi, không cần install lại
COPY package*.json ./

# BƯỚC 4: Cài đặt dependencies
# --production chỉ cài các package cần thiết cho production (không cài devDependencies)
# Bỏ --production nếu bạn cần cài tất cả packages
RUN npm install --production

# BƯỚC 5: Copy toàn bộ source code vào container
# Chú ý: .dockerignore sẽ loại trừ node_modules, .env, .git...
COPY . .

# BƯỚC 6: Mở port 5000 (port mà backend chạy)
EXPOSE 5000

# BƯỚC 7: Lệnh chạy khi container khởi động
# Chạy server bằng npm start
CMD ["npm", "start"]
