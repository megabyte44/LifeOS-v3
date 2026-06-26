package com.lifos.backend.dto;

import lombok.*;

/**
 * DTO for updating an existing todo.
 * All fields are optional (nullable) — the client only sends what changed.
 * This is what "Partial<TodoItem>" means in the API contract.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTodoRequest {
    private String text;
    private Boolean completed;
    private String priority;
    private Boolean postponed;
}
