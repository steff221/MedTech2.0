package com.medtech.presentation.controller;

import com.medtech.application.dto.request.InviteStaffRequest;
import com.medtech.application.dto.response.UserResponse;
import com.medtech.application.service.AdminService;
import com.medtech.domain.vo.UserStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * REST контролер: административни endpoints (управување со корисници, болници, персонал).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "User management — invite, suspend, activate staff")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @Operation(summary = "List staff users; optionally filter doctors by hospitalId")
    public ResponseEntity<Page<UserResponse>> listUsers(
            @RequestParam(required = false) Long hospitalId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable) {
        return ResponseEntity.ok(adminService.listUsers(hospitalId, pageable));
    }

    @PostMapping("/invite")
    @Operation(summary = "Invite a new doctor or nurse — creates account and sends setup email")
    public ResponseEntity<UserResponse> invite(@Valid @RequestBody InviteStaffRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.inviteStaff(request));
    }

    @PutMapping("/users/{id}/suspend")
    @Operation(summary = "Suspend a user account")
    public ResponseEntity<UserResponse> suspend(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.setStatus(id, UserStatus.SUSPENDED));
    }

    @PutMapping("/users/{id}/activate")
    @Operation(summary = "Re-activate a suspended user account")
    public ResponseEntity<UserResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.setStatus(id, UserStatus.ACTIVE));
    }

    @PostMapping("/users/{id}/resend-invite")
    @Operation(summary = "Resend the setup email to a staff member who hasn't logged in yet")
    public ResponseEntity<UserResponse> resendInvite(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.resendInvite(id));
    }
}
