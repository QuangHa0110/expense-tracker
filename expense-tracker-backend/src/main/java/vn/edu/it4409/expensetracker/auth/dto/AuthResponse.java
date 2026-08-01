package vn.edu.it4409.expensetracker.auth.dto;

/** Response đăng nhập/đăng ký — giữ đúng shape frontend mong đợi: { accessToken, user: { id, email, name } } */
public record AuthResponse(
        String accessToken,
        UserDto user
) {

    public record UserDto(Long id, String email, String name) {
    }
}
