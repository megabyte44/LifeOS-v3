package com.lifos.backend.controller;

import com.lifos.backend.dto.CreateGoalRequest;
import com.lifos.backend.dto.GoalResponse;
import com.lifos.backend.dto.UpdateGoalRequest;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public List<GoalResponse> getAll() {
        return goalService.getAll(SecurityUtils.getCurrentUserUid());
    }

    @GetMapping("/{id}")
    public GoalResponse getById(@PathVariable UUID id) {
        return goalService.getById(SecurityUtils.getCurrentUserUid(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse create(@RequestBody CreateGoalRequest req) {
        return goalService.create(SecurityUtils.getCurrentUserUid(), req);
    }

    @PutMapping("/{id}")
    public GoalResponse update(@PathVariable UUID id, @RequestBody UpdateGoalRequest req) {
        return goalService.update(SecurityUtils.getCurrentUserUid(), id, req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        goalService.delete(SecurityUtils.getCurrentUserUid(), id);
    }
}
