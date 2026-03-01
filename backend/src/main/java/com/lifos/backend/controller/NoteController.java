package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping
    public ResponseEntity<List<NoteResponse>> getAll() {
        return ResponseEntity.ok(noteService.getAll(SecurityUtils.getCurrentUserUid()));
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(@RequestBody CreateNoteRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noteService.create(SecurityUtils.getCurrentUserUid(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> update(
            @PathVariable UUID id,
            @RequestBody UpdateNoteRequest req) {
        return ResponseEntity.ok(noteService.update(SecurityUtils.getCurrentUserUid(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        noteService.delete(SecurityUtils.getCurrentUserUid(), id);
        return ResponseEntity.noContent().build();
    }
}
