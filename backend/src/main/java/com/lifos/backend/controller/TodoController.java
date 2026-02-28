package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
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
 * KEY CONCEPTS:
 * - @RestController → combines @Controller + @ResponseBody.
 *   Every method's return value is automatically converted to JSON.
 * - @RequestMapping("/api/todos") → base path for all methods in this class.
 * - @GetMapping, @PostMapping, etc. → map methods to HTTP verbs.
 * - @RequestBody → tells Spring: "parse the JSON request body into this Java object"
 * - @PathVariable → extracts a value from the URL path (e.g., /api/todos/{id})
 * - ResponseEntity → lets you control both the response body AND HTTP status code.
 *
 * PHASE 1 NOTE:
 * We hardcode a temporary user UID for testing. In Phase 2, we'll replace this
 * with the authenticated user from the Firebase token.
 */
@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    /**
     * TEMPORARY: hardcoded user UID for Phase 1 testing.
     * In Phase 2, this will come from the Firebase SecurityContext.
     */
    private String getCurrentUserUid() {
        // TODO: Phase 2 — Replace with: SecurityContextHolder.getContext()...
        return "temp-test-user";
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
