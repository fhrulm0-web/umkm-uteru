package com.uteru.pos.controllers;

import com.uteru.pos.payload.LoginRequest;
import com.uteru.pos.payload.UserProfileRequest;
import com.uteru.pos.payload.UserResponse;
import com.uteru.pos.services.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public UserResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/profiles")
    public List<UserResponse> getProfiles() {
        return authService.getActiveProfiles();
    }

    @PostMapping("/profiles")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createProfile(@RequestBody UserProfileRequest request) {
        return authService.createProfile(request);
    }
}
