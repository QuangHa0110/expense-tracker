package vn.edu.it4409.expensetracker.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import vn.edu.it4409.expensetracker.auth.UnauthorizedException;
import vn.edu.it4409.expensetracker.expense.ExpenseNotFoundException;
import vn.edu.it4409.expensetracker.user.ConflictException;

/**
 * XỬ LÝ LỖI TẬP TRUNG — tương đương AllExceptionsFilter của NestJS.
 * Mọi exception đổ về đây, trả JSON thống nhất { statusCode, message, path, timestamp }.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Lỗi validate DTO (@Valid) → 400 với danh sách message */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex,
                                                     HttpServletRequest request) {
        List<String> messages = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getDefaultMessage())
                .toList();
        return build(HttpStatus.BAD_REQUEST, messages, request);
    }

    /** Body JSON sai định dạng / thiếu → 400 */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex,
                                                     HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu gửi lên không hợp lệ", request);
    }

    /** Query param sai kiểu (vd page=abc) → 400 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex,
                                                       HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Tham số không hợp lệ: " + ex.getName(), request);
    }

    /** URL không tồn tại → 404 */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NoResourceFoundException ex,
                                                   HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên", request);
    }

    /** Vi phạm ràng buộc DB (vd email trùng unique) → 409 */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleConflict(DataIntegrityViolationException ex,
                                                   HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, "Dữ liệu đã tồn tại hoặc vi phạm ràng buộc", request);
    }

    /**
     * Exception có @ResponseStatus (vd 404 ExpenseNotFoundException, 401 UnauthorizedException,
     * 409 ConflictException) → trả đúng status code + message tiếng Việt.
     */
    @ExceptionHandler({ExpenseNotFoundException.class, UnauthorizedException.class, ConflictException.class})
    public ResponseEntity<ApiError> handleBusiness(RuntimeException ex, HttpServletRequest request) {
        HttpStatus status = resolveStatus(ex);
        return build(status, ex.getMessage(), request);
    }

    private HttpStatus resolveStatus(RuntimeException ex) {
        org.springframework.web.bind.annotation.ResponseStatus rs =
                ex.getClass().getAnnotation(org.springframework.web.bind.annotation.ResponseStatus.class);
        if (rs != null) {
            return rs.value();
        }
        // UnauthorizedException đặt status = UNAUTHORIZED (401)
        if (ex instanceof UnauthorizedException) {
            return HttpStatus.UNAUTHORIZED;
        }
        if (ex instanceof ConflictException) {
            return HttpStatus.CONFLICT;
        }
        return HttpStatus.BAD_REQUEST;
    }

    /** Lỗi không mong đợi → 500, log stack trace */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {}", request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request);
    }

    private ResponseEntity<ApiError> build(HttpStatus status, Object message, HttpServletRequest request) {
        ApiError body = new ApiError(
                status.value(),
                message,
                request.getRequestURI(),
                java.time.Instant.now()
        );
        return ResponseEntity.status(status).body(body);
    }
}
