package com.uteru.pos.services;

import com.uteru.pos.models.PosUser;
import com.uteru.pos.payload.PasswordChangeRequest;
import com.uteru.pos.payload.PasswordResetRequest;
import com.uteru.pos.repositories.PosUserRepository;
import com.uteru.pos.security.PasswordUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private PosUserRepository userRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void changePasswordUpdatesOwnPasswordWhenCurrentPasswordMatches() {
        PosUser staff = user(2L, "staff", "old-password");
        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setUserId(2L);
        request.setCurrentPassword("old-password");
        request.setNewPassword("new-password");

        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(userRepository.save(staff)).thenReturn(staff);

        authService.changePassword(request);

        assertTrue(PasswordUtil.verifyPassword("new-password", staff.getPasswordHash()));
        verify(userRepository).save(staff);
    }

    @Test
    void changePasswordRejectsWrongCurrentPassword() {
        PosUser staff = user(2L, "staff", "old-password");
        PasswordChangeRequest request = new PasswordChangeRequest();
        request.setUserId(2L);
        request.setCurrentPassword("wrong-password");
        request.setNewPassword("new-password");

        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.changePassword(request));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        verify(userRepository, never()).save(staff);
    }

    @Test
    void resetPasswordAllowsOwnerToUpdateTargetPassword() {
        PosUser owner = user(1L, "owner", "owner-password");
        PosUser staff = user(2L, "staff", "old-password");
        PasswordResetRequest request = new PasswordResetRequest();
        request.setOwnerId(1L);
        request.setOwnerPassword("owner-password");
        request.setTargetUserId(2L);
        request.setNewPassword("reset-password");

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));
        when(userRepository.save(staff)).thenReturn(staff);

        authService.resetPassword(request);

        assertTrue(PasswordUtil.verifyPassword("reset-password", staff.getPasswordHash()));
        verify(userRepository).save(staff);
    }

    @Test
    void resetPasswordRejectsNonOwner() {
        PosUser staff = user(2L, "staff", "staff-password");
        PasswordResetRequest request = new PasswordResetRequest();
        request.setOwnerId(2L);
        request.setOwnerPassword("staff-password");
        request.setTargetUserId(3L);
        request.setNewPassword("reset-password");

        when(userRepository.findById(2L)).thenReturn(Optional.of(staff));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> authService.resetPassword(request));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        verify(userRepository, never()).save(staff);
    }

    private PosUser user(Long id, String role, String password) {
        PosUser user = new PosUser();
        user.setId(id);
        user.setUsername(role + id);
        user.setName(role);
        user.setRole(role);
        user.setIsActive(true);
        user.setPasswordHash(PasswordUtil.hashPassword(password));
        return user;
    }
}
