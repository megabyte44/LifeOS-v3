package com.lifos.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCredentialRequest {
    private String name;
    private String category;
    private String lastUpdated;
    private String username;
    private String password;
    private String website;
    private String accountNumber;
    private String ifscCode;
    private String upiPin;
    private String netbankingId;
    private String mpin;
    private String netbankingPassword;
    private String transactionPassword;
}
