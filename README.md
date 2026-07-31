# 💰 Expense Tracker — IT4409 Bài tập cuối kỳ (20252)

Ứng dụng web **quản lý chi tiêu cá nhân** — đồ án cuối kỳ môn **IT4409 - Công nghệ Web và Dịch vụ trực tuyến**.

## 🚀 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router + Axios + Recharts |
| Backend | NestJS 11 + TypeScript + TypeORM |
| Database | PostgreSQL 16 |
| Xác thực | JWT (passport-jwt) + bcrypt |
| Deploy | Vercel (FE) + Render (BE) + Neon (DB) |

## ✨ Chức năng

### Yêu cầu bắt buộc của đề
- ✅ **CRUD đầy đủ**: Tạo, Xem danh sách, Xem chi tiết, Sửa, Xóa khoản chi
- ✅ **Dữ liệu gắn userId**: mỗi user chỉ thấy dữ liệu của chính mình (kiểm tra ownership ở backend, trả 404 nếu không thuộc về user)
- ✅ **Trường phân loại**: category (8 loại) + lọc theo tháng
- ✅ **Responsive**: bảng trên desktop, thẻ (card) trên mobile
- ✅ **Validate dữ liệu**: cả frontend (form) lẫn backend (class-validator)
- ✅ **Xử lý lỗi tập trung**: Global Exception Filter (backend) + Axios Interceptor (frontend)
- ✅ **HTTP status phù hợp**: 200/201/204/400/401/404/409/500

### Tính năng mở rộng
- 📊 Biểu đồ tổng chi tiêu theo tháng (Recharts)
- 💳 Phương thức thanh toán (tiền mặt/thẻ/chuyển khoản)
- 📝 Ghi chú cho từng khoản chi

## 🏗️ Kiến trúc

```
Browser (React SPA)
    │  HTTPS + JWT (Authorization: Bearer <token>)
    ▼
REST API (NestJS)
 ├─ AuthModule     : POST /api/auth/register, /api/auth/login
 ├─ ExpensesModule : CRUD /api/expenses (lọc theo userId từ token)
 │    ├─ ValidationPipe (class-validator) → 400
 │    ├─ JwtAuthGuard → 401
 │    └─ AllExceptionsFilter → JSON lỗi thống nhất
 ▼
PostgreSQL
 ├─ users    (id, email, name, password_hash, ...)
 └─ expenses (id, title, amount, category, date, userId → users.id)
```

## 🔌 API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký (201) | ❌ |
| POST | `/api/auth/login` | Đăng nhập → JWT (200) | ❌ |
| GET | `/api/expenses` | Danh sách + filter `?category=&month=&page=&limit=` | ✅ |
| GET | `/api/expenses/summary` | Tổng chi theo tháng `?year=` | ✅ |
| GET | `/api/expenses/:id` | Chi tiết | ✅ |
| POST | `/api/expenses` | Tạo mới (201) | ✅ |
| PATCH | `/api/expenses/:id` | Sửa | ✅ |
| DELETE | `/api/expenses/:id` | Xóa (204) | ✅ |

## 🧑‍💻 Hướng dẫn chạy local

### Yêu cầu
- Node.js ≥ 20
- PostgreSQL 16 (hoặc Docker)

### 1. Database (Docker)
```bash
docker run --name expense-tracker-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=expense_tracker \
  -p 5432:5432 -d postgres:16-alpine
```

### 2. Backend
```bash
cd expense-tracker-backend
cp .env.example .env   # sửa DATABASE_URL nếu cần
npm install
npm run start:dev      # http://localhost:3000/api
```

### 3. Frontend
```bash
cd expense-tracker-frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000/api
npm install
npm run dev            # http://localhost:5173
```

Mở `http://localhost:5173` → Đăng ký tài khoản → Bắt đầu sử dụng.

## 🔐 Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| User A | `demo@test.com` | `Demo@123` |
| User B | `userb@test.com` | `Demo@123` |

## 🌐 Deploy

### Backend (Render)
1. Tạo repo GitHub, push code `expense-tracker-backend/`
2. Render → New Web Service → chọn repo
3. Build: `npm install && npm run build` — Start: `node dist/main.js`
4. Environment variables:
   - `DATABASE_URL` = connection string Neon
   - `JWT_SECRET` = chuỗi bí mật dài
   - `CORS_ORIGIN` = domain frontend trên Vercel
5. Deploy xong → copy URL (vd: `https://expense-tracker-api.onrender.com`)

### Database (Neon)
1. Đăng ký https://neon.tech → New Project
2. Copy connection string vào `DATABASE_URL` của Render

### Frontend (Vercel)
1. Push code `expense-tracker-frontend/` lên GitHub
2. Vercel → Import repo → Framework: Vite
3. Env: `VITE_API_URL=https://expense-tracker-api.onrender.com/api`
4. Deploy xong → copy domain (vd: `https://expense-tracker.vercel.app`)
5. Cập nhật lại `CORS_ORIGIN` trên Render = domain Vercel

## 📁 Cấu trúc thư mục

```
bai-tap-cuoi-ky/
├── expense-tracker-backend/          # NestJS API
│   └── src/
│       ├── auth/                     # Đăng ký, đăng nhập, JWT strategy, guard
│       ├── users/                    # Entity + service User
│       ├── expenses/                 # Entity + DTO + service + controller
│       ├── common/filters/           # Global Exception Filter
│       ├── app.module.ts             # Root module (TypeORM, Config)
│       └── main.ts                   # Bootstrap (CORS, ValidationPipe, prefix /api)
└── expense-tracker-frontend/         # React SPA
    └── src/
        ├── api/                      # Axios client + interceptor + API calls
        ├── components/               # Alert, ProtectedRoute, ExpenseChart
        ├── context/                  # AuthContext (login/logout state)
        ├── pages/                    # Login, Register, Dashboard
        └── App.tsx                   # Router
```
