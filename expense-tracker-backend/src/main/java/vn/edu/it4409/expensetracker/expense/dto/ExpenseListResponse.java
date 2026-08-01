package vn.edu.it4409.expensetracker.expense.dto;

import java.util.List;

/** Response GET /api/expenses — giữ đúng shape frontend: { items, total, page, limit } */
public record ExpenseListResponse(
        List<ExpenseDto> items,
        long total,
        int page,
        int limit
) {
}
