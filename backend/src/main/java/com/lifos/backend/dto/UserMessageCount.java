package com.lifos.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserMessageCount {
    private String uid;
    private String email;
    private String displayName;
    private long count;
}
