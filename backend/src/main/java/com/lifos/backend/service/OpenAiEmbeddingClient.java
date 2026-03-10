package com.lifos.backend.service;

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

    private final AiConfigurationResolver aiConfigurationResolver;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public float[] getEmbedding(String text) {
        String openAiKey = aiConfigurationResolver.resolveProviderApiKey("openai", aiConfigurationResolver.resolve().getApiKeys());

        if (openAiKey == null || openAiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "OpenAI API key not configured for embeddings");
        }

        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", "text-embedding-3-small");
            body.put("input", text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openAiKey);

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://api.openai.com/v1/embeddings", entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode data = root.get("data").get(0).get("embedding");
                float[] embedding = new float[data.size()];
                for (int i = 0; i < data.size(); i++) {
                    embedding[i] = (float) data.get(i).asDouble();
                }
                return embedding;
            } else {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to get embedding from OpenAI");
            }
        } catch (Exception e) {
            log.error("Error calling OpenAI Embedding API", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error calling OpenAI Embedding API: " + e.getMessage());
        }
    }
}
