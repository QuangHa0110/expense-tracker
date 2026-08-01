package vn.edu.it4409.expensetracker.expense;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    /** Danh sách giao dịch của MỘT user, filter theo category + khoảng ngày, phân trang */
    Page<Expense> findByUserIdAndCategoryAndDateBetween(
            Long userId, String category, LocalDate start, LocalDate end, Pageable pageable);

    Page<Expense> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end, Pageable pageable);

    Page<Expense> findByUserIdAndCategory(Long userId, String category, Pageable pageable);

    Page<Expense> findByUserId(Long userId, Pageable pageable);

    /** Các biến thể có lọc thêm type (income/expense) — dùng khi query.type được chỉ định */
    Page<Expense> findByUserIdAndType(Long userId, String type, Pageable pageable);

    Page<Expense> findByUserIdAndTypeAndCategory(Long userId, String type, String category, Pageable pageable);

    Page<Expense> findByUserIdAndTypeAndDateBetween(
            Long userId, String type, LocalDate start, LocalDate end, Pageable pageable);

    Page<Expense> findByUserIdAndTypeAndCategoryAndDateBetween(
            Long userId, String type, String category, LocalDate start, LocalDate end, Pageable pageable);

    /**
     * Tổng thu/chi theo tháng cho biểu đồ:
     * SELECT TO_CHAR(date,'YYYY-MM'), SUM(amount) FILTER (WHERE type='income'), SUM(amount) FILTER (WHERE type='expense') ... GROUP BY
     */
    @Query("""
           SELECT TO_CHAR(e.date, 'YYYY-MM') AS month,
                  COALESCE(SUM(CASE WHEN e.type = 'income' THEN e.amount END), 0) AS income,
                  COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount END), 0) AS expense
           FROM Expense e
           WHERE e.userId = :userId AND e.date BETWEEN :start AND :end
           GROUP BY TO_CHAR(e.date, 'YYYY-MM')
           ORDER BY month ASC
           """)
    List<Object[]> monthlySummary(@Param("userId") Long userId,
                                  @Param("start") LocalDate start,
                                  @Param("end") LocalDate end);
}
