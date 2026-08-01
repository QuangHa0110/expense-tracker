package vn.edu.it4409.expensetracker.user;

import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    /** Tạo user mới — kiểm tra email trùng, ném ConflictException (409) nếu đã tồn tại */
    public User create(String email, String name, String passwordHash) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ConflictException("Email này đã được đăng ký");
        }
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordHash);
        return userRepository.save(user);
    }
}
