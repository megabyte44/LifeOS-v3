package com.lifos.backend.controller;

import com.lifos.backend.dto.*;
import com.lifos.backend.security.SecurityUtils;
import com.lifos.backend.service.PlannerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/planner")
@RequiredArgsConstructor
public class PlannerController {

    private final PlannerService plannerService;

    /** GET /api/planner → Record<string, PlannerItem[]> */
    @GetMapping
    public Map<String, List<PlannerItemResponse>> getSchedule() {
        return plannerService.getSchedule(SecurityUtils.getCurrentUserUid());
    }

    /** PUT /api/planner/{day} → replace entire day, return full schedule */
    @PutMapping("/{day}")
    public Map<String, List<PlannerItemResponse>> updateDay(
            @PathVariable String day,
            @RequestBody UpdateDayScheduleRequest req) {
        return plannerService.updateDay(SecurityUtils.getCurrentUserUid(), day, req);
    }

    /** POST /api/planner/{day}/items → add single item */
    @PostMapping("/{day}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public PlannerItemResponse addItem(
            @PathVariable String day,
            @RequestBody CreatePlannerItemRequest req) {
        return plannerService.addItem(SecurityUtils.getCurrentUserUid(), day, req);
    }

    /** PUT /api/planner/{day}/items/{id} → update single item */
    @PutMapping("/{day}/items/{id}")
    public PlannerItemResponse updateItem(
            @PathVariable String day,
            @PathVariable UUID id,
            @RequestBody UpdatePlannerItemRequest req) {
        return plannerService.updateItem(SecurityUtils.getCurrentUserUid(), day, id, req);
    }

    /** DELETE /api/planner/{day}/items/{id} → delete single item */
    @DeleteMapping("/{day}/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(
            @PathVariable String day,
            @PathVariable UUID id) {
        plannerService.deleteItem(SecurityUtils.getCurrentUserUid(), day, id);
    }
}
