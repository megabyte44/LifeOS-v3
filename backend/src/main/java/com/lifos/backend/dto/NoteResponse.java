package com.lifos.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NoteResponse {
    private String id;
    private String title;
    private JsonNode content;
    private String type;
    private String createdAt;   // ISO string
    private String updatedAt;   // ISO string
}
