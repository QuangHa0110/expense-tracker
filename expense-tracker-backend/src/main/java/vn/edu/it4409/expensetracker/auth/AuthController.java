package vn.edu.it4409.expensetracker.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.it4409.expensetracker.auth.dto.AuthResponse;
import vn.edu.it4409.expensetracker.auth.dto.LoginDto;
import vn.edu.it4409.expensetracker.auth.dto.RegisterDto;

/** Tương đương AuthController của NestJS — /api/auth/register, /api/auth/login */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/register → 201 Created */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterDto dto) {
        return authService.register(dto);
    }

    /** POST /api/auth/login → 200 OK */
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginDto dto) {
        return authService.login(dto);
    }
}
