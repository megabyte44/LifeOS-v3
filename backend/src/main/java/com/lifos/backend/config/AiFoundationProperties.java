package com.lifos.backend.config;

import java.time.Duration;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai")
public class AiFoundationProperties {

    private final Embedding embedding = new Embedding();
    private final Streaming streaming = new Streaming();
    private final Rag rag = new Rag();
    private final Async async = new Async();

    @Getter
    @Setter
    public static class Embedding {
        private String provider = "openai";
        private String model = "text-embedding-3-small";
        private String baseUrl = "https://api.openai.com/v1";
        private String apiKey = "";
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