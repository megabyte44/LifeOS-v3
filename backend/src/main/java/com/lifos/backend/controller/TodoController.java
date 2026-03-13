package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.TodoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller — handles HTTP requests for the /api/todos endpoints.
 *
 * Phase 2: User UID now comes from the Firebase-verified SecurityContext.
 * FirebaseAuthenticationFilter runs before this controller and sets the
 * SecurityContext. SecurityUtils.getCurrentUserUid() extracts the uid.
 */
@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    private String getCurrentUserUid() {
        return SecurityUtils.getCurrentUserUid();
    }

    // ── GET /api/todos ──
    @GetMapping
    public ResponseEntity<List<TodoResponse>> getAllTodos() {
        List<TodoResponse> todos = todoService.getAllTodos(getCurrentUserUid());
        return ResponseEntity.ok(todos);       // 200 OK + JSON body
    }

    // ── POST /api/todos ──
    @PostMapping
    public ResponseEntity<TodoResponse> createTodo(@RequestBody CreateTodoRequest request) {
        TodoResponse created = todoService.createTodo(getCurrentUserUid(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)    // 201 Created
                .body(created);
    }

    // ── PUT /api/todos/{id} ──
    @PutMapping("/{id}")
    public ResponseEntity<TodoResponse> updateTodo(
            @PathVariable UUID id,
            @RequestBody UpdateTodoRequest request) {
        TodoResponse updated = todoService.updateTodo(getCurrentUserUid(), id, request);
        return ResponseEntity.ok(updated);     // 200 OK + updated JSON
    }

    // ── DELETE /api/todos/{id} ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable UUID id) {
        todoService.deleteTodo(getCurrentUserUid(), id);
        return ResponseEntity.noContent().build();  // 204 No Content
    }
}
