package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.PreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/preferences")
@RequiredArgsConstructor
public class PreferenceController {

    private final PreferenceService preferenceService;

    @GetMapping
    public ResponseEntity<PreferenceResponse> get() {
        return ResponseEntity.ok(preferenceService.get(SecurityUtils.getCurrentUserUid()));
    }

    @PutMapping
    public ResponseEntity<PreferenceResponse> update(@RequestBody UpdatePreferenceRequest req) {
        return ResponseEntity.ok(preferenceService.update(SecurityUtils.getCurrentUserUid(), req));
    }
}
