package vn.edu.it4409.expensetracker.expense.dto;

import java.math.BigDecimal;

/** Response GET /api/expenses/summary — { month: 'YYYY-MM', income, expense } */
public record MonthlySummaryDto(
        String month,
        BigDecimal income,
        BigDecimal expense
) {
}
