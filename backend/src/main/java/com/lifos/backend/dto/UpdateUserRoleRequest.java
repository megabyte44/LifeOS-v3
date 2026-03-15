package com.lifos.backend.dto;

import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    private String role;  // "user" or "admin"
}
