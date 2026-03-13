package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.*;
import com.lifos.backend.event.EmbeddingTriggerEvent;
import com.lifos.backend.repository.GoalRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepo;
    private final UserRepository userRepo;
    private final ApplicationEventPublisher eventPublisher;
    private final ActivityLogService activityLogService;

    // ─── Public API ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<GoalResponse> getAll(String uid) {
        return goalRepo.findAllByUserUidWithChildren(uid)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GoalResponse getById(String uid, UUID id) {
        Goal g = goalRepo.findByIdAndUserUidWithChildren(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
        return toResponse(g);
    }

    @Transactional
    public GoalResponse create(String uid, CreateGoalRequest req) {
        User user = userRepo.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        log.info("Creating goal '{}' for user [{}]", req.getTitle(), uid);
        Goal goal = Goal.builder()
                .user(user)
                .title(req.getTitle())
                .category(req.getCategory())
                .goalType(req.getGoalType())
                .motive(req.getMotive() != null ? req.getMotive() : "")
                .description(req.getDescription() != null ? req.getDescription() : "")
                .linkedHabitIds(req.getLinkedHabitIds() != null ? req.getLinkedHabitIds() : List.of())
                .startDate(req.getStartDate())
                .targetDate(req.getTargetDate())
                .archived(false)
                .build();

        applyChildren(goal, req.getProgressTrackers(), req.getSubGoals(), req.getNotes(), req.getResources());

        Goal saved = goalRepo.save(goal);
        eventPublisher.publishEvent(new EmbeddingTriggerEvent(
                uid, "goal", saved.getId(), buildEmbedText(saved)));
        activityLogService.log(uid, "goals", "created", saved.getId(), "Created goal: " + saved.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public GoalResponse update(String uid, UUID id, UpdateGoalRequest req) {
        log.debug("Updating goal [{}] for user [{}]", id, uid);
        Goal goal = goalRepo.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
        boolean wasCompleted = goal.getCompletedAt() != null;
        boolean wasArchived = Boolean.TRUE.equals(goal.getArchived());

        if (req.getTitle() != null) goal.setTitle(req.getTitle());
        if (req.getCategory() != null) goal.setCategory(req.getCategory());
        if (req.getGoalType() != null) goal.setGoalType(req.getGoalType());
        if (req.getMotive() != null) goal.setMotive(req.getMotive());
        if (req.getDescription() != null) goal.setDescription(req.getDescription());
        if (req.getLinkedHabitIds() != null) goal.setLinkedHabitIds(req.getLinkedHabitIds());
        if (req.getStartDate() != null) goal.setStartDate(req.getStartDate());
        if (req.getTargetDate() != null) goal.setTargetDate(req.getTargetDate());
        if (req.getCompletedAt() != null) goal.setCompletedAt(req.getCompletedAt());
        if (req.getArchived() != null) goal.setArchived(req.getArchived());

        // Replace children entirely (orphanRemoval=true cleans old rows)
        goal.getProgressTrackers().clear();
        goal.getSubGoals().clear();
        goal.getNotes().clear();
        goal.getResources().clear();

        applyChildren(goal, req.getProgressTrackers(), req.getSubGoals(), req.getNotes(), req.getResources());

        Goal updated = goalRepo.save(goal);
        eventPublisher.publishEvent(new EmbeddingTriggerEvent(
                uid, "goal", updated.getId(), buildEmbedText(updated)));
        if (!wasCompleted && updated.getCompletedAt() != null) {
            activityLogService.log(uid, "goals", "completed", updated.getId(), "Completed goal: " + updated.getTitle());
        } else if (!wasArchived && Boolean.TRUE.equals(updated.getArchived())) {
            activityLogService.log(uid, "goals", "archived", updated.getId(), "Archived goal: " + updated.getTitle());
        }
        return toResponse(updated);
    }

    @Transactional
    public void delete(String uid, UUID id) {
        Goal goal = goalRepo.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Goal not found"));
        log.info("Deleting goal [{}] for user [{}]", id, uid);
        eventPublisher.publishEvent(new EmbeddingTriggerEvent(uid, "goal", goal.getId(), null));
        String goalTitle = goal.getTitle();
        goalRepo.delete(goal);
        activityLogService.log(uid, "goals", "deleted", id, "Deleted goal: " + goalTitle);
    }

    private String buildEmbedText(Goal g) {
        return g.getTitle() + "\n" + g.getDescription() + "\n" + g.getMotive();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void applyChildren(Goal goal,
                               List<ProgressTrackerDto> trackers,
                               List<SubGoalDto> subGoals,
                               List<GoalNoteDto> notes,
                               List<GoalResourceDto> resources) {

        if (trackers != null) {
            trackers.forEach(dto -> {
                ProgressTracker pt = ProgressTracker.builder()
                        .goal(goal)
                        .type(dto.getType())
                        .label(dto.getLabel())
                        .current(dto.getCurrent())
                        .target(dto.getTarget())
                        .stars(dto.getStars())
                        .maxStars(dto.getMaxStars())
                        .status(dto.getStatus())
                        .totalDots(dto.getTotalDots())
                        .filledDots(dto.getFilledDots())
                        .order(dto.getOrder() != null ? dto.getOrder() : 0)
                        .build();
                goal.getProgressTrackers().add(pt);
            });
        }

        if (subGoals != null) {
            subGoals.forEach(dto -> goal.getSubGoals().add(buildSubGoal(goal, dto, null)));
        }

        if (notes != null) {
            notes.forEach(dto -> {
                GoalNote note = GoalNote.builder()
                        .goal(goal)
                        .title(dto.getTitle())
                        .content(dto.getContent() != null ? dto.getContent() : "")
                        .order(dto.getOrder() != null ? dto.getOrder() : 0)
                        .build();
                goal.getNotes().add(note);
            });
        }

        if (resources != null) {
            resources.forEach(dto -> {
                GoalResource res = GoalResource.builder()
                        .goal(goal)
                        .type(dto.getType())
                        .title(dto.getTitle())
                        .url(dto.getUrl())
                        .description(dto.getDescription())
                        .order(dto.getOrder() != null ? dto.getOrder() : 0)
                        .build();
                goal.getResources().add(res);
            });
        }
    }

    private SubGoal buildSubGoal(Goal goal, SubGoalDto dto, SubGoal parent) {
        SubGoal sg = SubGoal.builder()
                .goal(goal)
                .parent(parent)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
                .completedAt(dto.getCompletedAt())
                .level(dto.getLevel() != null ? dto.getLevel() : (parent == null ? 0 : parent.getLevel() + 1))
                .order(dto.getOrder() != null ? dto.getOrder() : 0)
                .build();

        if (dto.getChildren() != null) {
            dto.getChildren().forEach(child -> sg.getChildren().add(buildSubGoal(goal, child, sg)));
        }
        return sg;
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private GoalResponse toResponse(Goal g) {
        GoalResponse r = new GoalResponse();
        r.setId(g.getId());
        r.setTitle(g.getTitle());
        r.setCategory(g.getCategory());
        r.setGoalType(g.getGoalType());
        r.setMotive(g.getMotive());
        r.setDescription(g.getDescription());
        r.setLinkedHabitIds(g.getLinkedHabitIds());
        r.setStartDate(g.getStartDate());
        r.setTargetDate(g.getTargetDate());
        r.setCompletedAt(g.getCompletedAt());
        r.setArchived(g.getArchived());
        r.setCreatedAt(g.getCreatedAt());
        r.setUpdatedAt(g.getUpdatedAt());
        r.setProgressTrackers(g.getProgressTrackers().stream().map(this::toTrackerDto).collect(Collectors.toList()));
        r.setSubGoals(g.getSubGoals().stream()
                .filter(sg -> sg.getParent() == null)
                .map(this::toSubGoalDto)
                .collect(Collectors.toList()));
        r.setNotes(g.getNotes().stream().map(this::toNoteDto).collect(Collectors.toList()));
        r.setResources(g.getResources().stream().map(this::toResourceDto).collect(Collectors.toList()));
        return r;
    }

    private ProgressTrackerDto toTrackerDto(ProgressTracker pt) {
        ProgressTrackerDto d = new ProgressTrackerDto();
        d.setId(pt.getId());
        d.setType(pt.getType());
        d.setLabel(pt.getLabel());
        d.setCurrent(pt.getCurrent());
        d.setTarget(pt.getTarget());
        d.setStars(pt.getStars());
        d.setMaxStars(pt.getMaxStars());
        d.setStatus(pt.getStatus());
        d.setTotalDots(pt.getTotalDots());
        d.setFilledDots(pt.getFilledDots());
        d.setOrder(pt.getOrder());
        return d;
    }

    private SubGoalDto toSubGoalDto(SubGoal sg) {
        SubGoalDto d = new SubGoalDto();
        d.setId(sg.getId());
        d.setParentId(sg.getParent() != null ? sg.getParent().getId() : null);
        d.setTitle(sg.getTitle());
        d.setDescription(sg.getDescription());
        d.setCompleted(sg.getCompleted());
        d.setCompletedAt(sg.getCompletedAt());
        d.setLevel(sg.getLevel());
        d.setOrder(sg.getOrder());
        d.setChildren(sg.getChildren().stream().map(this::toSubGoalDto).collect(Collectors.toList()));
        return d;
    }

    private GoalNoteDto toNoteDto(GoalNote n) {
        GoalNoteDto d = new GoalNoteDto();
        d.setId(n.getId());
        d.setTitle(n.getTitle());
        d.setContent(n.getContent());
        d.setOrder(n.getOrder());
        d.setCreatedAt(n.getCreatedAt());
        d.setUpdatedAt(n.getUpdatedAt());
        return d;
    }

    private GoalResourceDto toResourceDto(GoalResource res) {
        GoalResourceDto d = new GoalResourceDto();
        d.setId(res.getId());
        d.setType(res.getType());
        d.setTitle(res.getTitle());
        d.setUrl(res.getUrl());
        d.setDescription(res.getDescription());
        d.setOrder(res.getOrder());
        return d;
    }
}
