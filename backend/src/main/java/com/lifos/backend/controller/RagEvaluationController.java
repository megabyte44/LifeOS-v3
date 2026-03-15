package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.RagEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/rag")
@RequiredArgsConstructor
public class RagEvaluationController {

    private final RagEvaluationService ragEvaluationService;

    // ── Metrics ───────────────────────────────────────────────────────────────

    /** GET /api/admin/rag/metrics?days=7 — aggregated avg scores over last N days */
    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public RagMetricsSummaryResponse getMetrics(@RequestParam(defaultValue = "7") int days) {
        return ragEvaluationService.getMetricsSummary(Math.min(90, Math.max(1, days)));
    }

    // ── Individual evaluations ────────────────────────────────────────────────

    /** GET /api/admin/rag/evaluations?page=0&size=20 — paginated list */
    @GetMapping("/evaluations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RagEvaluationResponse> getEvaluations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ragEvaluationService.getEvaluations(page, size);
    }

    /** GET /api/admin/rag/evaluations/{id} — single evaluation detail */
    @GetMapping("/evaluations/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public RagEvaluationResponse getEvaluation(@PathVariable UUID id) {
        return ragEvaluationService.getEvaluation(id);
    }

    // ── Test cases ────────────────────────────────────────────────────────────

    /** GET /api/admin/rag/test-cases */
    @GetMapping("/test-cases")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RagTestCaseResponse> getTestCases() {
        return ragEvaluationService.getTestCases();
    }

    /** POST /api/admin/rag/test-cases */
    @PostMapping("/test-cases")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public RagTestCaseResponse createTestCase(@RequestBody RagTestCaseRequest req) {
        return ragEvaluationService.createTestCase(SecurityUtils.getCurrentUserUid(), req);
    }

    /** DELETE /api/admin/rag/test-cases/{id} */
    @DeleteMapping("/test-cases/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTestCase(@PathVariable UUID id) {
        ragEvaluationService.deleteTestCase(id);
    }

    // ── Benchmark ─────────────────────────────────────────────────────────────

    /**
     * POST /api/admin/rag/benchmark
     * Runs Context Recall on all test cases using the calling user's data as context.
     * Returns per-test-case scores — does not persist.
     */
    @PostMapping("/benchmark")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Map<String, Object>> runBenchmark() {
        return ragEvaluationService.runBenchmark(SecurityUtils.getCurrentUserUid());
    }
}
