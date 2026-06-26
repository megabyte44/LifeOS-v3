package com.lifos.backend.service;

import com.lifos.backend.config.AiFoundationProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class OpenAiEmbeddingClient {

    private static final String DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small";

    private final AiFoundationProperties aiFoundationProperties;
    private final AiConfigurationResolver aiConfigurationResolver;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public float[] getEmbedding(String text) {
        var config = aiConfigurationResolver.resolve();
        String configuredProvider = config.getModelConfig() != null
                ? (String) config.getModelConfig().getOrDefault("provider", "openrouter")
                : "openrouter";

        // Prefer explicit provider setting, but fall back based on available keys.
        String provider = "openrouter".equalsIgnoreCase(configuredProvider) ? "openrouter" : "openai";
        String apiKey;
        if ("openrouter".equals(provider)) {
            apiKey = aiFoundationProperties.getOpenrouterEmbeddingApiKey();
            if (apiKey == null || apiKey.isBlank()) {
                apiKey = aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
            }
        } else {
            apiKey = aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
        }
        if (apiKey == null || apiKey.isBlank()) {
            provider = "openrouter".equals(provider) ? "openai" : "openrouter";
            if ("openrouter".equals(provider)) {
                apiKey = aiFoundationProperties.getOpenrouterEmbeddingApiKey();
                if (apiKey == null || apiKey.isBlank()) {
                    apiKey = aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
                }
            } else {
                apiKey = aiConfigurationResolver.resolveProviderApiKey(provider, config.getApiKeys());
            }
        }

        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Embedding API key not configured (openai/openrouter)");
        }

        String url = "openrouter".equals(provider)
                ? "https://openrouter.ai/api/v1/embeddings"
                : "https://api.openai.com/v1/embeddings";
        String configuredModel = aiFoundationProperties.getEmbedding().getModel();
        String model = (configuredModel == null || configuredModel.isBlank())
            ? DEFAULT_EMBEDDING_MODEL
            : configuredModel.trim();
        if ("openrouter".equals(provider) && !model.contains("/")) {
            model = "openai/" + model;
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("input", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            if ("openrouter".equals(provider)) {
                headers.set("HTTP-Referer", "https://lifeos.app");
            }

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode data = root.get("data").get(0).get("embedding");
                float[] embedding = new float[data.size()];
                for (int i = 0; i < data.size(); i++) {
                    embedding[i] = (float) data.get(i).asDouble();
                }
                return embedding;
            } else {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get embedding vector");
            }
        } catch (Exception e) {
            log.error("Error calling embedding API", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error calling embedding API: " + e.getMessage());
        }
    }
}
