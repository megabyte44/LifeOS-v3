package com.lifos.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTransactionRequest {
    private String date;
    private String description;
    private String category;
    private Long amount;
    private String type;
}
