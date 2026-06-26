package com.lifos.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNoteRequest {
    private String title;
    private JsonNode content;
    private String type;
}
