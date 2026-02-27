# UniShare Backend

Backend API cho ứng dụng chia sẻ tài liệu học tập UniShare, xây dựng bằng NestJS + MongoDB.

## Yêu cầu hệ thống

- **Node.js** >= 18
- **MongoDB** >= 6.0 (local hoặc Atlas)
- **npm** >= 9

## Cài đặt

```bash
# 1. Clone repository
git clone <repo-url>
cd UniShare-BE-main

# 2. Cài dependencies
npm install

# 3. Tạo file .env
cp .env.example .env
```

## Cấu hình (.env)

Tạo file `.env` ở thư mục gốc với nội dung:

```env
PORT=8000
DATABASE_URL=mongodb://127.0.0.1:27017/unishare
JWT_SECRET=your_jwt_secret_key_here
API_URL=http://localhost:8000
```

## Chạy ứng dụng

```bash
# Development (auto-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Server chạy tại: `http://localhost:8000`
API prefix: `/api`

## Seed dữ liệu

```bash
# Tạo tài khoản Admin mặc định
npm run seed:admin
```

Thông tin admin mặc định:
- Email: `admin@unishare.com`
- Password: `admin123`

## Cấu trúc thư mục

```
src/
├── auth/           # Đăng ký, đăng nhập, JWT strategy
├── users/          # Quản lý profile, đổi mật khẩu
├── documents/      # Upload, download, CRUD tài liệu
├── categories/     # API công khai lấy danh sách môn/ngành
├── admin/          # CRUD users, documents, subjects, majors (Admin/Mod)
├── statistics/     # Thống kê nền tảng
├── logs/           # Ghi log hoạt động admin
├── subjects/       # Schema môn học
├── majors/         # Schema ngành học
├── app.module.ts   # Root module
├── main.ts         # Entry point
└── create-admin.ts # Script seed admin
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint    | Mô tả           | Auth |
|--------|-------------|------------------|------|
| POST   | /register   | Đăng ký          | No   |
| POST   | /login      | Đăng nhập        | No   |
| GET    | /me         | Lấy profile      | JWT  |

### Users (`/api/users`)
| Method | Endpoint          | Mô tả                  | Auth |
|--------|-------------------|-------------------------|------|
| GET    | /me/profile       | Profile của mình        | JWT  |
| PATCH  | /me/profile       | Cập nhật profile        | JWT  |
| POST   | /me/change-password | Đổi mật khẩu          | JWT  |
| GET    | /me/stats         | Thống kê của mình       | JWT  |
| GET    | /profile/:userId  | Profile user khác       | JWT  |
| GET    | /:userId/stats    | Thống kê user khác      | JWT  |

### Documents (`/api/documents`)
| Method | Endpoint            | Mô tả                  | Auth |
|--------|---------------------|-------------------------|------|
| POST   | /upload             | Upload tài liệu        | JWT  |
| GET    | /                   | Danh sách tài liệu     | JWT  |
| GET    | /my-uploads         | Tài liệu của mình      | JWT  |
| GET    | /user/:userId/uploads | Tài liệu của user khác | JWT |
| GET    | /:id                | Chi tiết tài liệu      | JWT  |
| GET    | /:id/download       | Download tài liệu      | JWT  |
| PATCH  | /:id                | Cập nhật tài liệu      | JWT  |
| DELETE | /:id                | Xóa tài liệu           | JWT  |

### Categories (`/api/categories`)
| Method | Endpoint      | Mô tả               | Auth |
|--------|---------------|----------------------|------|
| GET    | /subjects     | Danh sách môn học    | JWT  |
| GET    | /majors       | Danh sách ngành học  | JWT  |
| GET    | /majors/:id   | Chi tiết ngành học   | JWT  |

### Admin (`/api/admin`) - Yêu cầu role ADMIN hoặc MODERATOR
| Method | Endpoint                   | Mô tả              | Role          |
|--------|----------------------------|---------------------|---------------|
| GET    | /users                     | Danh sách users     | Admin, Mod    |
| PATCH  | /users/:id/role            | Đổi role user       | Admin         |
| POST   | /users/:id/reset-password  | Reset mật khẩu      | Admin, Mod    |
| POST   | /users/:id/block           | Block user          | Admin, Mod    |
| POST   | /users/:id/unblock         | Unblock user        | Admin, Mod    |
| DELETE | /users/:id                 | Xóa user            | Admin         |
| GET    | /documents                 | Danh sách documents | Admin, Mod    |
| POST   | /documents/:id/block       | Block document      | Admin, Mod    |
| POST   | /documents/:id/unblock     | Unblock document    | Admin, Mod    |
| DELETE | /documents/:id             | Xóa document        | Admin         |
| POST   | /subjects                  | Tạo môn học         | Admin, Mod    |
| GET    | /subjects                  | Danh sách môn học   | Admin, Mod    |
| PATCH  | /subjects/:id              | Cập nhật môn học    | Admin, Mod    |
| DELETE | /subjects/:id              | Xóa môn học         | Admin, Mod    |
| POST   | /majors                    | Tạo ngành học       | Admin, Mod    |
| GET    | /majors                    | Danh sách ngành học | Admin, Mod    |
| PATCH  | /majors/:id                | Cập nhật ngành học  | Admin, Mod    |
| DELETE | /majors/:id                | Xóa ngành học       | Admin, Mod    |

### Statistics (`/api/statistics`) - Admin/Mod only
| Method | Endpoint          | Mô tả                    | Role       |
|--------|-------------------|---------------------------|------------|
| GET    | /platform         | Thống kê nền tảng         | Admin, Mod |
| GET    | /uploads-over-time | Biểu đồ upload theo ngày | Admin, Mod |

### Logs (`/api/logs`) - Admin only
| Method | Endpoint | Mô tả          | Role  |
|--------|----------|-----------------|-------|
| GET    | /        | Danh sách logs  | Admin |

## Test thủ công (Flow đầy đủ)

```bash
# 1. Seed admin
npm run seed:admin

# 2. Chạy server
npm run start:dev

# 3. Đăng ký user mới
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","fullName":"Test User","password":"123456"}'

# 4. Đăng nhập
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"123456"}'
# → Lấy accessToken từ response

# 5. Upload tài liệu (thay TOKEN bằng accessToken)
curl -X POST http://localhost:8000/api/documents/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "title=Bài giảng" \
  -F "subject=SUBJECT_ID" \
  -F "file=@/path/to/file.pdf"

# 6. Xem danh sách tài liệu
curl http://localhost:8000/api/documents \
  -H "Authorization: Bearer TOKEN"

# 7. Đăng nhập admin
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unishare.com","password":"admin123"}'

# 8. Xem thống kê (dùng admin token)
curl http://localhost:8000/api/statistics/platform \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 9. Xem logs
curl http://localhost:8000/api/logs \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Validation

- `whitelist: true` — Tự động loại bỏ các field không khai báo trong DTO
- `forbidNonWhitelisted: true` — Trả lỗi nếu gửi field thừa
- `transform: true` — Tự động convert type (string → number cho query params)

## Scripts

| Script | Mô tả |
|--------|-------|
| `npm run start:dev` | Chạy development mode (auto-reload) |
| `npm run build` | Build production |
| `npm run start:prod` | Chạy production |
| `npm run seed:admin` | Tạo tài khoản admin mặc định |
| `npm run lint` | Kiểm tra và fix lỗi ESLint |
| `npm run format` | Format code với Prettier |
