package com.lifos.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponse {
    private String id;
    private String date;
    private String description;
    private String category;
    private Long amount;
    private String type;
}
