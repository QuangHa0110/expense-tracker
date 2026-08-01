package vn.edu.it4409.expensetracker.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.it4409.expensetracker.auth.dto.AuthResponse;
import vn.edu.it4409.expensetracker.auth.dto.LoginDto;
import vn.edu.it4409.expensetracker.auth.dto.RegisterDto;
import vn.edu.it4409.expensetracker.security.JwtService;
import vn.edu.it4409.expensetracker.user.User;
import vn.edu.it4409.expensetracker.user.UserService;

/**
 * Tương đương AuthService của NestJS:
 * - register: bcrypt hash (10 rounds) → tạo user → trả token + user
 * - login: verify email + password → trả token + user
 */
@Service
public class AuthService {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserService userService, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterDto dto) {
        String passwordHash = passwordEncoder.encode(dto.password());
        User user = userService.create(dto.email(), dto.name(), passwordHash);
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginDto dto) {
        User user = userService.findByEmail(dto.email())
                // 401 — không tiết lộ email có tồn tại hay không
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(dto.password(), user.getPassword())) {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }
        return buildAuthResponse(user);
    }

    /** JWT payload: sub = userId, email, name. KHÔNG BAO GIỜ tin userId client gửi lên. */
    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getName());
        AuthResponse.UserDto userDto = new AuthResponse.UserDto(user.getId(), user.getEmail(), user.getName());
        return new AuthResponse(token, userDto);
    }
}
