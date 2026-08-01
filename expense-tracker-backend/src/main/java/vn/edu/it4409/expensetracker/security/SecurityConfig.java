package vn.edu.it4409.expensetracker.security;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Cấu hình Spring Security:
 * - Stateless (JWT, không dùng session)
 * - POST /api/auth/** (register, login) công khai — mọi route khác cần JWT hợp lệ
 * - JwtAuthenticationFilter chạy TRƯỚC UsernamePasswordAuthenticationFilter
 * - CORS đọc từ app.cors.origins (env CORS_ORIGIN)
 * Tương đương app.useGlobalFilters + enableCors của NestJS.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.cors.origins}")
    private String corsOrigins;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Health check công khai (UptimeRobot ping giữ service thức)
                .requestMatchers(HttpMethod.GET, "/health").permitAll()
                // HEAD cũng công khai — một số uptime tool dùng HEAD probe thay vì GET
                .requestMatchers(HttpMethod.HEAD, "/health").permitAll()
                // Auth công khai (đăng ký / đăng nhập)
                .requestMatchers(HttpMethod.POST, "/auth/register", "/auth/login").permitAll()
                // Mọi request khác cần JWT hợp lệ (đã verify ở filter)
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                // 401 khi chưa đăng nhập / token sai
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"statusCode\":401,\"message\":\"Chưa đăng nhập hoặc token hết hạn\",\"path\":\""
                        + request.getRequestURI() + "\"}"
                    );
                })
                // 403 khi đã đăng nhập nhưng không có quyền
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(403);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                        "{\"statusCode\":403,\"message\":\"Không có quyền truy cập\",\"path\":\""
                        + request.getRequestURI() + "\"}"
                    );
                })
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** CORS: cho phép các origin trong CORS_ORIGIN (dev localhost:5173, prod domain Vercel) */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(corsOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
