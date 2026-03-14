package com.lifos.backend.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai")
public class AiFoundationProperties {

    // ── Provider selection ──────────────────────────────────────────────────
    /** Set via AI_PROVIDER in .env — forces a specific provider (openai|openrouter|gemini) */
    private String provider = "";
    /** Set via AI_MODEL in .env — overrides the default model for the chosen provider */
    private String model = "";

    // ── API keys (sourced from .env / environment) ────────────────────────────
    /** Set via OPENAI_API_KEY */
    private String openaiApiKey = "";
    /** Set via OPENROUTER_API_KEY */
    private String openrouterApiKey = "";
    /** Optional dedicated embedding key via OPENROUTER_EMBEDDING_API_KEY */
    private String openrouterEmbeddingApiKey = "";
    /** Set via GEMINI_API_KEY or GOOGLE_API_KEY */
    private String geminiApiKey = "";

    private final Embedding embedding = new Embedding();
    private final Streaming streaming = new Streaming();
    private final Rag rag = new Rag();
    private final Async async = new Async();

    /** Embedding config — apiKey is read from the top-level openaiApiKey field */
    @Getter
    @Setter
    public static class Embedding {
        /** Embedding model name (defaults to OpenAI small embedding). */
        private String model = "text-embedding-3-small";
        private int dimensions = 1536;
        private int maxInputChars = 24000;
    }

    @Getter
    @Setter
    public static class Streaming {
        private Duration connectTimeout = Duration.ofSeconds(10);
        private Duration responseTimeout = Duration.ofSeconds(120);
    }

    @Getter
    @Setter
    public static class Rag {
        private int defaultVectorLimit = 5;
        private int maxContextChunks = 5;
        /** Runtime flag: use hybrid memory retrieval strategy. */
        private boolean enableHybridReads = true;
        /** Runtime flag: enable adaptive top-k and token budget selection. */
        private boolean enableDynamicTopK = true;
        /** Runtime flag: embed extracted conversation memories. */
        private boolean enableConversationMemoryEmbeddings = true;
    }

    @Getter
    @Setter
    public static class Async {
        private int corePoolSize = 4;
        private int maxPoolSize = 8;
        private int queueCapacity = 100;
        private String threadNamePrefix = "ai-";
    }
}