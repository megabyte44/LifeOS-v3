package com.lifos.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String displayName;
    private String photoURL;
}
