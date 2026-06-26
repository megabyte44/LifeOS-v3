package com.lifos.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifos.backend.dto.*;
import com.lifos.backend.entity.*;
import com.lifos.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Checkpoint 8 — RAGAS Evaluation.
 *
 * Implements 4 RAG quality metrics using LLM-as-judge (no Python sidecar):
 *   • Faithfulness      — fraction of answer claims supported by context
 *   • Answer Relevancy  — how well the answer addresses the question
 *   • Context Precision — fraction of retrieved context that was useful
 *   • Context Recall    — fraction of expected-answer facts present in context (benchmark only)
 *
 * Live metrics (Faithfulness, Answer Relevancy, Context Precision) are evaluated
 * asynchronously after every streaming chat response when {@code evaluationEnabled=true}.
 * Context Recall is only available via the benchmark endpoint against curated test cases.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RagEvaluationService {

    private final RagEvaluationRepository evalRepo;
    private final RagTestCaseRepository testCaseRepo;
    private final UserRepository userRepository;
    private final AiConfigurationResolver aiConfigurationResolver;
    private final PromptAssemblyService promptAssemblyService;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    /** Rolling counter used for sampling (evaluate 1 in N interactions). */
    private final AtomicLong evalCounter = new AtomicLong(0);

    // ── Live evaluation (called after streaming completes) ────────────────────

    @Async
    @Transactional
    public void evaluateAsync(String userUid, String question, String answer,
                              long responseTimeMs, String modelUsed, String personality) {
        try {
            AiConfiguration config = aiConfigurationResolver.resolve();
            if (!Boolean.TRUE.equals(config.getEvaluationEnabled())) return;

            // Sampling: skip if counter % sampleRate != 0
            int rate = config.getEvaluationSampleRate() != null ? config.getEvaluationSampleRate() : 1;
            if (rate > 1 && evalCounter.incrementAndGet() % rate != 0) return;

            if (isBlank(question) || isBlank(answer)) return;

            String apiKey = resolveApiKey();
            if (isBlank(apiKey)) {
                log.debug("No API key for RAG evaluation, skipping");
                return;
            }

            // Re-assemble context for this question (async, so latency doesn't matter)
            String context = promptAssemblyService.assembleContext(userUid, question);
            if (isBlank(context)) return;

            float faithfulness    = evalFaithfulness(answer, context, apiKey);
            float answerRelevancy = evalAnswerRelevancy(question, answer, apiKey);
            float contextPrec     = evalContextPrecision(question, answer, context, apiKey);

            User user = userRepository.findById(userUid).orElse(null);
            if (user == null) return;

            var ctxJson = objectMapper.createArrayNode();
            ctxJson.addObject()
                    .put("sourceType", "assembled_context")
                    .put("contentPreview", context.length() > 500 ? context.substring(0, 500) : context);

            evalRepo.save(RagEvaluation.builder()
                    .user(user)
                    .question(truncate(question, 2000))
                    .answer(truncate(answer, 8000))
                    .retrievedContexts(ctxJson)
                    .faithfulness(faithfulness)
                    .answerRelevancy(answerRelevancy)
                    .contextPrecision(contextPrec)
                    .modelUsed(modelUsed)
                    .personality(personality)
                    .contextTokenCount(context.length() / 4)
                    .responseTimeMs(responseTimeMs)
                    .build());

            log.info("RAG eval stored for user [{}] — F={} AR={} CP={}",
                    userUid, faithfulness, answerRelevancy, contextPrec);

        } catch (Exception e) {
            log.warn("RAG evaluation failed for user [{}]: {}", userUid, e.getMessage());
        }
    }

    // ── Read operations ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RagMetricsSummaryResponse getMetricsSummary(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<RagEvaluation> evals = evalRepo.findSince(since);

        double avgF = evals.stream().filter(e -> e.getFaithfulness() != null)
                .mapToDouble(e -> e.getFaithfulness()).average().orElse(0.0);
        double avgAR = evals.stream().filter(e -> e.getAnswerRelevancy() != null)
                .mapToDouble(e -> e.getAnswerRelevancy()).average().orElse(0.0);
        double avgCP = evals.stream().filter(e -> e.getContextPrecision() != null)
                .mapToDouble(e -> e.getContextPrecision()).average().orElse(0.0);

        // Group by local date for history
        Map<LocalDate, List<RagEvaluation>> byDay = evals.stream()
                .collect(Collectors.groupingBy(e ->
                        e.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate()));

        List<RagMetricsSummaryResponse.DailyPoint> history = byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    List<RagEvaluation> dayEvals = entry.getValue();
                    return RagMetricsSummaryResponse.DailyPoint.builder()
                            .date(entry.getKey().toString())
                            .faithfulness(dayEvals.stream().filter(e -> e.getFaithfulness() != null)
                                    .mapToDouble(e -> e.getFaithfulness()).average().orElse(0.0))
                            .answerRelevancy(dayEvals.stream().filter(e -> e.getAnswerRelevancy() != null)
                                    .mapToDouble(e -> e.getAnswerRelevancy()).average().orElse(0.0))
                            .contextPrecision(dayEvals.stream().filter(e -> e.getContextPrecision() != null)
                                    .mapToDouble(e -> e.getContextPrecision()).average().orElse(0.0))
                            .count(dayEvals.size())
                            .build();
                })
                .toList();

        return RagMetricsSummaryResponse.builder()
                .avgFaithfulness(round(avgF))
                .avgAnswerRelevancy(round(avgAR))
                .avgContextPrecision(round(avgCP))
                .count(evals.size())
                .days(days)
                .history(history)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RagEvaluationResponse> getEvaluations(int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        return evalRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(safePage, safeSize))
                .getContent().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public RagEvaluationResponse getEvaluation(UUID id) {
        return evalRepo.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluation not found"));
    }

    // ── Test case operations ──────────────────────────────────────────────────

    @Transactional
    public RagTestCaseResponse createTestCase(String createdBy, RagTestCaseRequest req) {
        RagTestCase tc = testCaseRepo.save(RagTestCase.builder()
                .question(req.getQuestion())
                .expectedAnswer(req.getExpectedAnswer())
                .category(req.getCategory())
                .createdBy(createdBy)
                .build());
        return toTestCaseResponse(tc);
    }

    @Transactional(readOnly = true)
    public List<RagTestCaseResponse> getTestCases() {
        return testCaseRepo.findAll().stream().map(this::toTestCaseResponse).toList();
    }

    @Transactional
    public void deleteTestCase(UUID id) {
        if (!testCaseRepo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Test case not found");
        }
        testCaseRepo.deleteById(id);
    }

    // ── Benchmark — Context Recall ────────────────────────────────────────────

    /**
     * Runs Context Recall benchmark on all test cases for the given user's data.
     * Returns per-test-case recall scores — does not persist results.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> runBenchmark(String userUid) {
        List<RagTestCase> testCases = testCaseRepo.findAll();
        if (testCases.isEmpty()) return List.of();

        String apiKey = resolveApiKey();
        if (isBlank(apiKey)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No API key configured");
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (RagTestCase tc : testCases) {
            try {
                String context = promptAssemblyService.assembleContext(userUid, tc.getQuestion());
                float recall = evalContextRecall(tc.getExpectedAnswer(), context, apiKey);
                Map<String, Object> r = new LinkedHashMap<>();
                r.put("testCaseId", tc.getId().toString());
                r.put("question", tc.getQuestion());
                r.put("category", tc.getCategory());
                r.put("contextRecall", recall);
                r.put("contextSample", context.length() > 300 ? context.substring(0, 300) + "..." : context);
                results.add(r);
            } catch (Exception e) {
                log.warn("Benchmark failed for test case [{}]: {}", tc.getId(), e.getMessage());
            }
        }
        return results;
    }

    // ── LLM-as-judge metrics ──────────────────────────────────────────────────

    private float evalFaithfulness(String answer, String context, String apiKey) {
        String prompt = "You are a faithfulness evaluator.\n\n" +
                "CONTEXT:\n" + truncate(context, 3000) + "\n\n" +
                "ANSWER:\n" + truncate(answer, 1500) + "\n\n" +
                "Measure the fraction of factual claims in the Answer that are directly " +
                "supported by the Context. Score: 0.0 (no claims supported) to 1.0 (all claims supported).\n" +
                "Respond with ONLY a decimal number between 0.0 and 1.0.";
        return parseScore(callLlm(prompt, apiKey));
    }

    private float evalAnswerRelevancy(String question, String answer, String apiKey) {
        String prompt = "You are a relevancy evaluator.\n\n" +
                "QUESTION: " + truncate(question, 500) + "\n\n" +
                "ANSWER: " + truncate(answer, 1500) + "\n\n" +
                "Rate how completely and directly the Answer addresses the Question. " +
                "Score: 0.0 (completely off-topic) to 1.0 (perfectly relevant and complete).\n" +
                "Respond with ONLY a decimal number between 0.0 and 1.0.";
        return parseScore(callLlm(prompt, apiKey));
    }

    private float evalContextPrecision(String question, String answer, String context, String apiKey) {
        String prompt = "You are a context precision evaluator.\n\n" +
                "QUESTION: " + truncate(question, 500) + "\n\n" +
                "ANSWER: " + truncate(answer, 1000) + "\n\n" +
                "CONTEXT: " + truncate(context, 2000) + "\n\n" +
                "What fraction of the Context was actually useful for generating this Answer? " +
                "Score: 0.0 (no context was useful) to 1.0 (all context was relevant and used).\n" +
                "Respond with ONLY a decimal number between 0.0 and 1.0.";
        return parseScore(callLlm(prompt, apiKey));
    }

    private float evalContextRecall(String expectedAnswer, String context, String apiKey) {
        String prompt = "You are a context recall evaluator.\n\n" +
                "EXPECTED ANSWER: " + truncate(expectedAnswer, 500) + "\n\n" +
                "RETRIEVED CONTEXT: " + truncate(context, 2500) + "\n\n" +
                "What fraction of the facts in the Expected Answer can be found in the " +
                "Retrieved Context? Score: 0.0 (none found) to 1.0 (all facts present in context).\n" +
                "Respond with ONLY a decimal number between 0.0 and 1.0.";
        return parseScore(callLlm(prompt, apiKey));
    }

    // ── LLM call (same cheap-model pattern as MemoryExtractionService) ────────

    private String callLlm(String prompt, String apiKey) {
        String provider = resolveProvider();
        String model    = provider.equals("openai") ? "gpt-4o-mini" : "openai/gpt-4o-mini";
        String url = provider.equals("openai")
                ? "https://api.openai.com/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", 0.1);  // low temp for consistent numeric scores
            body.put("max_tokens", 32);    // just a number, nothing more
            body.putArray("messages")
                    .addObject().put("role", "user").put("content", prompt);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            if (provider.equals("openrouter")) headers.set("HTTP-Referer", "https://lifeos.app");

            ResponseEntity<String> resp = restTemplate.exchange(
                    url, HttpMethod.POST,
                    new HttpEntity<>(objectMapper.writeValueAsString(body), headers),
                    String.class);

            if (resp.getStatusCode() == HttpStatus.OK && resp.getBody() != null) {
                return objectMapper.readTree(resp.getBody())
                        .path("choices").get(0).path("message").path("content").asText("").strip();
            }
        } catch (Exception e) {
            log.warn("RAG eval LLM call failed: {}", e.getMessage());
        }
        return null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private float parseScore(String raw) {
        if (raw == null) return 0.5f;
        try {
            float val = Float.parseFloat(raw.replaceAll("[^0-9.]", "").trim());
            return Math.min(1.0f, Math.max(0.0f, val));
        } catch (NumberFormatException e) {
            log.debug("Could not parse score from LLM response: {}", raw);
            return 0.5f;
        }
    }

    private String resolveProvider() {
        var config = aiConfigurationResolver.resolve();
        String p = (String) config.getModelConfig().getOrDefault("provider", "openrouter");
        return p.equals("gemini") ? "openrouter" : p;
    }

    private String resolveApiKey() {
        var config = aiConfigurationResolver.resolve();
        return aiConfigurationResolver.resolveProviderApiKey(resolveProvider(), config.getApiKeys());
    }

    private double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private RagEvaluationResponse toResponse(RagEvaluation e) {
        return RagEvaluationResponse.builder()
                .id(e.getId().toString())
                .question(e.getQuestion())
                .answer(e.getAnswer())
                .personality(e.getPersonality())
                .modelUsed(e.getModelUsed())
                .faithfulness(e.getFaithfulness())
                .answerRelevancy(e.getAnswerRelevancy())
                .contextPrecision(e.getContextPrecision())
                .contextTokenCount(e.getContextTokenCount())
                .responseTimeMs(e.getResponseTimeMs())
                .createdAt(e.getCreatedAt() != null ? e.getCreatedAt().toString() : null)
                .build();
    }

    private RagTestCaseResponse toTestCaseResponse(RagTestCase tc) {
        return RagTestCaseResponse.builder()
                .id(tc.getId().toString())
                .question(tc.getQuestion())
                .expectedAnswer(tc.getExpectedAnswer())
                .category(tc.getCategory())
                .createdBy(tc.getCreatedBy())
                .createdAt(tc.getCreatedAt() != null ? tc.getCreatedAt().toString() : null)
                .build();
    }
}
