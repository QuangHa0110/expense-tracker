package vn.edu.it4409.expensetracker.expense.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

/**
 * Query params cho GET /api/expenses — ?category=&month=&page=&limit=
 * month định dạng YYYY-MM.
 * Không dùng @Valid trên record này (params không bắt buộc), chỉ ràng buộc khi có giá trị.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ExpenseQuery(
        @Pattern(regexp = "income|expense", message = "Loại giao dịch không hợp lệ")
        String type,

        @Pattern(regexp = "food|transport|housing|entertainment|health|education|shopping|other|salary|bonus|interest|investment|gift|other_income",
                 message = "Danh mục không hợp lệ")
        String category,

        @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Tháng không đúng định dạng YYYY-MM")
        String month,

        @Min(value = 1, message = "page phải >= 1")
        Integer page,

        @Min(value = 1, message = "limit phải >= 1")
        @Max(value = 100, message = "limit tối đa 100")
        Integer limit
) {

    public int pageOrDefault() {
        return page == null ? 1 : page;
    }

    public int limitOrDefault() {
        return limit == null ? 20 : limit;
    }
}
