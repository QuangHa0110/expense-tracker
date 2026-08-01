package vn.edu.it4409.expensetracker.expense;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Entity Expense — bảng expenses (khoản thu/chi của user).
 * Cột userId là FOREIGN KEY trỏ tới users.id, ON DELETE CASCADE.
 * Giữ đúng tên cột JSON mà frontend mong đợi: userId, paymentMethod, createdAt, updatedAt.
 * Tương ứng expense.entity.ts của bản NestJS.
 */
@Entity
@Table(
    name = "expenses",
    indexes = {
        @Index(name = "idx_expenses_user_id", columnList = "user_id"),
        @Index(name = "idx_expenses_user_date", columnList = "user_id, date")
    }
)
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    /** decimal(12,2) — dùng BigDecimal để không mất số thập phân */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Loại giao dịch: income (thu) hoặc expense (chi) — mặc định expense để tương thích dữ liệu cũ */
    @Column(nullable = false, length = 10)
    private String type = "expense";

    /** Trường phân loại — yêu cầu bắt buộc của đề */
    @Column(nullable = false, length = 50)
    private String category;

    /** YYYY-MM-DD */
    @Column(nullable = false)
    private LocalDate date;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "payment_method", nullable = false, length = 20)
    private String paymentMethod = "cash";

    /** FK tới users.id — KHÔNG bao giờ nhận từ body, luôn lấy từ JWT */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
