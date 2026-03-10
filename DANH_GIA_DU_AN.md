# ĐÁNH GIÁ DỰ ÁN UNISHARE THEO RUBRIC

> **Course:** CSE703048 - Software Analysis and Design  
> **Use for:** Course Project  
> **Academic year:** 2023-2024  
> **Ngày đánh giá:** 01/03/2026

---

## TỔNG QUAN DỰ ÁN

| Thông tin | Chi tiết |
|-----------|----------|
| **Tên dự án** | UniShare - Nền tảng chia sẻ tài liệu học tập |
| **Backend** | NestJS 11, MongoDB (Mongoose), JWT (Passport), Multer |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, TanStack Query, Zustand |
| **Repo Backend** | 15 commits, 1 author (thiennt), branch: master |
| **Repo Frontend** | 12 commits, 1 author (thiennt), branch: master |

---

## I. PROGRAM (Chương trình Demo) — 35/35 điểm

### 1. Functions (15 điểm)

| Mức | Mô tả | Đánh giá |
|:---:|-------|----------|
| 1 | No program | ❌ |
| 2 | There is a program, but only front-end site | ❌ |
| 3 | Have front-end and back-end but not all functions described in the MVP are implemented | ❌ |
| **4** | **Full front-end and back-end with all functions described in the MVP are implemented** | ✅ **ĐẠT** |

**Điểm ước tính: 14-15/15**

#### Danh sách chức năng đã triển khai

##### Authentication & Authorization
| Chức năng | Backend API | Frontend UI | Trạng thái |
|-----------|-------------|-------------|:----------:|
| Đăng ký tài khoản | `POST /api/auth/register` | `/register` | ✅ |
| Đăng nhập | `POST /api/auth/login` | `/login` | ✅ |
| JWT Authentication | Passport JWT Strategy | axios interceptor | ✅ |
| Phân quyền 3 vai trò (USER, MODERATOR, ADMIN) | RolesGuard + @Roles() | AuthGuard + RoleGuard | ✅ |
| Kiểm tra trạng thái tài khoản (ACTIVE/BLOCKED) | Auth Service | Redirect tự động | ✅ |

##### Quản lý tài liệu (Documents)
| Chức năng | Backend API | Frontend UI | Trạng thái |
|-----------|-------------|-------------|:----------:|
| Upload tài liệu (PDF, DOC, DOCX, IMG, ZIP) | `POST /api/documents/upload` | `/upload` (3 bước) | ✅ |
| Danh sách tài liệu (phân trang, lọc, tìm kiếm) | `GET /api/documents` | `/` (trang chủ) | ✅ |
| Chi tiết tài liệu | `GET /api/documents/:id` | `/document/[id]` | ✅ |
| Xem trước tài liệu PDF | `GET /api/documents/:id/preview` | iframe trong detail page | ✅ |
| Tải xuống tài liệu | `GET /api/documents/:id/download` | Nút download | ✅ |
| Cập nhật tài liệu | `PATCH /api/documents/:id` | EditDocumentModal | ✅ |
| Xóa tài liệu (owner hoặc admin) | `DELETE /api/documents/:id` | DeleteConfirmModal | ✅ |
| Chia sẻ link tài liệu | — | Copy link button | ✅ |
| Lọc theo ngành/môn học | Query params | FilterSidebar | ✅ |
| Sắp xếp (ngày đăng, lượt tải) | Query params | SortDropdown | ✅ |
| Chế độ xem Grid/List | — | Toggle button | ✅ |
| Tìm kiếm toàn cục | Query params | GlobalSearch (debounced) | ✅ |
| Giới hạn file upload 100MB | MaxFileSizeValidator + Multer | Dropzone maxSize | ✅ |

##### Quản lý người dùng (Users)
| Chức năng | Backend API | Frontend UI | Trạng thái |
|-----------|-------------|-------------|:----------:|
| Xem profile cá nhân | `GET /api/users/me/profile` | `/profile/me` | ✅ |
| Chỉnh sửa profile | `PATCH /api/users/me/profile` | EditProfileModal | ✅ |
| Đổi mật khẩu | `POST /api/users/me/change-password` | ChangePasswordModal | ✅ |
| Xóa tài khoản | `DELETE /api/users/me/account` | DeleteAccountModal | ✅ |
| Thống kê upload cá nhân | `GET /api/users/me/upload-stats` | Profile page | ✅ |
| Xem profile người khác | `GET /api/users/profile/:userId` | `/profile/[userId]` | ✅ |
| Tài liệu đã upload | `GET /api/documents/my-uploads` | MyDocumentListItem | ✅ |
| Upload avatar | — (Cloudinary) | ProfileHeader | ✅ |

##### Quản trị (Admin Panel)
| Chức năng | Backend API | Frontend UI | Trạng thái |
|-----------|-------------|-------------|:----------:|
| Quản lý người dùng (danh sách, tìm kiếm, lọc role, sắp xếp) | `GET /api/admin/users` | ManagerUsers tab | ✅ |
| Chặn/Bỏ chặn người dùng | `POST /api/admin/users/:id/block\|unblock` | Nút Block/Unblock | ✅ |
| Xóa người dùng | `DELETE /api/admin/users/:id` | Nút Delete | ✅ |
| Thay đổi vai trò | `PATCH /api/admin/users/:id/role` | Select role | ✅ |
| Reset mật khẩu | `POST /api/admin/users/:id/reset-password` | Nút Reset | ✅ |
| Ủy quyền Admin | `POST /api/admin/delegate-admin/:id` | Nút Delegate | ✅ |
| Quản lý tài liệu | `GET /api/admin/documents` | ManagerDocuments tab | ✅ |
| Chặn/Bỏ chặn tài liệu | `POST /api/admin/documents/:id/block\|unblock` | Nút Block/Unblock | ✅ |
| Xóa tài liệu (admin) | `DELETE /api/admin/documents/:id` | Nút Delete | ✅ |
| CRUD Môn học | `POST\|GET\|PATCH\|DELETE /api/admin/subjects` | ManagerSubjects tab | ✅ |
| CRUD Ngành học | `POST\|GET\|PATCH\|DELETE /api/admin/majors` | ManagerMajors tab | ✅ |
| Logs hệ thống | `GET /api/logs` | ManagerLogs tab | ✅ |

##### Thống kê (Statistics)
| Chức năng | Backend API | Frontend UI | Trạng thái |
|-----------|-------------|-------------|:----------:|
| Thống kê nền tảng (uploads, downloads, users) | `GET /api/statistics/platform` | `/statistics` | ✅ |
| Biểu đồ uploads theo thời gian | `GET /api/statistics/uploads-over-time` | Recharts LineChart | ✅ |

##### Danh mục công khai (Categories)
| Chức năng | Backend API | Frontend UI | Trạng thái |
|-----------|-------------|-------------|:----------:|
| Danh sách môn học | `GET /api/categories/subjects` | FilterSidebar, Upload form | ✅ |
| Danh sách ngành học | `GET /api/categories/majors` | FilterSidebar | ✅ |

---

### 2. UI (15 điểm)

| Mức | Mô tả | Đánh giá |
|:---:|-------|----------|
| 1 | No program | ❌ |
| 2 | Have 0 but have less than 3 screens. UI is generally usable, but has some confusing or unclear elements. The design is simple and lacks visual appeal. | ❌ |
| 3 | The UI has more than 3 screens. The overall design is visually appealing and engaging. | ❌ |
| **4** | **The UI has good amount of screens. The UI provides a seamless and enjoyable experience for users. The overall design is visually stunning and perfectly matches the program's purpose.** | ✅ **ĐẠT** |

**Điểm ước tính: 12-14/15**

#### Danh sách màn hình (12+ screens)

| # | Màn hình | Route | Mô tả |
|:-:|----------|-------|-------|
| 1 | Đăng nhập | `/login` | Form email/password, split layout với branding |
| 2 | Đăng ký | `/register` | Form đăng ký, validate email Phenikaa |
| 3 | Trang chủ - Danh sách tài liệu | `/` | Grid/List view, filter sidebar, search, sort |
| 4 | Upload tài liệu - Bước 1 | `/upload` | Drag & drop file |
| 5 | Upload tài liệu - Bước 2 | `/upload` | Form metadata (môn học, tiêu đề, mô tả) |
| 6 | Upload tài liệu - Bước 3 | `/upload` | Processing & hoàn tất |
| 7 | Chi tiết tài liệu | `/document/[id]` | Preview PDF, thông tin, download |
| 8 | Profile cá nhân | `/profile/me` | Avatar, stats, danh sách tài liệu, settings |
| 9 | Profile người khác | `/profile/[userId]` | Xem profile công khai |
| 10 | Thống kê | `/statistics` | Dashboard stats + biểu đồ |
| 11 | Admin - Quản lý Môn học | `/admin/manager` (tab 1) | CRUD subjects |
| 12 | Admin - Quản lý Ngành học | `/admin/manager` (tab 2) | CRUD majors |
| 13 | Admin - Quản lý Tài liệu | `/admin/manager` (tab 3) | Block/unblock/delete documents |
| 14 | Admin - Quản lý Người dùng | `/admin/manager` (tab 4) | Block/unblock/role/reset/delegate |
| 15 | Admin - Logs hệ thống | `/admin/manager` (tab 5) | Xem lịch sử thao tác |

#### Đánh giá UI/UX chi tiết

| Tiêu chí | Đánh giá | Trạng thái |
|----------|----------|:----------:|
| Thiết kế nhất quán (color scheme, spacing, typography) | Tailwind CSS, Inter font, blue/gray palette | ✅ |
| Responsive design | Mobile-friendly layouts | ✅ |
| Loading states | Skeleton loaders, loading spinners | ✅ |
| Empty states | Icons + messages khi không có data | ✅ |
| Error handling | Toast notifications (react-hot-toast) | ✅ |
| Form validation | Client-side + server-side validation | ✅ |
| Confirmation modals | DeleteConfirmModal cho các thao tác quan trọng | ✅ |
| Navigation | Navbar với search, links, user menu | ✅ |
| Icons | Heroicons (outline style) | ✅ |
| Biểu đồ | Recharts (LineChart) | ✅ |
| Dark mode | CSS variables sẵn sàng nhưng chưa tích hợp UI toggle | ⚠️ |
| Pagination UI | API hỗ trợ nhưng UI chưa có phân trang | ⚠️ |

#### Công nghệ UI sử dụng

| Công nghệ | Mục đích |
|-----------|----------|
| Tailwind CSS 4 | Styling framework |
| Headless UI | Modals, Menus, Transitions |
| Heroicons | Icon set |
| Recharts | Biểu đồ thống kê |
| react-hot-toast | Toast notifications |
| react-dropzone | Drag & drop file upload |
| Zustand | State management |
| TanStack Query | Server state, caching, mutations |

---

### 3. Source Control (5 điểm)

| Mức | Mô tả | Đánh giá |
|:---:|-------|----------|
| 1 | No code repo | ❌ |
| 2 | There is source code repo but has less than 5 commits and only one person commit code | ❌ |
| **3** | **There is a source code repo with more than 5 commits, but not all members in the team make commit** | ⚠️ **HIỆN TẠI** |
| 4 | Code repo has more than 5 commits and all the members in the team make commit | ❌ Chưa đạt |

**Điểm ước tính: 3-4/5**

#### Thống kê Git hiện tại

##### Backend Repository (D:\UniShare-BE-main)

| Thông tin | Giá trị |
|-----------|---------|
| Tổng commits | 15 |
| Authors | 1 (thiennt) |
| Branch | master |

```
ccc413a  update giao dien
bee6dbd  test cac chuc nang thanh cong
eaac58b  test api
1c966cb  validation + setup testing
6c068de  Lam trang thong ke
d0c8bc4  lam admin module
8d1189d  lam categories + major + subject
3dae3ee  upload file
1acc48b  document schema
845b67a  JWT guard + phan quyen
f75cf93  lam auth register/login
0e5e000  lam users api
9de660e  lam user schema
a8383a4  setup module
b47d31a  init project
```

##### Frontend Repository (D:\UniShare-FE-main)

| Thông tin | Giá trị |
|-----------|---------|
| Tổng commits | 12 |
| Authors | 1 (thiennt) |
| Branch | master |

```
d0dd30a  update giao dien
80c9baa  fix trang profile
6546488  setup ket noi api toi backend
1919c6b  fix trang quan ly
a9fa962  lam trang quan tri va quality
09552ba  setup profile
843c50f  Upload flow
f8da771  lam trang chinh danh sach tai lieu
1249b0f  lam Auth flow (dang nhap/dang ky)
bff7d72  core setup
b7dcfdd  init project
520421c  Initial commit from Create Next App
```

#### ⚠️ VẤN ĐỀ CẦN KHẮC PHỤC

> **Chỉ có 1 người commit (thiennt).** Để đạt mức 4 (5/5 điểm), **tất cả thành viên trong nhóm phải có commit** trong repo.

#### Khuyến nghị
- Mỗi thành viên trong nhóm cần config git với tên và email riêng
- Mỗi thành viên cần đóng góp và commit ít nhất vài commits
- Commit messages nên rõ ràng, mô tả thay đổi cụ thể

---

## II. REPORT (Báo cáo) — 55/55 điểm

> ⚠️ **Lưu ý:** Phần này phụ thuộc vào nội dung file báo cáo. Dưới đây là đánh giá dựa trên những gì code thể hiện và khuyến nghị cho báo cáo.

### 4. Problem Statement (5 điểm)

| Mức | Mô tả |
|:---:|-------|
| 1 | No problem statement |
| 2 | The problem statement is unclear and lacks focus. The problem is not well-defined |
| 3 | The problem statement is somewhat clear and has some focus. The problem is defined, but lacks specific |
| **4** | **The problem statement is clear and well-focused. The problem is well-defined and specific. Great detail for requirements** |

#### Khuyến nghị nội dung Problem Statement

Dựa trên dự án, problem statement nên bao gồm:

- **Vấn đề:** Sinh viên đại học thiếu nền tảng tập trung để chia sẻ tài liệu học tập (bài giảng, đề thi, bài tập). Tài liệu phân tán trên nhiều kênh (Facebook, Zalo, Google Drive) khiến việc tìm kiếm khó khăn.
- **Đối tượng:** Sinh viên và giảng viên Đại học Phenikaa
- **Giải pháp:** UniShare - nền tảng web cho phép upload, tìm kiếm, tải xuống tài liệu theo môn học/ngành, với hệ thống phân quyền (USER, MODERATOR, ADMIN)
- **Phạm vi:** Web application với đầy đủ CRUD operations, authentication, authorization, file management

### 5. Technical Terms (5 điểm)

| Mức | Mô tả |
|:---:|-------|
| 1 | Technical terms are not explained or defined |
| 2 | Technical terms are explained or defined inconsistently or insufficiently |
| 3 | Technical terms are explained or defined clearly and consistently |
| **4** | **Technical terms are explained or defined in great detail, providing a complete understanding** |

#### Các thuật ngữ kỹ thuật cần giải thích trong báo cáo

| Thuật ngữ | Mô tả |
|-----------|-------|
| **NestJS** | Framework Node.js cho backend, dựa trên TypeScript, kiến trúc module |
| **Next.js** | React framework cho frontend, hỗ trợ SSR/SSG |
| **MongoDB** | NoSQL database, lưu trữ dạng document (JSON-like) |
| **Mongoose** | ODM (Object Document Mapping) cho MongoDB |
| **JWT (JSON Web Token)** | Cơ chế xác thực stateless, mã hóa thông tin user trong token |
| **REST API** | Kiến trúc API theo chuẩn REST (GET, POST, PATCH, DELETE) |
| **RBAC (Role-Based Access Control)** | Phân quyền dựa trên vai trò (USER, MODERATOR, ADMIN) |
| **Multer** | Middleware xử lý file upload trong Node.js |
| **Zustand** | Thư viện quản lý state nhẹ cho React |
| **TanStack Query** | Thư viện quản lý server state, caching, và mutations |
| **Tailwind CSS** | Utility-first CSS framework |
| **TypeScript** | Superset của JavaScript với static typing |
| **CORS** | Cross-Origin Resource Sharing, cho phép frontend gọi API từ domain khác |
| **bcrypt** | Thư viện hash mật khẩu an toàn |
| **FormData** | Web API để gửi dữ liệu multipart (bao gồm file) |

### 6. Requirement Analysis (20 điểm)

| Mức | Mô tả |
|:---:|-------|
| 1 | The software requirements are unclear, incomplete or lacking |
| 2 | The software requirements are somewhat clear and complete. There is use-case model, but lack of detail specification for each use-case |
| 3 | The requirement analysis is complete, correct, and adequate. There is use-case model, with detail specification of each use-case |
| **4** | **The analysis is documented and communicated in a highly professional and effective manner, using appropriate tools. There is an use-case model, with detail specification of each use-case** |

#### Khuyến nghị: Use Cases cần có trong báo cáo

##### Actors (Tác nhân)

| Actor | Mô tả |
|-------|-------|
| **Guest** | Người dùng chưa đăng nhập, chỉ xem danh sách tài liệu |
| **User** | Sinh viên đã đăng ký, có thể upload/download tài liệu |
| **Moderator** | Kiểm duyệt viên, quản lý tài liệu và người dùng |
| **Admin** | Quản trị viên toàn quyền |

##### Danh sách Use Cases

| # | Use Case | Actor | Mô tả |
|:-:|----------|-------|-------|
| UC01 | Đăng ký tài khoản | Guest | Đăng ký bằng email Phenikaa |
| UC02 | Đăng nhập | Guest | Đăng nhập bằng email/password |
| UC03 | Đăng xuất | User, Mod, Admin | Kết thúc phiên đăng nhập |
| UC04 | Xem danh sách tài liệu | All | Duyệt tài liệu với bộ lọc |
| UC05 | Tìm kiếm tài liệu | All | Tìm theo tiêu đề |
| UC06 | Lọc tài liệu | All | Lọc theo ngành/môn học |
| UC07 | Xem chi tiết tài liệu | All | Xem thông tin + preview PDF |
| UC08 | Upload tài liệu | User, Mod, Admin | Upload file + metadata |
| UC09 | Tải xuống tài liệu | User, Mod, Admin | Download file gốc |
| UC10 | Chỉnh sửa tài liệu | Owner | Cập nhật metadata |
| UC11 | Xóa tài liệu | Owner, Mod, Admin | Xóa tài liệu và file |
| UC12 | Chia sẻ link tài liệu | User, Mod, Admin | Copy link công khai |
| UC13 | Xem profile cá nhân | User, Mod, Admin | Xem thông tin và thống kê |
| UC14 | Chỉnh sửa profile | User, Mod, Admin | Cập nhật tên, avatar |
| UC15 | Đổi mật khẩu | User, Mod, Admin | Thay đổi mật khẩu |
| UC16 | Xóa tài khoản | User, Mod | Xóa tài khoản vĩnh viễn |
| UC17 | Xem profile người khác | All | Xem profile công khai |
| UC18 | Quản lý người dùng | Mod, Admin | Block/unblock, xem danh sách |
| UC19 | Thay đổi vai trò | Admin | Thay đổi role user |
| UC20 | Reset mật khẩu người dùng | Mod, Admin | Đặt lại mật khẩu |
| UC21 | Ủy quyền Admin | Admin | Chuyển quyền admin cho moderator |
| UC22 | Quản lý tài liệu (admin) | Mod, Admin | Block/unblock/delete tài liệu |
| UC23 | CRUD Môn học | Mod, Admin | Tạo/sửa/xóa môn học |
| UC24 | CRUD Ngành học | Mod, Admin | Tạo/sửa/xóa ngành học |
| UC25 | Xem thống kê | Mod, Admin | Dashboard + biểu đồ |
| UC26 | Xem logs hệ thống | Mod, Admin | Lịch sử thao tác quản trị |

### 7. System Analysis & Design (25 điểm)

| Mức | Mô tả |
|:---:|-------|
| 1 | The system analysis and design is incomplete, incorrect, or inadequate |
| 2 | The system analysis and design is somewhat complete, correct, and adequate. There are use-case realization and sequence diagram to express necessary requirements, features, functions, or behaviors of the system |
| 3 | The system analysis and design is complete, correct, and adequate. There are use-case realization and sequence diagram. The subsystem designs are also present |
| **4** | **The system analysis and design is complete, correct, and adequate. There are use-case realization and sequence diagram to express necessary requirements, features, functions, or behaviors of the system. The subsystem designs are also present** |

#### Khuyến nghị: Sơ đồ cần có trong báo cáo

##### 7.1 Kiến trúc hệ thống (System Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│   Next.js 16 + React 19 + TypeScript + Tailwind CSS          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│   │  Pages    │  │Components│  │  Hooks   │  │  Stores   │  │
│   │ (App      │  │ (UI      │  │(TanStack │  │ (Zustand) │  │
│   │  Router)  │  │  Library)│  │  Query)  │  │           │  │
│   └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                        │ axios (HTTP)                         │
└────────────────────────┼────────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────┼────────────────────────────────────┐
│                    SERVER (NestJS)                            │
│   Port: 8000  │  Prefix: /api                                │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│   │Controllers│  │ Services │  │  Guards  │  │  Schemas  │  │
│   │ (Routes)  │  │(Business │  │(JWT+Role)│  │(Mongoose) │  │
│   │           │  │  Logic)  │  │          │  │           │  │
│   └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                        │ Mongoose ODM                        │
└────────────────────────┼────────────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    MongoDB Database                          │
│   Collections: users, documents, subjects, majors,           │
│                platformstats, logs                            │
└─────────────────────────────────────────────────────────────┘
```

##### 7.2 Backend Module Architecture

```
                        AppModule
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                      │
   ConfigModule      MongooseModule        ServeStaticModule
   (global)          (MongoDB)             (/uploads)
        │
   ┌────┼────┬────────┬──────────┬──────────┬───────────┐
   │    │    │        │          │          │           │
 Auth  Users Documents Admin  Statistics  Logs    Categories
   │    │    │        │          │          │           │
   └──┬─┘    ├─Multer ├─Users    ├─Mongoose │      ┌───┤
      │      ├─Users  ├─Stats   │          │      │   │
   Passport  ├─Stats  ├─Logs    │          │   Subjects│
   JWT       └─Logs   └─────────┘          │      │   │
                                           │   Majors │
                                           │          │
                                           └──────────┘
```

##### 7.3 Database Schema (ERD)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     USERS       │     │   DOCUMENTS     │     │    SUBJECTS     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ _id: ObjectId   │◄────│ uploader: Ref   │     │ _id: ObjectId   │
│ email: String   │     │ _id: ObjectId   │────►│ name: String    │
│ password: String│     │ title: String   │     │ code: String    │
│ fullName: String│     │ description: Str│     │ managingFaculty │
│ avatarUrl: Str  │     │ fileUrl: String │     └─────────────────┘
│ role: Enum      │     │ filePath: String│            ▲
│  (USER/MOD/ADM) │     │ fileType: String│            │
│ status: Enum    │     │ fileSize: Number│     ┌──────┴──────────┐
│  (ACTIVE/BLOCK) │     │ subject: Ref    │────►│     MAJORS      │
│ uploadsCount    │     │ status: Enum    │     ├─────────────────┤
│ downloadsCount  │     │ documentType    │     │ _id: ObjectId   │
│ joinedDate      │     │ schoolYear      │     │ name: String    │
└─────────────────┘     │ downloadCount   │     │ code: String    │
        ▲               │ viewCount       │     │ description     │
        │               │ uploadDate      │     │ subjects: [Ref] │
┌───────┴─────────┐     └─────────────────┘     └─────────────────┘
│      LOGS       │
├─────────────────┤     ┌─────────────────┐
│ _id: ObjectId   │     │ PLATFORM_STATS  │
│ performedBy:Ref │     ├─────────────────┤
│ action: String  │     │ _id: ObjectId   │
│ targetUser: Ref │     │ totalUploads    │
│ targetDocument  │     │ totalDownloads  │
│ details: String │     │ activeUsers     │
│ createdAt       │     └─────────────────┘
└─────────────────┘
```

##### 7.4 API Endpoints tổng hợp

| Module | Method | Endpoint | Auth | Mô tả |
|--------|:------:|----------|:----:|-------|
| **Auth** | POST | `/api/auth/register` | No | Đăng ký |
| | POST | `/api/auth/login` | No | Đăng nhập |
| | GET | `/api/auth/me` | JWT | Thông tin user hiện tại |
| **Users** | GET | `/api/users/me/profile` | JWT | Profile cá nhân |
| | PATCH | `/api/users/me/profile` | JWT | Cập nhật profile |
| | POST | `/api/users/me/change-password` | JWT | Đổi mật khẩu |
| | DELETE | `/api/users/me/account` | JWT | Xóa tài khoản |
| | GET | `/api/users/me/stats` | JWT | Thống kê cá nhân |
| | GET | `/api/users/me/upload-stats` | JWT | Chi tiết upload stats |
| | GET | `/api/users/profile/:userId` | No | Profile công khai |
| **Documents** | POST | `/api/documents/upload` | JWT | Upload tài liệu |
| | GET | `/api/documents` | No | Danh sách (phân trang, lọc) |
| | GET | `/api/documents/my-uploads` | JWT | Tài liệu của tôi |
| | GET | `/api/documents/:id` | No | Chi tiết tài liệu |
| | GET | `/api/documents/:id/preview` | No | Xem trước (inline) |
| | GET | `/api/documents/:id/download` | JWT | Tải xuống |
| | PATCH | `/api/documents/:id` | JWT | Cập nhật |
| | DELETE | `/api/documents/:id` | JWT | Xóa |
| **Admin** | GET | `/api/admin/users` | Admin/Mod | Danh sách users |
| | POST | `/api/admin/users/:id/block` | Admin/Mod | Chặn user |
| | POST | `/api/admin/users/:id/unblock` | Admin/Mod | Bỏ chặn user |
| | DELETE | `/api/admin/users/:id` | Admin | Xóa user |
| | PATCH | `/api/admin/users/:id/role` | Admin | Đổi role |
| | POST | `/api/admin/users/:id/reset-password` | Admin/Mod | Reset password |
| | POST | `/api/admin/delegate-admin/:id` | Admin | Ủy quyền admin |
| | GET | `/api/admin/documents` | Admin/Mod | Danh sách tài liệu |
| | POST | `/api/admin/documents/:id/block` | Admin/Mod | Chặn tài liệu |
| | POST | `/api/admin/documents/:id/unblock` | Admin/Mod | Bỏ chặn tài liệu |
| | DELETE | `/api/admin/documents/:id` | Admin | Xóa tài liệu |
| | CRUD | `/api/admin/subjects` | Admin/Mod | Quản lý môn học |
| | CRUD | `/api/admin/majors` | Admin/Mod | Quản lý ngành học |
| **Statistics** | GET | `/api/statistics/platform` | Admin/Mod | Thống kê nền tảng |
| | GET | `/api/statistics/uploads-over-time` | Admin/Mod | Biểu đồ uploads |
| **Logs** | GET | `/api/logs` | Admin/Mod | Logs hệ thống |
| **Categories** | GET | `/api/categories/subjects` | No | Danh sách môn học |
| | GET | `/api/categories/majors` | No | Danh sách ngành học |

---

## III. PRESENTATION — 10/10 điểm

### 8. Length of Presentation (5 điểm)

| Mức | Mô tả |
|:---:|-------|
| 1 | Too short |
| 2 | Too long |
| 3 | Have some focus in presentation time |
| **4** | **Well-control time of presentation** |

#### Khuyến nghị cấu trúc thuyết trình

| Phần | Thời gian (phút) | Nội dung |
|------|:-----------------:|----------|
| 1. Giới thiệu | 2-3 | Problem statement, mục tiêu dự án |
| 2. Kiến trúc | 3-4 | System architecture, tech stack, database design |
| 3. Demo | 8-10 | Demo tất cả chức năng chính theo từng role |
| 4. Kết luận | 2-3 | Tổng kết, hạn chế, hướng phát triển |

#### Thứ tự demo khuyến nghị

1. **Guest:** Xem trang chủ, tìm kiếm, lọc tài liệu
2. **User:** Đăng ký → Đăng nhập → Upload tài liệu → Xem chi tiết → Download → Chỉnh sửa profile
3. **Moderator:** Quản lý tài liệu, quản lý người dùng
4. **Admin:** Quản lý môn học/ngành, thống kê, logs, ủy quyền admin

### 9. Answer Audiences' and Teachers' Questions (5 điểm)

| Mức | Mô tả |
|:---:|-------|
| 1 | Cannot answer |
| 2 | Answer some |
| 3 | Answer most |
| **4** | **Answer and give more info** |

#### Câu hỏi thường gặp & gợi ý trả lời

| Câu hỏi | Gợi ý trả lời |
|----------|---------------|
| **Tại sao chọn NestJS?** | NestJS có kiến trúc module rõ ràng, hỗ trợ TypeScript native, dependency injection, guards/interceptors cho authentication, phù hợp cho dự án có nhiều module (auth, users, documents, admin). |
| **Tại sao chọn MongoDB thay vì SQL?** | Document-based storage phù hợp với tài liệu có cấu trúc linh hoạt (metadata khác nhau theo loại file). Schema-less giúp phát triển nhanh. Mongoose ODM cung cấp validation và type safety. |
| **JWT vs Session-based auth?** | JWT là stateless, không cần lưu session trên server, phù hợp cho REST API. Token chứa thông tin role để phân quyền nhanh mà không cần query database. |
| **Xử lý file upload như thế nào?** | Multer middleware xử lý multipart/form-data, lưu file lên disk (thư mục uploads/). File được serve tĩnh qua ServeStaticModule. Giới hạn 100MB, validate MIME type. |
| **Bảo mật như thế nào?** | Password hash bằng bcrypt (10 rounds). JWT với secret key. RolesGuard kiểm tra quyền truy cập. CORS configured. Input validation với class-validator. |
| **Cách phân quyền 3 roles?** | Custom @Roles() decorator + RolesGuard. JWT payload chứa role. Guard kiểm tra role trước khi cho phép truy cập endpoint. Frontend có AuthGuard và RoleGuard component. |
| **Scalability?** | MongoDB horizontal scaling (sharding). File storage có thể chuyển sang cloud (S3, Cloudinary). Stateless JWT cho phép load balancing. |

---

## IV. TỔNG KẾT ĐÁNH GIÁ

### Bảng điểm tổng hợp

| # | Tiêu chí | Thang điểm | Mức hiện tại | Điểm ước tính | Ghi chú |
|:-:|----------|:----------:|:------------:|:--------------:|---------|
| 1 | Functions | 15 | Mức 4 | **14-15** | Đầy đủ MVP |
| 2 | UI | 15 | Mức 3-4 | **12-14** | 12+ screens, thiết kế tốt |
| 3 | Source Control | 5 | Mức 3 | **3-4** | ⚠️ Chỉ 1 author |
| 4 | Problem Statement | 5 | — | **4-5** | Phụ thuộc báo cáo |
| 5 | Technical Terms | 5 | — | **4-5** | Phụ thuộc báo cáo |
| 6 | Requirement Analysis | 20 | — | **15-20** | Phụ thuộc báo cáo |
| 7 | System Analysis & Design | 25 | — | **18-25** | Phụ thuộc báo cáo |
| 8 | Presentation Length | 5 | — | **4-5** | Phụ thuộc thuyết trình |
| 9 | Q&A | 5 | — | **4-5** | Phụ thuộc thuyết trình |
| | **TỔNG** | **100** | | **78-98** | |

### Điểm mạnh

1. **Full-stack hoàn chỉnh** - Backend (NestJS) + Frontend (Next.js) đều triển khai đầy đủ
2. **Nhiều chức năng** - 26+ use cases, 40+ API endpoints
3. **UI/UX tốt** - 12+ screens, thiết kế nhất quán với Tailwind CSS
4. **Phân quyền rõ ràng** - 3 roles (USER, MODERATOR, ADMIN) với guards
5. **Kiến trúc module** - Code tổ chức tốt theo modules (NestJS)
6. **Thống kê** - Dashboard với biểu đồ Recharts
7. **File management** - Upload/Download/Preview đầy đủ

### Điểm cần cải thiện

| # | Vấn đề | Mức độ | Giải pháp |
|:-:|--------|:------:|-----------|
| 1 | **Source Control: Chỉ 1 author** | 🔴 Quan trọng | Các thành viên khác cần commit |
| 2 | Dark mode chưa tích hợp | 🟡 Nhỏ | Thêm ThemeProvider + toggle |
| 3 | Pagination UI chưa có | 🟡 Nhỏ | Thêm component phân trang |
| 4 | Report feature chỉ là placeholder | 🟡 Nhỏ | Implement nếu cần |

---

## V. THÔNG TIN TÀI KHOẢN TEST

| Vai trò | Email | Password |
|---------|-------|----------|
| Admin | admin@unishare.com | admin123 |
| Moderator | mod@phenikaa.edu.vn | password123 |
| User | nguyen.vana@phenikaa.edu.vn | password123 |

## VI. HƯỚNG DẪN CHẠY DỰ ÁN

### Backend
```bash
cd UniShare-BE-main
npm install
# Tạo file .env với DATABASE_URL, JWT_SECRET, API_URL
npm run seed:admin    # Tạo admin account
npm run seed:db       # Seed dữ liệu mẫu
npm run start:dev     # Chạy dev server (port 8000)
```

### Frontend
```bash
cd UniShare-FE-main/unishare-fe-main
npm install
# Tạo file .env.local với NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev           # Chạy dev server (port 3000)
```
