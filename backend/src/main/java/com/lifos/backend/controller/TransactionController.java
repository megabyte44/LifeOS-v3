package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getAll() {
        return ResponseEntity.ok(transactionService.getAll(SecurityUtils.getCurrentUserUid()));
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> create(@RequestBody CreateTransactionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(transactionService.create(SecurityUtils.getCurrentUserUid(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> update(
            @PathVariable UUID id,
            @RequestBody UpdateTransactionRequest req) {
        return ResponseEntity.ok(transactionService.update(SecurityUtils.getCurrentUserUid(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        transactionService.delete(SecurityUtils.getCurrentUserUid(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/budget")
    public ResponseEntity<Map<String, Long>> getBudget() {
        return ResponseEntity.ok(transactionService.getBudget(SecurityUtils.getCurrentUserUid()));
    }

    @PutMapping("/budget")
    public ResponseEntity<Map<String, Long>> updateBudget(@RequestBody Map<String, Long> body) {
        Long budget = body.get("budget");
        return ResponseEntity.ok(transactionService.updateBudget(SecurityUtils.getCurrentUserUid(), budget));
    }
}
