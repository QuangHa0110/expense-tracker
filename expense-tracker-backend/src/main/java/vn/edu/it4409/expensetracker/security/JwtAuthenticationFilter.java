package vn.edu.it4409.expensetracker.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * JWT Filter — đọc header Authorization: Bearer <token>, verify, rồi đặt
 * thông tin user vào SecurityContext để controller lấy qua @AuthenticationPrincipal.
 * Tương đương JwtStrategy + JwtAuthGuard của NestJS.
 *
 * Token sai / hết hạn / thiếu → KHÔNG đặt authentication → Spring Security trả 401.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            try {
                var claims = jwtService.parseToken(token);
                Long userId = Long.valueOf(claims.getSubject());
                String email = claims.get("email", String.class);
                String name = claims.get("name", String.class);

                // Principal = AuthUser — controller lấy qua @AuthenticationPrincipal
                AuthUser authUser = new AuthUser(userId, email, name);
                var authentication = new UsernamePasswordAuthenticationToken(
                        authUser, null, java.util.List.of());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                // Token không hợp lệ — để filter chain tiếp tục, Security sẽ chặn 401
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
