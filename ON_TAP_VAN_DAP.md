# 🎤 ÔN VẤN ĐÁP IT4409 — Expense Tracker

Tài liệu này giúp bạn trả lời trôi chảy các câu hỏi khả năng cao nhất trong buổi vấn đáp.
Đọc kỹ, **tự nói to** từng câu trả lời 1-2 lần trước khi thi.

---

## CÂU 1: JWT là gì? Token hết hạn thì xử lý thế nào?

**Trả lời:**
JWT (JSON Web Token) là một chuỗi gồm 3 phần: header.payload.signature.
- Header: thuật toán ký (HS256)
- Payload: dữ liệu — trong project của em chứa `sub` (userId), `email`, `name`, `exp` (thời gian hết hạn)
- Signature: chữ ký được tạo bằng secret key (JWT_SECRET) — đảm bảo token không bị sửa

Luồng hoạt động:
1. User đăng nhập → server verify password (bcrypt.compare) → ký token → trả về client
2. Client lưu token trong localStorage, gửi kèm mỗi request qua header `Authorization: Bearer <token>`
3. Server (JwtStrategy) verify chữ ký + kiểm tra `exp`. Hợp lệ → cho qua; hết hạn/sai → 401

**Khi token hết hạn (401):** frontend có Axios interceptor bắt lỗi 401 → xóa token khỏi localStorage → chuyển về trang /login. User đăng nhập lại để nhận token mới. Token em cấu hình hết hạn sau 1 ngày (`expiresIn: '1d'`).

**Điểm cộng khi bị hỏi sâu:** "Tại sao không lưu token trong cookie?" → vì SPA dùng localStorage đơn giản hơn, và CORS + Bearer header dễ cấu hình hơn cookie với domain khác nhau.

---

## CÂU 2: Làm sao user A không xóa được expense của user B?

**Trả lời:**
Có 3 lớp bảo vệ:
1. **userId không bao giờ lấy từ client** — luôn lấy từ token đã verify (`AuthUser` = { id, email, name } lấy từ JWT). Client gửi userId=5 trong body cũng bị bỏ qua vì DTO không khai báo field userId (Jackson bỏ qua field lạ, hoặc trả 400 nếu bật fail-on-unknown).
2. **Mọi query đều có WHERE userId**: 
   - List: repository method `findByUserId` — user chỉ thấy dữ liệu của mình
   - Detail/Update/Delete: `findByUserIdAndId(userId, id)` — phải khớp CẢ userId LẪN id
3. **Trả 404 thay vì 403**: nếu không tìm thấy bản ghi thuộc về user → `ExpenseNotFoundException` (404). Lý do: không tiết lộ cho kẻ tấn công biết rằng expense đó tồn tại.

**Demo nói:** "Thầy có thể đăng nhập user B, gọi DELETE /api/expenses/1 (expense của user A) — sẽ nhận 404."

---

## CÂU 3: Password lưu trong DB thế nào?

**Trả lời:**
- Không bao giờ lưu plaintext. Dùng **bcrypt** với 10 salt rounds: `bcrypt.hash(password, 10)`
- Lưu hash vào cột `password` của bảng users. Hash là chuỗi không đảo ngược được
- Khi login: `bcrypt.compare(password, hash)` — so sánh an toàn, không cần (và không thể) giải mã hash
- Salt tự động sinh ngẫu nhiên mỗi lần hash → 2 user cùng mật khẩu vẫn có hash khác nhau

**Bị hỏi thêm:** "Tại sao cần salt?" → chống rainbow table attack (bảng tra cứu hash sẵn có).

---

## CÂU 4: Client gửi userId=1 trong body thì sao?

**Trả lời:**
Bị bỏ qua vì 2 lý do:
1. DTO `CreateExpenseDto` **không khai báo** field userId → Jackson bỏ qua field lạ khi deserialize (mặc định), backend không bao giờ đọc nó
2. Backend tự gán `userId` từ `AuthUser` (lấy từ token): `expenseService.create(authUser.id(), dto)` — dữ liệu client không bao giờ quyết định chủ sở hữu

**Nguyên tắc:** không bao giờ tin dữ liệu client về phân quyền. Chỉ tin token đã verify.

---

## CÂU 5: Validate ở FE và BE khác nhau gì? Vì sao cần cả 2?

**Trả lời:**
- **Frontend (React):** validate để UX tốt — báo lỗi ngay khi nhập/sumbit, không cần chờ server. VD: required, email format, số tiền > 0. Có thể bị vô hiệu hóa (tắt JS, sửa DevTools) nên không an toàn.
- **Backend (Spring Boot + Bean Validation):** validate để BẢO MẬT và toàn vẹn dữ liệu — bắt buộc, không thể bypass. Annotation trên DTO: `@Email`, `@Size(min=6)`, `@Pattern` (category hợp lệ), `@DecimalMin("0.01")`... Sai → Spring trả **400 Bad Request** kèm message qua `MethodArgumentNotValidException` → `GlobalExceptionHandler`.

**Kết luận:** FE validate cho người dùng, BE validate cho hệ thống. Cần cả 2.

---

## CÂU 6: 401 vs 403 khác nhau thế nào?

**Trả lời:**
- **401 Unauthorized:** chưa xác thực — không có token / token sai / hết hạn. "Mày là ai?" → chưa đăng nhập thì không được vào. VD: gọi `/api/expenses` không kèm token → 401
- **403 Forbidden:** đã xác thực nhưng KHÔNG CÓ QUYỀN. "Mày là ai rồi nhưng không được làm cái này." VD: user thường gọi API admin

**Lưu ý đặc biệt:** trong đồ án này, khi user B cố truy cập expense của user A, em **cố tình trả 404** thay vì 403 — để không tiết lộ sự tồn tại của dữ liệu (an toàn hơn, tránh bị dò quét).

---

## CÂU 7: CORS là gì? Tại sao FE gọi BE bị chặn?

**Trả lời:**
CORS (Cross-Origin Resource Sharing) là cơ chế của trình duyệt: một trang web ở origin A (domain + port) không được tự do gọi API ở origin B, trừ khi server B khai báo cho phép.

VD: FE chạy ở `http://localhost:5173`, BE ở `http://localhost:3000` — 2 origin khác nhau (khác port). Trình duyệt chặn request nếu BE không gửi header `Access-Control-Allow-Origin`.

**Giải pháp trong project:** `SecurityConfig` đọc `CORS_ORIGIN` (env) → `CorsConfigurationSource` khai báo rõ domain FE được phép. Khi deploy: CORS_ORIGIN = domain Vercel.

**Bị hỏi thêm:** "CORS có phải là tường lửa không?" → Không. CORS chỉ là quy tắc của trình duyệt; gọi bằng curl/Postman không bị chặn.

---

## CÂU 8: Biến môi trường (.env) quản lý thế nào?

**Trả lời:**
- File `.env` chứa cấu hình nhạy cảm: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`
- **Không commit** `.env` lên GitHub — đã thêm vào `.gitignore`. Commit bản mẫu `.env.example` (không có giá trị thật) để người khác biết cần cấu hình gì
- Backend dùng Spring Boot đọc cấu hình từ biến môi trường qua `application.properties` (cú pháp `${ENV:default}`) — VD `spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/expense_tracker}`
- Khi deploy lên Render: dán biến môi trường vào dashboard của Render (Environment tab), không cần file .env trên server
- JWT_SECRET phải là chuỗi dài ngẫu nhiên, khác nhau giữa dev và production

---

## CÂU 9: SQL injection và XSS được phòng chống thế nào?

**Trả lời:**
**SQL Injection** (chèn mã SQL độc hại vào query):
- Spring Data JPA dùng **parameterized query** — giá trị được truyền qua tham số, không nối chuỗi trực tiếp vào SQL
- VD an toàn: `expenseRepository.findByUserIdAndId(userId, id)` → JPA tạo `WHERE user_id = ? AND id = ?` — giá trị không bao giờ được coi là mã SQL

**XSS** (chèn script độc hại):
- React **tự escape** mọi giá trị render trong JSX — `{exp.title}` hiển thị dạng text, không chạy như HTML
- Không dùng `dangerouslySetInnerHTML` trong project

---

## CÂU 10 (LIVE-CODE): Thêm trường "địa điểm" (location) cho expense — sửa những file nào?

**Trả lời (trình tự đúng):**

**Backend (3 file):**
1. `Expense.java` → thêm `@Column(length = 100) private String location;` (nullable mặc định = true)
2. `CreateExpenseDto.java` → thêm `@Size(max = 100) String location;` (nullable → optional)
3. `ExpenseDto.java` → thêm field `location` để trả về client

**Frontend (2 file):**
4. `api/expenses.ts` → thêm `location?: string` vào interface Expense + ExpenseInput
5. `pages/DashboardPage.tsx` → thêm input "Địa điểm" vào form, thêm field vào `form` state, thêm vào payload khi submit, hiển thị trong bảng/card

**Điểm cộng khi nói:** "Sửa DTO trước entity cũng được, nhưng em làm theo thứ tự entity → DTO → API → UI để không quên field nào."

---

## CÂU HỎI PHỤ (nếu còn thời gian)

| Câu hỏi | Ý chính trả lời |
|---------|-----------------|
| Vì sao dùng Spring Boot mà không Express thuần? | Spring Boot có cấu trúc module + DI (IoC) + annotation, tích hợp sẵn Spring Security, Bean Validation, ExceptionHandler → code chuẩn, ít lỗi, dễ bảo trì |
| Vì sao cột amount là string? | Postgres decimal trả về string để không mất số thập phân (JS number không chính xác với số lớn) |
| Synchronize: true có an toàn không? | Chỉ dùng cho dev/demo. Production nên dùng migration (Flyway/Liquibase hoặc ddl-auto=validate) |
| Vì sao phân trang? | Tránh tải toàn bộ dữ liệu — `page`/`limit` (Spring Data: Pageable) |
| Dữ liệu xóa mềm hay cứng? | Cứng (`repository.remove`) — phù hợp quy mô đồ án. Nếu cần lịch sử thì thêm cột `deletedAt` (soft delete) |
| Biểu đồ dữ liệu từ đâu? | Endpoint `/api/expenses/summary?year=` — GROUP BY tháng, SUM(amount). Chỉ tính cho user đang đăng nhập |

---

## MẸO VẤN ĐÁP

1. **Nói theo cấu trúc:** khái niệm → luồng hoạt động → code trong project → (demo nếu được)
2. **Nếu không biết:** "Em chưa tìm hiểu kỹ phần này, nhưng em nghĩ là..." — đừng im lặng
3. **Đừng nói xấu công nghệ khác** (vd "React dở hơn Angular") — nói "em chọn X vì phù hợp yêu cầu"
4. **Chỉ vào code khi trả lời** — mở sẵn IDE/file liên quan trong lúc thi
5. **Demo là vũ khí:** thuộc lòng luồng register → login → thêm → sửa → xóa → filter → xem chart

Chúc bạn đạt điểm cao! 🍀
