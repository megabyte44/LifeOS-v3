package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.HabitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/habits")
@RequiredArgsConstructor
public class HabitController {

    private final HabitService habitService;

    @GetMapping
    public ResponseEntity<List<HabitResponse>> getAll(
            @RequestParam(required = false) String context) {
        return ResponseEntity.ok(habitService.getAll(SecurityUtils.getCurrentUserUid(), context));
    }

    @PostMapping
    public ResponseEntity<HabitResponse> create(@RequestBody CreateHabitRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(habitService.create(SecurityUtils.getCurrentUserUid(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HabitResponse> update(
            @PathVariable UUID id,
            @RequestBody UpdateHabitRequest req) {
        return ResponseEntity.ok(habitService.update(SecurityUtils.getCurrentUserUid(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        habitService.delete(SecurityUtils.getCurrentUserUid(), id);
        return ResponseEntity.noContent().build();
    }
}
