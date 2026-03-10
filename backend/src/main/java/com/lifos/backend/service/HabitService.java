package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.Habit;
import com.lifos.backend.entity.User;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.HabitRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    private User getUser(String uid) {
        return userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
    }

    private HabitResponse toResponse(Habit h) {
        return HabitResponse.builder()
                .id(h.getId().toString())
                .name(h.getName())
                .icon(h.getIcon())
                .target(h.getTarget())
                .completions(h.getCompletions())
                .habitType(h.getHabitType())
                .sprintDuration(h.getSprintDuration())
                .sprintEndDate(h.getSprintEndDate())
                .sprintStartDate(h.getSprintStartDate())
                .context(h.getContext())
                .build();
    }

    public List<HabitResponse> getAll(String uid, String context) {
        List<Habit> habits = (context != null && !context.isBlank())
                ? habitRepository.findAllByUserUidAndContext(uid, context)
                : habitRepository.findAllByUserUid(uid);
        return habits.stream().map(this::toResponse).toList();
    }

    @Transactional
    public HabitResponse create(String uid, CreateHabitRequest req) {
        User user = getUser(uid);
        log.info("Creating habit '{}' for user [{}]", req.getName(), uid);
        Habit h = Habit.builder()
                .user(user)
                .name(req.getName())
                .icon(req.getIcon())
                .target(req.getTarget())
                .completions(req.getCompletions() != null ? req.getCompletions() : new HashMap<>())
                .habitType(req.getHabitType())
                .sprintDuration(req.getSprintDuration())
                .sprintEndDate(req.getSprintEndDate())
                .sprintStartDate(req.getSprintStartDate())
                .context(req.getContext())
                .build();
        return toResponse(habitRepository.save(h));
    }

    @Transactional
    public HabitResponse update(String uid, UUID id, UpdateHabitRequest req) {
        log.debug("Updating habit [{}] for user [{}]", id, uid);
        Habit h = habitRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", "id", id));
        if (req.getName()            != null) h.setName(req.getName());
        if (req.getIcon()            != null) h.setIcon(req.getIcon());
        if (req.getTarget()          != null) h.setTarget(req.getTarget());
        if (req.getCompletions()     != null) h.setCompletions(req.getCompletions());
        if (req.getHabitType()       != null) h.setHabitType(req.getHabitType());
        if (req.getSprintDuration()  != null) h.setSprintDuration(req.getSprintDuration());
        if (req.getSprintEndDate()   != null) h.setSprintEndDate(req.getSprintEndDate());
        if (req.getSprintStartDate() != null) h.setSprintStartDate(req.getSprintStartDate());
        if (req.getContext()         != null) h.setContext(req.getContext());
        return toResponse(habitRepository.save(h));
    }

    @Transactional
    public void delete(String uid, UUID id) {
        Habit h = habitRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Habit", "id", id));
        log.info("Deleting habit [{}] for user [{}]", id, uid);
        habitRepository.delete(h);
    }
}
