package com.lifos.backend.service;

import com.lifos.backend.dto.AiChatRequest;
import com.lifos.backend.dto.AiChatResponse;
import com.lifos.backend.entity.AiConfiguration;
import com.lifos.backend.repository.AiConfigurationRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final AiConfigurationRepository aiConfigRepo;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public AiChatResponse chat(AiChatRequest req) {
        AiConfiguration config = aiConfigRepo.findAll().stream().findFirst().orElse(null);

        if (config == null || config.getModelConfig() == null || config.getModelConfig().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI is not configured. Set up AI config in admin panel.");
        }

        Map<String, Object> modelCfg = config.getModelConfig();
        Map<String, Object> apiKeysCfg = config.getApiKeys();

        String provider = (String) modelCfg.getOrDefault("provider", "openrouter");
        String model = req.getModel() != null ? req.getModel() : (String) modelCfg.getOrDefault("model", "");
        double temperature = toDouble(modelCfg.getOrDefault("temperature", 0.7));
        int maxTokens = toInt(modelCfg.getOrDefault("maxTokens", 4096));
        double topP = toDouble(modelCfg.getOrDefault("topP", 1.0));

        // Prepend system instruction based on personality
        String personality = req.getPersonality() != null ? req.getPersonality() : config.getDefaultPersonality();
        Map<String, Object> sysInstructions = config.getSystemInstructions();
        String sysPrompt = personality.equals("professional")
                ? (String) sysInstructions.getOrDefault("professionalAssistant", "")
                : (String) sysInstructions.getOrDefault("casualBuddy", "");

        return switch (provider) {
            case "gemini" -> callGemini(req.getMessages(), sysPrompt, model,
                    (String) (apiKeysCfg != null ? apiKeysCfg.get("gemini") : null),
                    temperature, maxTokens, topP);
            default -> callOpenAiCompatible(req.getMessages(), sysPrompt, model,
                    (String) (apiKeysCfg != null ? apiKeysCfg.get(provider) : null),
                    temperature, maxTokens, topP, provider);
        };
    }

    // ── OpenAI / OpenRouter ────────────────────────────────────────────────────

    private AiChatResponse callOpenAiCompatible(
            List<AiChatRequest.AiMessage> messages, String sysPrompt,
            String model, String apiKey, double temperature, int maxTokens, double topP,
            String provider) {

        String url = provider.equals("openai")
                ? "https://api.openai.com/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";

        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "API key for " + provider + " is not configured.");
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("temperature", temperature);
            body.put("max_tokens", maxTokens);
            body.put("top_p", topP);

            ArrayNode msgs = body.putArray("messages");
            if (!sysPrompt.isBlank()) {
                msgs.addObject().put("role", "system").put("content", sysPrompt);
            }
            for (AiChatRequest.AiMessage m : messages) {
                msgs.addObject().put("role", m.getRole()).put("content", m.getContent());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            if (provider.equals("openrouter")) {
                headers.set("HTTP-Referer", "https://lifeos.app");
            }

            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), JsonNode.class);

            String content = resp.getBody()
                    .path("choices").get(0)
                    .path("message").path("content").asText();

            String usedModel = resp.getBody().path("model").asText(model);

            AiChatResponse r = new AiChatResponse();
            r.setResult(content);
            r.setModel(usedModel);
            return r;

        } catch (Exception e) {
            log.error("AI chat error ({}): {}", provider, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider call failed: " + e.getMessage());
        }
    }

    // ── Gemini ─────────────────────────────────────────────────────────────────

    private AiChatResponse callGemini(
            List<AiChatRequest.AiMessage> messages, String sysPrompt,
            String model, String apiKey, double temperature, int maxTokens, double topP) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured.");
        }

        String resolvedModel = (model == null || model.isBlank()) ? "gemini-2.0-flash" : model;
        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + resolvedModel + ":generateContent?key=" + apiKey;

        try {
            ObjectNode body = objectMapper.createObjectNode();
            ArrayNode contents = body.putArray("contents");

            if (!sysPrompt.isBlank()) {
                ObjectNode sysNode = contents.addObject();
                sysNode.put("role", "user");
                sysNode.putArray("parts").addObject().put("text", sysPrompt);
            }

            for (AiChatRequest.AiMessage m : messages) {
                ObjectNode msgNode = contents.addObject();
                String geminiRole = m.getRole().equals("assistant") ? "model" : "user";
                msgNode.put("role", geminiRole);
                msgNode.putArray("parts").addObject().put("text", m.getContent());
            }

            ObjectNode genConfig = body.putObject("generationConfig");
            genConfig.put("temperature", temperature);
            genConfig.put("maxOutputTokens", maxTokens);
            genConfig.put("topP", topP);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<JsonNode> resp = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(body, headers), JsonNode.class);

            String text = resp.getBody()
                    .path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            AiChatResponse r = new AiChatResponse();
            r.setResult(text);
            r.setModel(resolvedModel);
            return r;

        } catch (Exception e) {
            log.error("Gemini chat error: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini call failed: " + e.getMessage());
        }
    }

    // ── Utils ──────────────────────────────────────────────────────────────────

    private double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0.7; }
    }

    private int toInt(Object v) {
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 4096; }
    }
}
