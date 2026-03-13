package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.GymService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/gym")
@RequiredArgsConstructor
public class GymController {

    private final GymService gymService;

    // ── Workout Split ─────────────────────────────────────────────────────────

    @GetMapping("/workout-split")
    public Map<String, Object> getWorkoutSplit() {
        return gymService.getWorkoutSplit(SecurityUtils.getCurrentUserUid());
    }

    @PutMapping("/workout-split")
    public Map<String, Object> updateWorkoutSplit(@RequestBody Map<String, Object> body) {
        return gymService.updateWorkoutSplit(SecurityUtils.getCurrentUserUid(), body);
    }

    // ── Cycle Config ──────────────────────────────────────────────────────────

    @GetMapping("/cycle-config")
    public CycleConfigResponse getCycleConfig() {
        return gymService.getCycleConfig(SecurityUtils.getCurrentUserUid());
    }

    @PutMapping("/cycle-config")
    public CycleConfigResponse updateCycleConfig(@RequestBody CycleConfigResponse req) {
        return gymService.updateCycleConfig(SecurityUtils.getCurrentUserUid(), req);
    }

    // ── Protein Intakes ───────────────────────────────────────────────────────

    @GetMapping("/protein-intakes")
    public List<ProteinIntakeResponse> getProteinIntakes() {
        return gymService.getProteinIntakes(SecurityUtils.getCurrentUserUid());
    }

    @PostMapping("/protein-intakes")
    @ResponseStatus(HttpStatus.CREATED)
    public ProteinIntakeResponse addProteinIntake(@RequestBody CreateProteinIntakeRequest req) {
        return gymService.addProteinIntake(SecurityUtils.getCurrentUserUid(), req);
    }

    @DeleteMapping("/protein-intakes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProteinIntake(@PathVariable UUID id) {
        gymService.deleteProteinIntake(SecurityUtils.getCurrentUserUid(), id);
    }

    // ── Food Log ──────────────────────────────────────────────────────────────

    @GetMapping("/food-log")
    public List<FoodLogItemResponse> getFoodLog() {
        return gymService.getFoodLog(SecurityUtils.getCurrentUserUid());
    }

    @PostMapping("/food-log")
    @ResponseStatus(HttpStatus.CREATED)
    public FoodLogItemResponse addFoodItem(@RequestBody CreateFoodLogItemRequest req) {
        return gymService.addFoodItem(SecurityUtils.getCurrentUserUid(), req);
    }

    @DeleteMapping("/food-log/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFoodItem(@PathVariable UUID id) {
        gymService.deleteFoodItem(SecurityUtils.getCurrentUserUid(), id);
    }

    // ── Completions ───────────────────────────────────────────────────────────

    @GetMapping("/completions")
    public Map<String, Object> getCompletions() {
        return gymService.getCompletions(SecurityUtils.getCurrentUserUid());
    }

    @PutMapping("/completions")
    public Map<String, Object> toggleCompletion(@RequestBody UpdateCompletionRequest req) {
        return gymService.toggleCompletion(SecurityUtils.getCurrentUserUid(), req);
    }

    // ── Custom Foods ──────────────────────────────────────────────────────────

    @GetMapping("/custom-foods")
    public List<String> getCustomFoods() {
        return gymService.getCustomFoods(SecurityUtils.getCurrentUserUid());
    }

    @PutMapping("/custom-foods")
    public List<String> updateCustomFoods(@RequestBody UpdateCustomFoodsRequest req) {
        return gymService.updateCustomFoods(SecurityUtils.getCurrentUserUid(), req);
    }

    // ── Protein Target ────────────────────────────────────────────────────────

    @GetMapping("/protein-target")
    public Map<String, Integer> getProteinTarget() {
        return Map.of("target", gymService.getProteinTarget(SecurityUtils.getCurrentUserUid()));
    }

    @PutMapping("/protein-target")
    public Map<String, Integer> updateProteinTarget(@RequestBody UpdateProteinTargetRequest req) {
        return Map.of("target", gymService.updateProteinTarget(SecurityUtils.getCurrentUserUid(), req));
    }
}
