package com.lifos.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption service for credentials stored at rest.
 *
 * KEY CONCEPTS:
 * - AES-256-GCM is authenticated encryption: it provides both confidentiality
 *   AND integrity (detects tampering). Preferred over AES-CBC.
 * - Each encryption generates a fresh random 12-byte IV (Initialization Vector).
 *   The IV is prepended to the ciphertext before Base64 encoding so we can
 *   retrieve it for decryption: [12 bytes IV][ciphertext+auth-tag]
 * - The encryption key comes from application.yaml (base64-encoded 32 bytes).
 *
 * GENERATE A KEY (run once, store in application.yaml):
 *   import java.security.SecureRandom; Base64.getEncoder().encodeToString(new byte[32] {{ new SecureRandom().nextBytes(this); }})
 * Or in PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
 */
@Service
public class EncryptionService {

    private static final String ALGORITHM  = "AES/GCM/NoPadding";
    private static final int IV_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecretKey secretKey;

    public EncryptionService(@Value("${encryption.secret-key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Encrypts plaintext → Base64(IV + ciphertext).
     * Returns null if input is null (preserves optional fields).
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

            // Prepend IV to ciphertext
            byte[] combined = new byte[IV_LENGTH_BYTES + ciphertext.length];
            System.arraycopy(iv, 0, combined, 0, IV_LENGTH_BYTES);
            System.arraycopy(ciphertext, 0, combined, IV_LENGTH_BYTES, ciphertext.length);

            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    /**
     * Decrypts Base64(IV + ciphertext) → plaintext.
     * Returns null if input is null.
     */
    public String decrypt(String encryptedBase64) {
        if (encryptedBase64 == null) return null;
        try {
            byte[] combined = Base64.getDecoder().decode(encryptedBase64);
            byte[] iv         = new byte[IV_LENGTH_BYTES];
            byte[] ciphertext = new byte[combined.length - IV_LENGTH_BYTES];

            System.arraycopy(combined, 0, iv, 0, IV_LENGTH_BYTES);
            System.arraycopy(combined, IV_LENGTH_BYTES, ciphertext, 0, ciphertext.length);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(TAG_LENGTH_BITS, iv));
            return new String(cipher.doFinal(ciphertext));
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
