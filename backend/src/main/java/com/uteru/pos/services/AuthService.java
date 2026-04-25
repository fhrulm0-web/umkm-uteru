package com.uteru.pos.services;

import com.uteru.pos.models.PosUser;
import com.uteru.pos.payload.LoginRequest;
import com.uteru.pos.payload.UserProfileRequest;
import com.uteru.pos.payload.UserResponse;
import com.uteru.pos.repositories.PosUserRepository;
import com.uteru.pos.security.PasswordUtil;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AuthService {
    private final PosUserRepository userRepository;

    public AuthService(PosUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse login(LoginRequest request) {
        String identity = normalize(request.getIdentity());
        String password = request.getPassword();

        if (identity.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username/email and password are required");
        }

        PosUser user = userRepository.findActiveByIdentity(identity)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!PasswordUtil.verifyPassword(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return new UserResponse(user);
    }

    public List<UserResponse> getActiveProfiles() {
        return userRepository.findByIsActiveTrueOrderByIdAsc().stream()
                .map(UserResponse::new)
                .toList();
    }

    public UserResponse createProfile(UserProfileRequest request) {
        String username = normalize(request.getUsername());
        String email = emptyToNull(request.getEmail());
        String password = request.getPassword();
        String name = normalize(request.getName());
        String role = normalizeRole(request.getRole());

        if (username.isBlank() || name.isBlank() || password == null || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username, name, and password are required");
        }

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        PosUser user = new PosUser();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        user.setName(name);
        user.setRole(role);
        user.setAvatar(emptyToNull(request.getAvatar()));
        user.setIsActive(true);

        return new UserResponse(userRepository.save(user));
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String emptyToNull(String value) {
        String normalized = normalize(value);
        return normalized.isBlank() ? null : normalized;
    }

    private String normalizeRole(String role) {
        String normalized = normalize(role).toLowerCase();
        if ("owner".equals(normalized)) {
            return "owner";
        }
        return "staff";
    }
}
