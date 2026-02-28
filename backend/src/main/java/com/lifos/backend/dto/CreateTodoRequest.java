package com.lifos.backend.dto;

import lombok.*;

/**
 * DTO = Data Transfer Object
 *
 * KEY CONCEPT:
 * - DTOs are simple classes that define the SHAPE of request/response JSON.
 * - They are SEPARATE from entities because:
 *   1. You don't want to expose internal fields (like user_uid) to the API
 *   2. Request body shape often differs from the DB entity shape
 *   3. Prevents accidental overwriting of fields the client shouldn't control
 *
 * This DTO is what the frontend SENDS when creating a new todo.
 * Notice: no "id" field — the server generates it.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTodoRequest {
    private String text;
    private Boolean completed;
    private String priority;       // "high", "medium", "low", or null
    private Boolean postponed;
}
