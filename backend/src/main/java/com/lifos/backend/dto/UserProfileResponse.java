package com.lifos.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String uid;
    private String email;
    private String displayName;
    private String photoURL;
    private String role;
    private String createdAt;  // ISO string
}
