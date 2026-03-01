package com.lifos.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTransactionRequest {
    private String date;
    private String description;
    private String category;
    private Long amount;
    private String type;
}
