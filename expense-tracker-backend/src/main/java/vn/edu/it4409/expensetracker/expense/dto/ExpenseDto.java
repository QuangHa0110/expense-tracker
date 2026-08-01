package vn.edu.it4409.expensetracker.expense.dto;

import java.math.BigDecimal;
import java.time.Instant;
import vn.edu.it4409.expensetracker.expense.Expense;

/**
 * DTO trả về của Expense — giữ đúng field frontend mong đợi:
 * { id, title, amount (string!), type, category, date, note, paymentMethod, userId, createdAt, updatedAt }
 * amount serialize dạng STRING (giống Postgres decimal trả về string) để frontend không bị mất số.
 */
public record ExpenseDto(
        Long id,
        String title,
        String amount,
        String type,
        String category,
        String date,
        String note,
        String paymentMethod,
        Long userId,
        Instant createdAt,
        Instant updatedAt
) {

    public static ExpenseDto from(Expense e) {
        return new ExpenseDto(
                e.getId(),
                e.getTitle(),
                e.getAmount() == null ? null : e.getAmount().toPlainString(),
                e.getType(),
                e.getCategory(),
                e.getDate() == null ? null : e.getDate().toString(),
                e.getNote(),
                e.getPaymentMethod(),
                e.getUserId(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
