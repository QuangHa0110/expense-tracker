package vn.edu.it4409.expensetracker.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Tương ứng UpdateExpenseDto.ts (PartialType<CreateExpenseDto>).
 * Mọi field đều OPTIONAL — chỉ gửi field muốn sửa (PATCH).
 */
public record UpdateExpenseDto(
        @Size(max = 200, message = "Tiêu đề tối đa 200 ký tự")
        String title,

        @DecimalMin(value = "1", message = "Số tiền phải lớn hơn 0")
        java.math.BigDecimal amount,

        @Pattern(regexp = "income|expense", message = "Loại giao dịch không hợp lệ")
        String type,

        @Pattern(regexp = "food|transport|housing|entertainment|health|education|shopping|other|salary|bonus|interest|investment|gift|other_income",
                 message = "Danh mục không hợp lệ")
        String category,

        @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "Ngày không đúng định dạng YYYY-MM-DD")
        String date,

        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String note,

        @Pattern(regexp = "cash|card|bank_transfer", message = "Phương thức thanh toán không hợp lệ")
        String paymentMethod
) {
}
