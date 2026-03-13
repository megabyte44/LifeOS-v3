package com.lifos.backend.controller;

import com.lifos.backend.dto.UpdateUserProfileRequest;
import com.lifos.backend.dto.UserProfileDetailResponse;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfileDetailResponse> getProfile() {
        return ResponseEntity.ok(
                userProfileService.getProfile(SecurityUtils.getCurrentUserUid()));
    }

    @PutMapping
    public ResponseEntity<UserProfileDetailResponse> updateProfile(
            @RequestBody UpdateUserProfileRequest request) {
        return ResponseEntity.ok(
                userProfileService.updateProfile(SecurityUtils.getCurrentUserUid(), request));
    }

    @GetMapping("/pending-questions")
    public ResponseEntity<List<String>> getPendingQuestions() {
        return ResponseEntity.ok(
                userProfileService.generatePendingQuestions(SecurityUtils.getCurrentUserUid()));
    }
}
