package vn.edu.it4409.expensetracker.config;

import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.net.URISyntaxException;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình DataSource thủ công — chấp nhận cả 2 dạng DATABASE_URL:
 *   - "postgresql://user:pass@host:port/db?sslmode=require" (Neon copy-paste thẳng)
 *   - "jdbc:postgresql://host:port/db" (đã có prefix jdbc:)
 * HikariCP yêu cầu URL bắt đầu bằng "jdbc:", nên nếu thiếu thì tự thêm.
 * Nếu DB_USERNAME/DB_PASSWORD không set (Render/Neon hay để user/pass trong URL),
 * tự parse user/pass từ DATABASE_URL.
 */
@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource(
            @Value("${DATABASE_URL:}") String rawUrl,
            @Value("${DB_USERNAME:}") String username,
            @Value("${DB_PASSWORD:}") String password) throws URISyntaxException {

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(normalizeJdbcUrl(rawUrl));
        ds.setUsername(resolveUsername(rawUrl, username));
        ds.setPassword(resolvePassword(rawUrl, password));
        // Pool nhỏ gọn cho free tier
        ds.setMaximumPoolSize(5);
        ds.setMinimumIdle(0);
        ds.setConnectionTimeout(30000);
        // Neon yêu cầu SSL
        if (rawUrl.contains("sslmode=require")) {
            ds.addDataSourceProperty("sslmode", "require");
        }
        return ds;
    }

    /** Thêm prefix "jdbc:" + STRIP userinfo (HikariCP không hỗ trợ user:pass@ trong jdbcUrl,
     *  nó parse nhầm thành host:port). User/pass được set riêng qua setUsername/setPassword. */
    private String normalizeJdbcUrl(String url) throws URISyntaxException {
        if (url == null || url.isBlank()) {
            return "jdbc:postgresql://localhost:5432/expense_tracker";
        }
        String withoutJdbc = url.startsWith("jdbc:") ? url.substring(5) : url;
        URI uri = new URI(withoutJdbc);
        // Dựng lại URL không có userinfo: jdbc:postgresql://host:port/path?query
        String authority = uri.getHost();
        if (uri.getPort() != -1) {
            authority += ":" + uri.getPort();
        }
        String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";
        return "jdbc:postgresql://" + authority + uri.getPath() + query;
    }

    /** Ưu tiên DB_USERNAME env; nếu trống thì parse từ URL */
    private String resolveUsername(String url, String username) throws URISyntaxException {
        if (username != null && !username.isBlank()) {
            return username;
        }
        URI uri = new URI(url.startsWith("jdbc:") ? url.substring(5) : url);
        String userInfo = uri.getUserInfo();
        if (userInfo != null && userInfo.contains(":")) {
            return userInfo.split(":", 2)[0];
        }
        return userInfo != null ? userInfo : "postgres";
    }

    /** Ưu tiên DB_PASSWORD env; nếu trống thì parse từ URL */
    private String resolvePassword(String url, String password) throws URISyntaxException {
        if (password != null && !password.isBlank()) {
            return password;
        }
        URI uri = new URI(url.startsWith("jdbc:") ? url.substring(5) : url);
        String userInfo = uri.getUserInfo();
        if (userInfo != null && userInfo.contains(":")) {
            return userInfo.split(":", 2)[1];
        }
        return "";
    }
}
