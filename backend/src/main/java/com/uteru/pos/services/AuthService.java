package com.uteru.pos.services;

import com.uteru.pos.models.PosUser;
import com.uteru.pos.payload.LoginRequest;
import com.uteru.pos.payload.PasswordChangeRequest;
import com.uteru.pos.payload.PasswordResetRequest;
import com.uteru.pos.payload.UserProfileRequest;
import com.uteru.pos.payload.UserResponse;
import com.uteru.pos.repositories.PosUserRepository;
import com.uteru.pos.security.PasswordUtil;
import com.uteru.pos.validation.InputSanitizer;
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
        String identity = InputSanitizer.cleanText(request.getIdentity());
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
        String username = InputSanitizer.cleanText(request.getUsername());
        String email = InputSanitizer.cleanEmail(request.getEmail());
        String password = request.getPassword();
        String name = InputSanitizer.cleanText(request.getName());
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
        user.setAvatar(InputSanitizer.cleanNullableText(request.getAvatar()));
        user.setIsActive(true);

        return new UserResponse(userRepository.save(user));
    }

    public UserResponse changePassword(PasswordChangeRequest request) {
        PosUser user = findActiveUser(request.getUserId());

        if (!PasswordUtil.verifyPassword(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        user.setPasswordHash(PasswordUtil.hashPassword(request.getNewPassword()));
        return new UserResponse(userRepository.save(user));
    }

    public UserResponse resetPassword(PasswordResetRequest request) {
        PosUser owner = findActiveUser(request.getOwnerId());

        if (!"owner".equals(owner.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can reset passwords");
        }

        if (!PasswordUtil.verifyPassword(request.getOwnerPassword(), owner.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Owner password is incorrect");
        }

        PosUser target = findActiveUser(request.getTargetUserId());
        target.setPasswordHash(PasswordUtil.hashPassword(request.getNewPassword()));
        return new UserResponse(userRepository.save(target));
    }

    private PosUser findActiveUser(Long userId) {
        if (userId == null || userId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valid user id is required");
        }

        PosUser user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
        }

        return user;
    }

    private String normalize(String value) {
        return InputSanitizer.cleanText(value);
    }

    private String normalizeRole(String role) {
        String normalized = normalize(role).toLowerCase();
        if ("owner".equals(normalized)) {
            return "owner";
        }
        return "staff";
    }
}
