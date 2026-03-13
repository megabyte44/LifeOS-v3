package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.CredentialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;

    @GetMapping
    public ResponseEntity<List<CredentialResponse>> getAll() {
        return ResponseEntity.ok(credentialService.getAll(SecurityUtils.getCurrentUserUid()));
    }

    @PostMapping
    public ResponseEntity<CredentialResponse> create(@RequestBody CreateCredentialRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(credentialService.create(SecurityUtils.getCurrentUserUid(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CredentialResponse> update(
            @PathVariable UUID id,
            @RequestBody UpdateCredentialRequest req) {
        return ResponseEntity.ok(credentialService.update(SecurityUtils.getCurrentUserUid(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        credentialService.delete(SecurityUtils.getCurrentUserUid(), id);
        return ResponseEntity.noContent().build();
    }
}
