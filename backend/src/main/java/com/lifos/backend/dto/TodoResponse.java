package com.lifos.backend.dto;

import lombok.*;

/**
 * DTO for the response sent back to the frontend.
 * This matches the TypeScript type:
 *   { id: string, text: string, completed: boolean, priority?: string, postponed?: boolean }
 *
 * Notice: the entity has "user" and "createdAt" but the response DTO does NOT.
 * This is intentional — the frontend doesn't need those internal details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoResponse {
    private String id;             // UUID as string (frontend expects string IDs)
    private String text;
    private Boolean completed;
    private String priority;
    private Boolean postponed;
}
