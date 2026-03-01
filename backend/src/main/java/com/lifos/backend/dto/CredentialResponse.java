package com.lifos.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CredentialResponse {
    private String id;
    private String name;
    private String category;
    private String lastUpdated;
    private String username;
    private String password;          // decrypted before sending
    private String website;
    private String accountNumber;     // decrypted
    private String ifscCode;
    private String upiPin;            // decrypted
    private String netbankingId;
    private String mpin;              // decrypted
    private String netbankingPassword;     // decrypted
    private String transactionPassword;    // decrypted
}
