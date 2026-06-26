package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.TodoItem;
import com.lifos.backend.entity.User;
import com.lifos.backend.event.KnowledgeGraphTriggerEvent;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.TodoRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service Layer — contains all business logic for Todos.
 *
 * KEY CONCEPTS:
 * - @Service → tells Spring "this is a service bean, manage its lifecycle"
 * - @RequiredArgsConstructor (Lombok) → generates a constructor that injects
 *   all `final` fields. This is how Spring's Dependency Injection works:
 *   Spring sees TodoService needs a TodoRepository, creates one, and passes it in.
 * - @Transactional → wraps the method in a database transaction.
 *   If anything fails, ALL database changes are rolled back.
 *
 * WHY A SEPARATE SERVICE LAYER?
 * - Controller should only handle HTTP concerns (request parsing, response building)
 * - Service handles business logic (validation, transformations, multi-step operations)
 * - This separation makes code testable: you can test service logic without HTTP
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TodoService {

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final ApplicationEventPublisher eventPublisher;

    // ── Helper: Convert Entity → Response DTO ──
    private TodoResponse toResponse(TodoItem todo) {
        return TodoResponse.builder()
                .id(todo.getId().toString())
                .text(todo.getText())
                .completed(todo.getCompleted())
                .priority(todo.getPriority())
                .postponed(todo.getPostponed())
                .build();
    }

    // ── Helper: Get user or throw 404 ──
    // User is guaranteed to exist: FirebaseAuthenticationFilter calls
    // UserService.ensureUserExists() before any controller runs.
    private User getUser(String userUid) {
        return userRepository.findById(userUid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", userUid));
    }

    /**
     * GET all todos for a user.
     * Maps each entity to a response DTO using Java Streams.
     */
    public List<TodoResponse> getAllTodos(String userUid) {
        return todoRepository.findAllByUserUid(userUid)
                .stream()                          // Convert List to a Stream (pipeline)
                .map(this::toResponse)             // Transform each TodoItem → TodoResponse
                .toList();                         // Collect back to a List
    }

    /**
     * CREATE a new todo.
     * 1. Look up the user (must exist)
     * 2. Build a new TodoItem entity from the request DTO
     * 3. Save to database (JPA auto-generates the UUID)
     * 4. Return the saved entity as a response DTO
     */
    @Transactional
    public TodoResponse createTodo(String userUid, CreateTodoRequest request) {
        User user = getUser(userUid);
        log.info("Creating todo for user [{}]: '{}'", userUid, request.getText());
        TodoItem todo = TodoItem.builder()
                .user(user)
                .text(request.getText())
                .completed(request.getCompleted() != null ? request.getCompleted() : false)
                .priority(request.getPriority())
                .postponed(request.getPostponed() != null ? request.getPostponed() : false)
                .build();

        TodoItem saved = todoRepository.save(todo);
        eventPublisher.publishEvent(EmbeddingTextBuilder.buildEvent(
                userUid, "todo", saved.getId(), saved.getText()));
        eventPublisher.publishEvent(new KnowledgeGraphTriggerEvent(
                userUid, "todo", saved.getId(), saved.getText()));
        return toResponse(saved);
    }

    /**
     * UPDATE a todo (partial update).
     * 1. Find the todo by ID AND user (security: prevents accessing other users' data)
     * 2. Only update fields that are non-null in the request (partial update)
     * 3. Save and return
     */
    @Transactional
    public TodoResponse updateTodo(String userUid, UUID todoId, UpdateTodoRequest request) {
        log.debug("Updating todo [{}] for user [{}]", todoId, userUid);
        TodoItem todo = todoRepository.findByIdAndUserUid(todoId, userUid)
                .orElseThrow(() -> new ResourceNotFoundException("Todo", "id", todoId));
        boolean wasDone = Boolean.TRUE.equals(todo.getCompleted());

        // Partial update: only change fields the client sent
        if (request.getText() != null)      todo.setText(request.getText());
        if (request.getCompleted() != null) todo.setCompleted(request.getCompleted());
        if (request.getPriority() != null)  todo.setPriority(request.getPriority());
        if (request.getPostponed() != null) todo.setPostponed(request.getPostponed());

        TodoItem saved = todoRepository.save(todo);
        eventPublisher.publishEvent(EmbeddingTextBuilder.buildEvent(
                userUid, "todo", saved.getId(), saved.getText()));
        eventPublisher.publishEvent(new KnowledgeGraphTriggerEvent(
                userUid, "todo", saved.getId(), saved.getText()));
        if (!wasDone && Boolean.TRUE.equals(saved.getCompleted())) {
            activityLogService.log(userUid, "todos", "completed", saved.getId(), "Completed todo: " + saved.getText());
        }
        return toResponse(saved);
    }

    /**
     * DELETE a todo.
     * Deletes only if the todo belongs to the given user.
     */
    @Transactional
    public void deleteTodo(String userUid, UUID todoId) {
        TodoItem todo = todoRepository.findByIdAndUserUid(todoId, userUid)
                .orElseThrow(() -> new ResourceNotFoundException("Todo", "id", todoId));
        log.info("Deleting todo [{}] for user [{}]", todoId, userUid);
        eventPublisher.publishEvent(EmbeddingTextBuilder.deleteEvent(userUid, "todo", todoId));
        eventPublisher.publishEvent(new KnowledgeGraphTriggerEvent(userUid, "todo", todoId, null));
        todoRepository.delete(todo);
    }
}
