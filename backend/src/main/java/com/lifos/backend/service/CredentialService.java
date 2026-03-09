package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.Credential;
import com.lifos.backend.entity.User;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.CredentialRepository;
import com.lifos.backend.repository.UserRepository;
import com.lifos.backend.security.EncryptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final EncryptionService enc;

    private User getUser(String uid) {
        return userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
    }

    /** Encrypt sensitive fields before saving to DB */
    private Credential encryptFields(Credential c) {
        c.setPassword(enc.encrypt(c.getPassword()));
        c.setAccountNumber(enc.encrypt(c.getAccountNumber()));
        c.setUpiPin(enc.encrypt(c.getUpiPin()));
        c.setMpin(enc.encrypt(c.getMpin()));
        c.setNetbankingPassword(enc.encrypt(c.getNetbankingPassword()));
        c.setTransactionPassword(enc.encrypt(c.getTransactionPassword()));
        return c;
    }

    /** Decrypt sensitive fields when reading from DB */
    private CredentialResponse toResponse(Credential c) {
        return CredentialResponse.builder()
                .id(c.getId().toString())
                .name(c.getName())
                .category(c.getCategory())
                .lastUpdated(c.getLastUpdated())
                .username(c.getUsername())
                .password(enc.decrypt(c.getPassword()))
                .website(c.getWebsite())
                .accountNumber(enc.decrypt(c.getAccountNumber()))
                .ifscCode(c.getIfscCode())
                .upiPin(enc.decrypt(c.getUpiPin()))
                .netbankingId(c.getNetbankingId())
                .mpin(enc.decrypt(c.getMpin()))
                .netbankingPassword(enc.decrypt(c.getNetbankingPassword()))
                .transactionPassword(enc.decrypt(c.getTransactionPassword()))
                .build();
    }

    public List<CredentialResponse> getAll(String uid) {
        return credentialRepository.findAllByUserUid(uid)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public CredentialResponse create(String uid, CreateCredentialRequest req) {
        User user = getUser(uid);
        log.info("Creating credential '{}' ({}) for user [{}]", req.getName(), req.getCategory(), uid);
        Credential c = Credential.builder()
                .user(user)
                .name(req.getName())
                .category(req.getCategory())
                .lastUpdated(req.getLastUpdated() != null ? req.getLastUpdated() : LocalDate.now().toString())
                .username(req.getUsername())
                .password(req.getPassword())
                .website(req.getWebsite())
                .accountNumber(req.getAccountNumber())
                .ifscCode(req.getIfscCode())
                .upiPin(req.getUpiPin())
                .netbankingId(req.getNetbankingId())
                .mpin(req.getMpin())
                .netbankingPassword(req.getNetbankingPassword())
                .transactionPassword(req.getTransactionPassword())
                .build();
        encryptFields(c);
        return toResponse(credentialRepository.save(c));
    }

    @Transactional
    public CredentialResponse update(String uid, UUID id, UpdateCredentialRequest req) {
        log.debug("Updating credential [{}] for user [{}]", id, uid);
        Credential c = credentialRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Credential", "id", id));
        if (req.getName()                != null) c.setName(req.getName());
        if (req.getCategory()            != null) c.setCategory(req.getCategory());
        if (req.getLastUpdated()         != null) c.setLastUpdated(req.getLastUpdated());
        else c.setLastUpdated(LocalDate.now().toString()); // auto-update date on any change
        if (req.getUsername()            != null) c.setUsername(req.getUsername());
        if (req.getPassword()            != null) c.setPassword(enc.encrypt(req.getPassword()));
        if (req.getWebsite()             != null) c.setWebsite(req.getWebsite());
        if (req.getAccountNumber()       != null) c.setAccountNumber(enc.encrypt(req.getAccountNumber()));
        if (req.getIfscCode()            != null) c.setIfscCode(req.getIfscCode());
        if (req.getUpiPin()              != null) c.setUpiPin(enc.encrypt(req.getUpiPin()));
        if (req.getNetbankingId()        != null) c.setNetbankingId(req.getNetbankingId());
        if (req.getMpin()                != null) c.setMpin(enc.encrypt(req.getMpin()));
        if (req.getNetbankingPassword()  != null) c.setNetbankingPassword(enc.encrypt(req.getNetbankingPassword()));
        if (req.getTransactionPassword() != null) c.setTransactionPassword(enc.encrypt(req.getTransactionPassword()));
        return toResponse(credentialRepository.save(c));
    }

    @Transactional
    public void delete(String uid, UUID id) {
        Credential c = credentialRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Credential", "id", id));
        log.info("Deleting credential [{}] '{}' for user [{}]", id, c.getName(), uid);
        credentialRepository.delete(c);
    }
}
