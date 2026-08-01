package vn.edu.it4409.expensetracker.common;

import java.time.Instant;
import java.util.List;

/**
 * Body lỗi chuẩn — giữ đúng shape NestJS: { statusCode, message, path, timestamp }.
 * Frontend đọc err.response.data.message để hiển thị.
 */
public record ApiError(
        int statusCode,
        Object message,
        String path,
        Instant timestamp
) {

    public static ApiError of(int statusCode, String message, String path) {
        return new ApiError(statusCode, message, path, Instant.now());
    }

    public static ApiError of(int statusCode, List<String> messages, String path) {
        return new ApiError(statusCode, messages, path, Instant.now());
    }
}
