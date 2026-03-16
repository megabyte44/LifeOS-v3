package com.lifos.backend.service;

import com.lifos.backend.repository.ConversationMemoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link MemoryLifecycleService}.
 *
 * Covers:
 * - expireTemporalMemories() calls expireStaleMemories with a current timestamp
 * - The timestamp passed is within a tight window of Instant.now()
 * - No logging / side-effects when 0 memories are expired
 * - Expired count > 0 still completes without throwing
 */
@ExtendWith(MockitoExtension.class)
class MemoryLifecycleServiceTest {

    @Mock ConversationMemoryRepository memoryRepository;

    @InjectMocks MemoryLifecycleService service;

    @Test
    void expireTemporalMemories_callsRepositoryWithCurrentInstant() {
        when(memoryRepository.expireStaleMemories(any())).thenReturn(0);

        Instant before = Instant.now();
        service.expireTemporalMemories();
        Instant after = Instant.now();

        ArgumentCaptor<Instant> captor = ArgumentCaptor.forClass(Instant.class);
        verify(memoryRepository).expireStaleMemories(captor.capture());

        Instant passedInstant = captor.getValue();
        assertThat(passedInstant).isAfterOrEqualTo(before.minusSeconds(1));
        assertThat(passedInstant).isBeforeOrEqualTo(after.plusSeconds(1));
    }

    @Test
    void expireTemporalMemories_zeroExpired_completesWithoutError() {
        when(memoryRepository.expireStaleMemories(any())).thenReturn(0);
        assertThatNoException().isThrownBy(() -> service.expireTemporalMemories());
    }

    @Test
    void expireTemporalMemories_someExpired_completesWithoutError() {
        when(memoryRepository.expireStaleMemories(any())).thenReturn(5);
        assertThatNoException().isThrownBy(() -> service.expireTemporalMemories());
        verify(memoryRepository, times(1)).expireStaleMemories(any());
    }

    @Test
    void expireTemporalMemories_repositoryThrows_propagatesException() {
        when(memoryRepository.expireStaleMemories(any()))
                .thenThrow(new RuntimeException("DB error"));
        assertThatThrownBy(() -> service.expireTemporalMemories())
                .isInstanceOf(RuntimeException.class)
                .hasMessage("DB error");
    }
}
