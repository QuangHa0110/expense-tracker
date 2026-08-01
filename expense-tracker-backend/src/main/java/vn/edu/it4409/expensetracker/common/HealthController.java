package vn.edu.it4409.expensetracker.common;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoint health check — công khai (không cần JWT).
 * Dùng cho UptimeRobot ping keep-alive (HEAD/GET đều map về đây, trả 200),
 * giữ Render free tier không ngủ sau 15 phút idle.
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
