package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.Budget;
import com.lifos.backend.entity.Transaction;
import com.lifos.backend.entity.User;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.BudgetRepository;
import com.lifos.backend.repository.TransactionRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    private User getUser(String uid) {
        return userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
    }

    private TransactionResponse toResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId().toString())
                .date(t.getDate() != null ? t.getDate().toString() : null)
                .description(t.getDescription())
                .category(t.getCategory())
                .amount(t.getAmount())
                .type(t.getType())
                .build();
    }

    public List<TransactionResponse> getAll(String uid) {
        return transactionRepository.findAllByUserUidOrderByDateDesc(uid)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TransactionResponse create(String uid, CreateTransactionRequest req) {
        User user = getUser(uid);
        log.info("Creating transaction for user [{}]: {} {} '{}'", uid, req.getType(), req.getAmount(), req.getDescription());
        Transaction t = Transaction.builder()
                .user(user)
                .date(req.getDate() != null ? LocalDate.parse(req.getDate()) : null)
                .description(req.getDescription())
                .category(req.getCategory())
                .amount(req.getAmount())
                .type(req.getType())
                .build();
        return toResponse(transactionRepository.save(t));
    }

    @Transactional
    public TransactionResponse update(String uid, UUID id, UpdateTransactionRequest req) {
        log.debug("Updating transaction [{}] for user [{}]", id, uid);
        Transaction t = transactionRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", id));
        if (req.getDate()        != null) t.setDate(LocalDate.parse(req.getDate()));
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getCategory()    != null) t.setCategory(req.getCategory());
        if (req.getAmount()      != null) t.setAmount(req.getAmount());
        if (req.getType()        != null) t.setType(req.getType());
        return toResponse(transactionRepository.save(t));
    }

    @Transactional
    public void delete(String uid, UUID id) {
        Transaction t = transactionRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction", "id", id));
        log.info("Deleting transaction [{}] for user [{}]", id, uid);
        transactionRepository.delete(t);
    }

    public Map<String, Long> getBudget(String uid) {
        Budget b = budgetRepository.findByUserUid(uid)
                .orElse(Budget.builder().userUid(uid).budget(0L).build());
        return Map.of("budget", b.getBudget());
    }

    @Transactional
    public Map<String, Long> updateBudget(String uid, Long budget) {
        log.info("Updating budget for user [{}] to {}", uid, budget);
        Budget b = budgetRepository.findByUserUid(uid)
                .orElse(Budget.builder().userUid(uid).budget(0L).build());
        b.setBudget(budget);
        budgetRepository.save(b);
        return Map.of("budget", budget);
    }
}
