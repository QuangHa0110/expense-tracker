# 🌐 HƯỚNG DẪN DEPLOY — Expense Tracker (Spring Boot)

Hướng dẫn deploy **miễn phí** 3 thành phần: Frontend (Vercel) + Backend (Render) + Database (Neon).

## Sơ đồ kiến trúc deploy

```
        ┌─────────────────────┐
        │  Vercel (Frontend)  │  React SPA
        │  expense-tracker-   │
        │  <tên>.vercel.app   │
        └──────────┬──────────┘
                   │ HTTPS
                   │ VITE_API_URL = https://<api>.onrender.com/api
        ┌──────────▼──────────┐
        │  Render (Backend)   │  Spring Boot (Java 21)
        │  expense-tracker-   │  jar: target/*.jar
        │  api.onrender.com   │
        └──────────┬──────────┘
                   │ PostgreSQL connection string (sslmode=require)
        ┌──────────▼──────────┐
        │  Neon (Database)    │  PostgreSQL 16
        │  ep-xxx.aws.neon.   │
        │  tech               │
        └─────────────────────┘
```

---

## BƯỚC 1: Đẩy code lên GitHub

```bash
cd "/d/Thạc sỹ/Công nghệ Web và Dịch vụ trực tuyến/bai-tap-cuoi-ky"
git init   # nếu chưa có
git add .
git commit -m "Expense Tracker: React + Spring Boot + PostgreSQL"
git branch -M main
git remote add origin https://github.com/<username>/expense-tracker.git
git push -u origin main
```

> ⚠️ Kiểm tra `.env` KHÔNG bị đẩy lên (đã trong `.gitignore`). Chỉ có `.env.example`.

---

## BƯỚC 2: Database — Neon (free, không mất dữ liệu)

1. Vào https://neon.tech → Sign up (GitHub/Google) → **Create project**
2. Region: gần VN nhất (**Singapore**)
3. Copy **connection string** dạng:
   ```
   postgresql://neondb_owner:***@ep-xxx-xxxx.aws.neon.tech/neondb?sslmode=require
   ```
4. Lưu lại — dán vào Render ở bước sau

---

## BƯỚC 3: Backend — Render (free tier, dùng Docker)

> ⚠️ **Quan trọng:** Render **KHÔNG hỗ trợ native Java runtime** — chỉ hỗ trợ Node.js/Bun, Python, Ruby, Go, Rust, Elixir. Java/Kotlin/Scala phải deploy bằng **Docker image**. Repo đã có sẵn `Dockerfile` (multi-stage: build Maven → runtime JRE 21), Render sẽ tự build.

1. https://render.com → Sign up → **New** → **Web Service**
2. Connect GitHub repo → chọn repo
   (Nếu repo gồm cả FE+BE, dùng **Root Directory**: `expense-tracker-backend`)
3. Cấu hình:

   | Field | Giá trị |
   |-------|--------|
   | Runtime | **Docker** |
   | Root Directory | `expense-tracker-backend` |
   | Dockerfile Path | `Dockerfile` (để trống nếu ở root của root directory) |
   | Instance Type | Free |

   > Render nhận diện Dockerfile và tự build image — KHÔNG cần Build/Start Command.

4. **Environment Variables** (Environment tab):

   ```
   DATABASE_URL = <connection string Neon ở bước 2>
   DB_USERNAME  = <user Neon, vd: neondb_owner>
   DB_PASSWORD  = <password Neon>
   JWT_SECRET   = <chuỗi dài ngẫu nhiên, vd: xK9!pQ2#mZ7@vR4$tW8^yB5&nC3*eF6>
   CORS_ORIGIN  = http://localhost:5173  (tạm; đổi thành domain Vercel ở bước 5)
   PORT         = 8080
   ```

   > 💡 Nếu dùng Render Postgres (trả phí) thay Neon, có thể bỏ `DB_USERNAME`/`DB_PASSWORD` — nhưng Neon free là đủ.

5. Deploy → chờ ~5-8 phút (build Docker lâu hơn native) → copy URL (vd: `https://expense-tracker-api.onrender.com`)
6. **Kiểm tra:** mở `https://expense-tracker-api.onrender.com/api/auth/login` (sẽ trả 400/405 — nghĩa là API sống)

---

## BƯỚC 4: Frontend — Vercel (free)

1. https://vercel.com → Sign up → **Add New** → **Project**
2. Import GitHub repo → chọn thư mục `expense-tracker-frontend`
3. Framework Preset: **Vite** (Vercel tự nhận diện)
4. **Environment Variables:**

   ```
   VITE_API_URL = https://expense-tracker-api.onrender.com/api
   ```

5. Deploy → copy domain (vd: `https://expense-tracker.vercel.app`)

---

## BƯỚC 5: Nối 2 mảnh lại

1. Về Render → Environment → sửa:
   ```
   CORS_ORIGIN = https://expense-tracker.vercel.app
   ```
2. Deploy lại (Render tự restart khi sửa env)

---

## BƯỚC 6: Test end-to-end trên link public

Mở `https://expense-tracker.vercel.app` và test ĐỦ các luồng:

- [ ] Đăng ký tài khoản mới → tự vào dashboard
- [ ] Đăng xuất → đăng nhập lại
- [ ] Đăng nhập sai mật khẩu → báo lỗi
- [ ] Thêm khoản chi (tiếng Việt có dấu)
- [ ] Sửa khoản chi
- [ ] Xóa khoản chi
- [ ] Lọc theo danh mục + tháng
- [ ] Xem biểu đồ
- [ ] Mở bằng điện thoại → giao diện card (responsive)
- [ ] Tạo user thứ 2 → xác nhận KHÔNG thấy dữ liệu user 1

---

## Tài khoản demo (ghi vào PDF nộp bài)

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| User demo | `demo@test.com` | `Demo@123` |

> Sau khi deploy, user demo chưa có dữ liệu (DB mới). Đăng nhập bằng tài khoản demo và thêm vài khoản chi, hoặc đăng ký tài khoản mới — đều được.

---

## XỬ LÝ LỖI THƯỜNG GẶP KHI DEPLOY

| Triệu chứng | Nguyên nhân | Cách sửa |
|-------------|-------------|----------|
| FE báo CORS error | CORS_ORIGIN chưa đúng | Sửa CORS_ORIGIN trên Render = đúng domain Vercel |
| Login trả 500 | DATABASE_URL sai / thiếu DB_USERNAME, DB_PASSWORD | Kiểm tra lại connection string Neon (có `?sslmode=require`) |
| FE tải nhưng trắng | VITE_API_URL thiếu `/api` | Sửa env trên Vercel → Redeploy |
| Render build lỗi | Root Directory sai | Chỉ rõ `expense-tracker-backend` |
| Render build lỗi Maven | Java version sai | Đảm bảo Dockerfile dùng JDK 21 (pom yêu cầu) — Dockerfile đã set `maven:3.9.9-eclipse-temurin-21` |
| Render không có Runtime Java | Chọn nhầm native runtime | Chọn Runtime = **Docker** (Render chỉ native-support Node/Python/Ruby/Go/Rust/Elixir) |
| 404 khi vào /register | — | Vercel tự xử lý SPA fallback cho Vite; nếu lỗi thêm `vercel.json` với `{"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]}` |
| DB bị xóa khi restart | Dùng SQLite thay vì Postgres | Chuyển sang Neon (persistent) |
| Backend chạy nhưng trỏ nhầm DB cũ | Thiếu env DATABASE_URL khi chạy jar | Set đủ `DATABASE_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGIN` |

---

## Chi phí

| Dịch vụ | Chi phí |
|---------|---------|
| Vercel | Free (Hobby) |
| Render | Free (Web Service ngủ sau 15 phút không truy cập — lần mở đầu hơi chậm, ~30s) |
| Neon | Free (0.5GB storage) |
| **Tổng** | **0đ** |

> 💡 Mẹo demo: trước khi vấn đáp, mở link demo 1 lần để Render "đánh thức" (warm up), tránh lần mở đầu bị chậm.
