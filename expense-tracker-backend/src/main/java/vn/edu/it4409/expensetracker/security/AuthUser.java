package vn.edu.it4409.expensetracker.security;

/**
 * Principal gắn vào SecurityContext sau khi JWT hợp lệ.
 * Controller lấy qua @AuthenticationPrincipal AuthUser — chứa { id, email, name }.
 * Tương đương request.user của NestJS (JwtStrategy.validate trả về).
 */
public record AuthUser(Long id, String email, String name) {
}
