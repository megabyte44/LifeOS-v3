package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.*;
import com.lifos.backend.event.KnowledgeGraphTriggerEvent;
import com.lifos.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GymService {

    private final WorkoutSplitRepository workoutSplitRepo;
    private final CycleConfigRepository cycleConfigRepo;
    private final ProteinIntakeRepository proteinIntakeRepo;
    private final FoodLogItemRepository foodLogRepo;
    private final GymCompletionRepository gymCompletionRepo;
    private final CustomFoodRepository customFoodRepo;
    private final ProteinTargetRepository proteinTargetRepo;
    private final ActivityLogService activityLogService;
    private final ApplicationEventPublisher eventPublisher;

    // ── Workout Split ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getWorkoutSplit(String uid) {
        return workoutSplitRepo.findByUserUid(uid)
                .map(WorkoutSplit::getSplit)
                .orElse(Map.of());
    }

    @Transactional
    public Map<String, Object> updateWorkoutSplit(String uid, Map<String, Object> split) {
        log.info("Updating workout split for user [{}]", uid);
        WorkoutSplit row = workoutSplitRepo.findByUserUid(uid).orElse(
                WorkoutSplit.builder().userUid(uid).build()
        );
        row.setSplit(split);
        WorkoutSplit saved = workoutSplitRepo.save(row);
        String splitText = flattenSplit(split);
        eventPublisher.publishEvent(EmbeddingTextBuilder.buildEvent(
                uid, "workout_split", saved.getId(), splitText));
        eventPublisher.publishEvent(new KnowledgeGraphTriggerEvent(
                uid, "workout_split", saved.getId(), splitText));
        return saved.getSplit();
    }

    // ── Cycle Config ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CycleConfigResponse getCycleConfig(String uid) {
        CycleConfig row = cycleConfigRepo.findByUserUid(uid)
                .orElse(CycleConfig.builder().userUid(uid).build());
        return toCycleConfigResponse(row);
    }

    @Transactional
    public CycleConfigResponse updateCycleConfig(String uid, CycleConfigResponse req) {
        log.info("Updating cycle config for user [{}]", uid);
        CycleConfig row = cycleConfigRepo.findByUserUid(uid).orElse(
                CycleConfig.builder().userUid(uid).build()
        );
        if (req.getStartDate() != null) row.setStartDate(req.getStartDate());
        if (req.getStartDayKey() != null) row.setStartDayKey(req.getStartDayKey());
        return toCycleConfigResponse(cycleConfigRepo.save(row));
    }

    // ── Protein Intakes ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProteinIntakeResponse> getProteinIntakes(String uid) {
        return proteinIntakeRepo.findAllByUserUid(uid)
                .stream().map(this::toProteinDto).collect(Collectors.toList());
    }

    @Transactional
    public ProteinIntakeResponse addProteinIntake(String uid, CreateProteinIntakeRequest req) {
        log.debug("Adding protein intake {}g for user [{}]", req.getAmount(), uid);
        ProteinIntake intake = ProteinIntake.builder()
                .userUid(uid)
                .amount(req.getAmount())
                .timestamp(req.getTimestamp() != null ? req.getTimestamp() : java.time.Instant.now())
                .build();
        ProteinIntake saved = proteinIntakeRepo.save(intake);
        activityLogService.log(uid, "gym", "protein_logged", saved.getId(),
                "Logged " + req.getAmount() + "g protein");
        return toProteinDto(saved);
    }

    @Transactional
    public void deleteProteinIntake(String uid, UUID id) {
        ProteinIntake row = proteinIntakeRepo.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Protein intake not found"));
        log.info("Deleting protein intake [{}] for user [{}]", id, uid);
        proteinIntakeRepo.delete(row);
    }

    // ── Food Log ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FoodLogItemResponse> getFoodLog(String uid) {
        return foodLogRepo.findAllByUserUid(uid)
                .stream().map(this::toFoodDto).collect(Collectors.toList());
    }

    @Transactional
    public FoodLogItemResponse addFoodItem(String uid, CreateFoodLogItemRequest req) {
        FoodLogItem item = FoodLogItem.builder()
                .userUid(uid)
                .name(req.getName())
                .timestamp(req.getTimestamp() != null ? req.getTimestamp() : java.time.Instant.now())
                .build();
        return toFoodDto(foodLogRepo.save(item));
    }

    @Transactional
    public void deleteFoodItem(String uid, UUID id) {
        FoodLogItem row = foodLogRepo.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food item not found"));
        log.info("Deleting food log item [{}] for user [{}]", id, uid);
        foodLogRepo.delete(row);
    }

    // ── Completions ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getCompletions(String uid) {
        return gymCompletionRepo.findByUserUid(uid)
                .map(GymCompletion::getCompletions)
                .orElse(Map.of());
    }

    @Transactional
    public Map<String, Object> toggleCompletion(String uid, UpdateCompletionRequest req) {
        GymCompletion row = gymCompletionRepo.findByUserUid(uid).orElse(
                GymCompletion.builder().userUid(uid).build()
        );
        Map<String, Object> completions = new HashMap<>(row.getCompletions());
        if (Boolean.TRUE.equals(req.getCompleted())) {
            completions.put(req.getDate(), true);
            activityLogService.log(uid, "gym", "workout_completed", null,
                    "Completed gym workout for " + req.getDate());
        } else {
            completions.remove(req.getDate());
        }
        row.setCompletions(completions);
        return gymCompletionRepo.save(row).getCompletions();
    }

    // ── Custom Foods ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<String> getCustomFoods(String uid) {
        return customFoodRepo.findByUserUid(uid)
                .map(CustomFood::getFoods)
                .orElse(List.of());
    }

    @Transactional
    public List<String> updateCustomFoods(String uid, UpdateCustomFoodsRequest req) {
        CustomFood row = customFoodRepo.findByUserUid(uid).orElse(
                CustomFood.builder().userUid(uid).build()
        );
        row.setFoods(req.getFoods() != null ? req.getFoods() : List.of());
        return customFoodRepo.save(row).getFoods();
    }

    // ── Protein Target ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public int getProteinTarget(String uid) {
        return proteinTargetRepo.findByUserUid(uid)
                .map(ProteinTarget::getTarget)
                .orElse(150);
    }

    @Transactional
    public int updateProteinTarget(String uid, UpdateProteinTargetRequest req) {
        ProteinTarget row = proteinTargetRepo.findByUserUid(uid).orElse(
                ProteinTarget.builder().userUid(uid).build()
        );
        if (req.getTarget() != null) row.setTarget(req.getTarget());
        return proteinTargetRepo.save(row).getTarget();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private CycleConfigResponse toCycleConfigResponse(CycleConfig c) {
        CycleConfigResponse r = new CycleConfigResponse();
        r.setStartDate(c.getStartDate());
        r.setStartDayKey(c.getStartDayKey());
        return r;
    }

    private ProteinIntakeResponse toProteinDto(ProteinIntake p) {
        ProteinIntakeResponse r = new ProteinIntakeResponse();
        r.setId(p.getId());
        r.setAmount(p.getAmount());
        r.setTimestamp(p.getTimestamp());
        return r;
    }

    private FoodLogItemResponse toFoodDto(FoodLogItem f) {
        FoodLogItemResponse r = new FoodLogItemResponse();
        r.setId(f.getId());
        r.setName(f.getName());
        r.setTimestamp(f.getTimestamp());
        return r;
    }

    private String flattenSplit(Map<String, Object> split) {
        if (split == null || split.isEmpty()) return "workout split";
        StringBuilder sb = new StringBuilder("Workout Split: ");
        split.forEach((day, val) -> sb.append(day).append(": ").append(val).append("; "));
        return sb.toString();
    }
}
