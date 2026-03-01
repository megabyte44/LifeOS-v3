package com.lifos.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "credentials")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Credential {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_uid", nullable = false)
    private User user;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 50)
    private String category;      // 'Website' | 'Banking' | 'Social Media' | 'Other'

    @Column(name = "last_updated", nullable = false, length = 10)
    private String lastUpdated;   // 'yyyy-MM-dd'

    // ── Generic fields ──
    @Column
    private String username;

    @Column
    private String password;              // AES-256 encrypted

    @Column
    private String website;

    // ── Banking fields (encrypted) ──
    @Column(name = "account_number")
    private String accountNumber;         // encrypted

    @Column(name = "ifsc_code")
    private String ifscCode;

    @Column(name = "upi_pin")
    private String upiPin;                // encrypted

    @Column(name = "netbanking_id")
    private String netbankingId;

    @Column(name = "mpin")
    private String mpin;                  // encrypted

    @Column(name = "netbanking_password")
    private String netbankingPassword;    // encrypted

    @Column(name = "transaction_password")
    private String transactionPassword;   // encrypted
}
