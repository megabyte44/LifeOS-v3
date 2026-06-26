package com.lifos.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RenameConversationRequest {
    @NotBlank
    private String title;
}
