package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMe() {
        return ResponseEntity.ok(userService.getUserProfile(SecurityUtils.getCurrentUserUid()));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMe(@RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.updateUser(SecurityUtils.getCurrentUserUid(), request));
    }
}
