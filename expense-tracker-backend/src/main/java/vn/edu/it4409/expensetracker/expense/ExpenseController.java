package vn.edu.it4409.expensetracker.expense;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.it4409.expensetracker.expense.dto.CreateExpenseDto;
import vn.edu.it4409.expensetracker.expense.dto.ExpenseDto;
import vn.edu.it4409.expensetracker.expense.dto.ExpenseListResponse;
import vn.edu.it4409.expensetracker.expense.dto.ExpenseQuery;
import vn.edu.it4409.expensetracker.expense.dto.MonthlySummaryDto;
import vn.edu.it4409.expensetracker.expense.dto.UpdateExpenseDto;
import vn.edu.it4409.expensetracker.security.AuthUser;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

/**
 * Tương đương ExpensesController của NestJS.
 * TOÀN BỘ route trong controller này yêu cầu đăng nhập (Spring Security chặn 401 nếu thiếu JWT).
 * AuthUser = { id, email, name } lấy từ token — userId không bao giờ từ body/query.
 */
@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    /** POST /api/expenses → 201 Created */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExpenseDto create(@AuthenticationPrincipal AuthUser authUser,
                             @Valid @RequestBody CreateExpenseDto dto) {
        return expenseService.create(authUser.id(), dto);
    }

    /** GET /api/expenses?category=&month=&page=&limit= */
    @GetMapping
    public ExpenseListResponse findAll(@AuthenticationPrincipal AuthUser authUser,
                                       @Valid ExpenseQuery query) {
        return expenseService.findAll(authUser.id(), query);
    }

    /** GET /api/expenses/summary?year=2026 — biểu đồ bonus */
    @GetMapping("/summary")
    public List<MonthlySummaryDto> summary(@AuthenticationPrincipal AuthUser authUser,
                                           @RequestParam(name = "year", required = false) Integer year) {
        int y = year == null ? java.time.Year.now().getValue() : year;
        return expenseService.monthlySummary(authUser.id(), y);
    }

    /** GET /api/expenses/:id */
    @GetMapping("/{id}")
    public ExpenseDto findOne(@AuthenticationPrincipal AuthUser authUser,
                              @PathVariable Long id) {
        return expenseService.findOne(authUser.id(), id);
    }

    /** PATCH /api/expenses/:id */
    @PatchMapping("/{id}")
    public ExpenseDto update(@AuthenticationPrincipal AuthUser authUser,
                             @PathVariable Long id,
                             @Valid @RequestBody UpdateExpenseDto dto) {
        return expenseService.update(authUser.id(), id, dto);
    }

    /** DELETE /api/expenses/:id → 204 No Content */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal AuthUser authUser,
                       @PathVariable Long id) {
        expenseService.remove(authUser.id(), id);
    }
}
