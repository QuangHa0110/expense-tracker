package vn.edu.it4409.expensetracker.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/** Tương ứng CreateExpenseDto.ts — POST /api/expenses */
public record CreateExpenseDto(
        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
        String title,

        @NotNull(message = "Số tiền không được để trống")
        @DecimalMin(value = "1", message = "Số tiền phải lớn hơn 0")
        BigDecimal amount,

        @Pattern(regexp = "income|expense", message = "Loại giao dịch không hợp lệ")
        String type,

        @NotBlank(message = "Danh mục không được để trống")
        @Pattern(regexp = "food|transport|housing|entertainment|health|education|shopping|other|salary|bonus|interest|investment|gift|other_income",
                 message = "Danh mục không hợp lệ")
        String category,

        @NotBlank(message = "Ngày không được để trống")
        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Ngày không đúng định dạng YYYY-MM-DD")
        String date,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String note,

        @Pattern(regexp = "cash|card|bank_transfer", message = "Phương thức thanh toán không hợp lệ")
        String paymentMethod
) {
}
