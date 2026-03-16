package com.lifos.backend;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
@ConfigurationPropertiesScan
public class LifeOsBackendApplication {

	public static void main(String[] args) {
		// Force Asia/Kolkata before any bean (Flyway/Hikari) initializes.
		// Without this, the JVM uses Windows "India Standard Time" which maps to
		// the deprecated "Asia/Calcutta" name — rejected by PostgreSQL on Neon/Railway.
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
		SpringApplication.run(LifeOsBackendApplication.class, args);
	}

}
