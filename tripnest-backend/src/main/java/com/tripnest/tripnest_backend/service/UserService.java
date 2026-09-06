package com.tripnest.tripnest_backend.service;
 
import com.tripnest.tripnest_backend.dto.AuthResponse;
import com.tripnest.tripnest_backend.dto.LoginRequest;
import com.tripnest.tripnest_backend.dto.RegisterRequest;
import com.tripnest.tripnest_backend.entity.Role;
import com.tripnest.tripnest_backend.entity.User;
import com.tripnest.tripnest_backend.repository.RoleRepository;
import com.tripnest.tripnest_backend.repository.UserRepository;
import com.tripnest.tripnest_backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final String DEFAULT_ROLE = "TRAVELER";

    public AuthResponse registerUser(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered: " + request.getEmail());
        }

        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE)
                .orElseThrow(() -> new RuntimeException(
                        "Default role not found. Make sure roles are seeded."));

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(defaultRole);
        user.setOauthGoogle(false);

        User savedUser = userRepository.save(user);

        return new AuthResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "User registered successfully",
                null,
                savedUser.getRole() != null ? savedUser.getRole().getName() : "TRAVELER"
        );
    }

    public AuthResponse loginUser(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
 
        String token = jwtUtil.generateToken(user.getEmail());
 
        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                "Login successful",
                token,
                user.getRole() != null ? user.getRole().getName() : "TRAVELER"
        );
    }
}
