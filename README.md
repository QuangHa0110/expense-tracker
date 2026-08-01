# 💰 Expense Tracker — IT4409 Bài tập cuối kỳ (20252)

Ứng dụng web **quản lý chi tiêu cá nhân** — đồ án cuối kỳ môn **IT4409 - Công nghệ Web và Dịch vụ trực tuyến**.

## 🚀 Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 + React Router + Axios + Recharts |
| Backend | Spring Boot 4 (Java 21) + Spring Security + Spring Data JPA |
| Database | PostgreSQL 16 |
| Xác thực | JWT (jjwt 0.12) + BCrypt |
| Deploy | Vercel (FE) + Render (BE) + Neon (DB) |

## ✨ Chức năng

### Yêu cầu bắt buộc của đề
- ✅ **CRUD đầy đủ**: Tạo, Xem danh sách, Xem chi tiết, Sửa, Xóa khoản chi
- ✅ **Dữ liệu gắn userId**: mỗi user chỉ thấy dữ liệu của chính mình (kiểm tra ownership ở backend, trả 404 nếu không thuộc về user)
- ✅ **Trường phân loại**: category (8 loại chi + 6 loại thu) + lọc theo tháng
- ✅ **Responsive**: bảng trên desktop, thẻ (card) trên mobile
- ✅ **Validate dữ liệu**: cả frontend (form) lẫn backend (Bean Validation `@Valid`)
- ✅ **Xử lý lỗi tập trung**: `@RestControllerAdvice` (backend) + Axios Interceptor (frontend)
- ✅ **HTTP status phù hợp**: 200/201/204/400/401/404/409/500

### Tính năng mở rộng
- 📊 Biểu đồ thu - chi theo tháng (Recharts)
- 💳 Phương thức thanh toán (tiền mặt / thẻ / chuyển khoản)
- 📝 Ghi chú cho từng khoản chi
- 🗂️ Dashboard tách 2 tab: **Tổng quan** (số liệu + biểu đồ) và **Giao dịch** (danh sách + bộ lọc)

## 🏗️ Kiến trúc

```
Browser (React SPA)
    │  HTTPS + JWT (Authorization: Bearer <token>)
    ▼
REST API (Spring Boot) — context-path /api
 ├─ AuthController   : POST /api/auth/register, /api/auth/login (public)
 ├─ ExpenseController: CRUD /api/expenses (lọc theo userId từ JWT)
 │    ├─ Bean Validation (@Valid)       → 400
 │    ├─ JwtAuthenticationFilter        → 401
 │    └─ GlobalExceptionHandler         → JSON lỗi thống nhất
 ▼
PostgreSQL
 ├─ users    (id, email, name, password_hash, ...)
 └─ expenses (id, title, amount decimal(12,2), category, date, payment_method, user_id → users.id)
```

## 🔌 API Endpoints

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/register` | Đăng ký (201) | ❌ |
| POST | `/api/auth/login` | Đăng nhập → JWT (200) | ❌ |
| GET | `/api/expenses` | Danh sách + filter `?type=&category=&month=&page=&limit=` | ✅ |
| GET | `/api/expenses/summary` | Tổng thu/chi theo tháng `?year=` | ✅ |
| GET | `/api/expenses/:id` | Chi tiết | ✅ |
| POST | `/api/expenses` | Tạo mới (201) | ✅ |
| PATCH | `/api/expenses/:id` | Sửa | ✅ |
| DELETE | `/api/expenses/:id` | Xóa (204) | ✅ |

> Lưu ý: `type=income|expense`, `category` (food, transport, housing, entertainment, health, education, shopping, other, salary, bonus, interest, investment, gift, other_income), `month=YYYY-MM`, `paymentMethod` (cash, card, bank_transfer).

## 🧑‍💻 Hướng dẫn chạy local

### Yêu cầu
- Node.js ≥ 20 (frontend)
- Java 21 + Maven (backend)
- PostgreSQL 16 (hoặc Docker)

### 1. Database (Docker)

```bash
docker run --name expense-tracker-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=expense_tracker \
  -p 5432:5432 -d postgres:16-alpine
```

### 2. Backend (Spring Boot)

```bash
cd expense-tracker-backend
cp .env.example .env   # sửa DATABASE_URL / JWT_SECRET / CORS_ORIGIN nếu cần

# Cách 1: chạy bằng Maven wrapper (tự tải Maven + JDK phù hợp)
./mvnw spring-boot:run

# Cách 2: build jar rồi chạy
./mvnw package
java -jar target/expense-tracker-backend-0.0.1-SNAPSHOT.jar
```

Backend chạy tại `http://localhost:8080/api` (hoặc `$PORT` nếu set).

> ⚠️ Nếu chạy bằng `java -jar`, phải set env `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN` — thiếu sẽ trỏ nhầm DB cũ / secret mặc định.

### 3. Frontend

```bash
cd expense-tracker-frontend
cp .env.example .env   # VITE_API_URL=http://localhost:8080/api
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

Xem chi tiết: **[HUONG_DAN_DEPLOY.md](HUONG_DAN_DEPLOY.md)**

Tóm tắt:
- **Backend** → Render (Web Service): Runtime = **Docker** (Render không native-support Java), build từ `Dockerfile` (multi-stage: Maven build → JRE 21), env `DATABASE_URL` (Neon) + `DB_USERNAME` + `DB_PASSWORD` + `JWT_SECRET` + `CORS_ORIGIN` + `PORT=8080`
- **Database** → Neon (PostgreSQL 16 free)
- **Frontend** → Vercel (Framework: Vite), env `VITE_API_URL=https://<api>.onrender.com/api`

## 📁 Cấu trúc thư mục

```
bai-tap-cuoi-ky/
├── expense-tracker-backend/          # Spring Boot API
│   └── src/main/java/vn/edu/it4409/expensetracker/
│       ├── auth/                     # Đăng ký, đăng nhập, JWT, filter
│       ├── user/                     # Entity + service User
│       ├── expense/                  # Entity + DTO + repository + service + controller
│       ├── security/                 # SecurityConfig, JwtService, JwtAuthenticationFilter
│       ├── common/                   # GlobalExceptionHandler, ApiError
│       └── ExpenseTrackerBackendApplication.java
├── expense-tracker-frontend/         # React SPA
│   └── src/
│       ├── api/                      # Axios client + interceptor + API calls
│       ├── components/               # Alert, ExpenseChart, Modal, Toast, ProtectedRoute
│       ├── context/                  # AuthContext (login/logout state)
│       ├── pages/                    # Login, Register, Dashboard
│       └── App.tsx                   # Router
├── README.md
├── HUONG_DAN_DEPLOY.md               # Hướng dẫn deploy chi tiết
└── ON_TAP_VAN_DAP.md                 # Ôn tập vấn đáp
```
