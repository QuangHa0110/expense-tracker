package vn.edu.it4409.expensetracker.expense;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.it4409.expensetracker.expense.dto.CreateExpenseDto;
import vn.edu.it4409.expensetracker.expense.dto.ExpenseDto;
import vn.edu.it4409.expensetracker.expense.dto.ExpenseListResponse;
import vn.edu.it4409.expensetracker.expense.dto.ExpenseQuery;
import vn.edu.it4409.expensetracker.expense.dto.MonthlySummaryDto;
import vn.edu.it4409.expensetracker.expense.dto.UpdateExpenseDto;

/**
 * Tương đương ExpensesService của NestJS.
 * Điểm mấu chốt: userId LUÔN lấy từ JWT (AuthUser), không bao giờ từ body —
 * user chỉ thấy/thao tác dữ liệu của chính mình.
 */
@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    /** Tạo giao dịch mới — userId từ token, type mặc định expense nếu không gửi */
    @Transactional
    public ExpenseDto create(Long userId, CreateExpenseDto dto) {
        Expense expense = new Expense();
        expense.setTitle(dto.title());
        expense.setAmount(dto.amount());
        expense.setType(dto.type() == null ? "expense" : dto.type());
        expense.setCategory(dto.category());
        expense.setDate(parseDate(dto.date()));
        expense.setNote(dto.note());
        expense.setPaymentMethod(dto.paymentMethod() == null ? "cash" : dto.paymentMethod());
        expense.setUserId(userId);
        return ExpenseDto.from(expenseRepository.save(expense));
    }

    /**
     * Danh sách giao dịch của MỘT user, filter type/category/month + phân trang.
     * Sort: date DESC, id DESC (giống NestJS).
     */
    @Transactional(readOnly = true)
    public ExpenseListResponse findAll(Long userId, ExpenseQuery query) {
        int page = query.pageOrDefault() - 1; // Spring Page bắt đầu từ 0
        int limit = query.limitOrDefault();
        PageRequest pageable = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "date", "id"));

        boolean hasType = query.type() != null && !query.type().isBlank();
        boolean hasCategory = query.category() != null && !query.category().isBlank();
        boolean hasMonth = query.month() != null && !query.month().isBlank();
        LocalDate[] range = hasMonth ? monthRange(query.month()) : null;

        Page<Expense> result;
        if (hasType && hasCategory && hasMonth) {
            result = expenseRepository.findByUserIdAndTypeAndCategoryAndDateBetween(
                    userId, query.type(), query.category(), range[0], range[1], pageable);
        } else if (hasType && hasCategory) {
            result = expenseRepository.findByUserIdAndTypeAndCategory(userId, query.type(), query.category(), pageable);
        } else if (hasType && hasMonth) {
            result = expenseRepository.findByUserIdAndTypeAndDateBetween(
                    userId, query.type(), range[0], range[1], pageable);
        } else if (hasType) {
            result = expenseRepository.findByUserIdAndType(userId, query.type(), pageable);
        } else if (hasCategory && hasMonth) {
            result = expenseRepository.findByUserIdAndCategoryAndDateBetween(
                    userId, query.category(), range[0], range[1], pageable);
        } else if (hasCategory) {
            result = expenseRepository.findByUserIdAndCategory(userId, query.category(), pageable);
        } else if (hasMonth) {
            result = expenseRepository.findByUserIdAndDateBetween(userId, range[0], range[1], pageable);
        } else {
            result = expenseRepository.findByUserId(userId, pageable);
        }

        List<ExpenseDto> items = result.getContent().stream().map(ExpenseDto::from).toList();
        return new ExpenseListResponse(items, result.getTotalElements(), query.pageOrDefault(), limit);
    }

    /**
     * Tìm 1 khoản chi — PHẢI khớp cả id VÀ userId.
     * Không thuộc về user → 404 (không phải 403) để không tiết lộ khoản chi tồn tại.
     */
    @Transactional(readOnly = true)
    public ExpenseDto findOne(Long userId, Long id) {
        return ExpenseDto.from(getOwned(userId, id));
    }

    /** Cập nhật — chỉ các field có trong body (PATCH), reload entity để amount chuẩn */
    @Transactional
    public ExpenseDto update(Long userId, Long id, UpdateExpenseDto dto) {
        Expense expense = getOwned(userId, id);
        if (dto.title() != null) {
            expense.setTitle(dto.title());
        }
        if (dto.amount() != null) {
            expense.setAmount(dto.amount());
        }
        if (dto.type() != null) {
            expense.setType(dto.type());
        }
        if (dto.category() != null) {
            expense.setCategory(dto.category());
        }
        if (dto.date() != null) {
            expense.setDate(parseDate(dto.date()));
        }
        if (dto.note() != null) {
            expense.setNote(dto.note());
        }
        if (dto.paymentMethod() != null) {
            expense.setPaymentMethod(dto.paymentMethod());
        }
        return ExpenseDto.from(expenseRepository.save(expense));
    }

    /** Xóa — check ownership trước (giống NestJS) */
    @Transactional
    public void remove(Long userId, Long id) {
        expenseRepository.delete(getOwned(userId, id));
    }

    /** Tổng thu/chi theo tháng trong năm — cho biểu đồ. Trả về { month: 'YYYY-MM', income, expense } */
    @Transactional(readOnly = true)
    public List<MonthlySummaryDto> monthlySummary(Long userId, int year) {
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        return expenseRepository.monthlySummary(userId, start, end).stream()
                .map(row -> new MonthlySummaryDto(
                        (String) row[0],
                        (BigDecimal) row[1],
                        (BigDecimal) row[2]))
                .toList();
    }

    /** Lấy expense thuộc về user, nếu không → 404 */
    private Expense getOwned(Long userId, Long id) {
        return expenseRepository.findById(id)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new ExpenseNotFoundException("Không tìm thấy khoản chi"));
    }

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    /** 'YYYY-MM-DD' → LocalDate; ném 400 nếu sai định dạng (đã validate ở DTO, phòng thủ thêm) */
    private static LocalDate parseDate(String date) {
        try {
            return LocalDate.parse(date, DATE_FMT);
        } catch (DateTimeParseException e) {
            throw new ExpenseNotFoundException("Ngày không đúng định dạng YYYY-MM-DD");
        }
    }

    /** 'YYYY-MM' → [ngày đầu tháng, ngày cuối tháng] */
    private static LocalDate[] monthRange(String month) {
        String[] parts = month.split("-");
        int y = Integer.parseInt(parts[0]);
        int m = Integer.parseInt(parts[1]);
        LocalDate start = LocalDate.of(y, m, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);
        return new LocalDate[]{start, end};
    }
}
