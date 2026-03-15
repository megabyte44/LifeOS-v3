package com.lifos.backend.dto;

import lombok.Data;

@Data
public class UserStatsResponse {
    private String uid;
    private String email;
    private String displayName;
    private String createdAt;
    private String lastLoginAt;
    private long notesCount;
    private long todosCount;
    private long habitsCount;
    private long transactionsCount;
    private long aiMessagesCount;
    private String role;
}
