package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.PlannerItem;
import com.lifos.backend.entity.User;
import com.lifos.backend.repository.PlannerItemRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlannerService {

    private final PlannerItemRepository plannerRepo;
    private final UserRepository userRepo;

    // ── GET /api/planner ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, List<PlannerItemResponse>> getSchedule(String uid) {
        List<PlannerItem> all = plannerRepo.findAllByUserUid(uid);
        return all.stream()
                .collect(Collectors.groupingBy(
                        PlannerItem::getDay,
                        Collectors.mapping(this::toResponse, Collectors.toList())
                ));
    }

    // ── PUT /api/planner/{day} ─────────────────────────────────────────────────

    @Transactional
    public Map<String, List<PlannerItemResponse>> updateDay(String uid, String day,
                                                            UpdateDayScheduleRequest req) {
        User user = getUser(uid);
        plannerRepo.deleteAllByUserUidAndDay(uid, day);
        plannerRepo.flush();

        if (req.getItems() != null) {
            req.getItems().forEach(itemDto -> {
                PlannerItem item = PlannerItem.builder()
                        .user(user)
                        .day(day)
                        .startTime(itemDto.getStartTime())
                        .endTime(itemDto.getEndTime())
                        .title(itemDto.getTitle())
                        .tag(itemDto.getTag())
                        .build();
                plannerRepo.save(item);
            });
        }
        return getSchedule(uid);
    }

    // ── POST /api/planner/{day}/items ─────────────────────────────────────────

    @Transactional
    public PlannerItemResponse addItem(String uid, String day, CreatePlannerItemRequest req) {
        User user = getUser(uid);
        PlannerItem item = PlannerItem.builder()
                .user(user)
                .day(day)
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .title(req.getTitle())
                .tag(req.getTag())
                .build();
        return toResponse(plannerRepo.save(item));
    }

    // ── PUT /api/planner/{day}/items/{id} ─────────────────────────────────────

    @Transactional
    public PlannerItemResponse updateItem(String uid, String day, UUID id,
                                          UpdatePlannerItemRequest req) {
        PlannerItem item = plannerRepo.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planner item not found"));

        if (req.getStartTime() != null) item.setStartTime(req.getStartTime());
        if (req.getEndTime() != null) item.setEndTime(req.getEndTime());
        if (req.getTitle() != null) item.setTitle(req.getTitle());
        if (req.getTag() != null) item.setTag(req.getTag());

        return toResponse(plannerRepo.save(item));
    }

    // ── DELETE /api/planner/{day}/items/{id} ──────────────────────────────────

    @Transactional
    public void deleteItem(String uid, String day, UUID id) {
        PlannerItem item = plannerRepo.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Planner item not found"));
        plannerRepo.delete(item);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User getUser(String uid) {
        return userRepo.findById(uid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private PlannerItemResponse toResponse(PlannerItem item) {
        PlannerItemResponse r = new PlannerItemResponse();
        r.setId(item.getId());
        r.setDay(item.getDay());
        r.setStartTime(item.getStartTime());
        r.setEndTime(item.getEndTime());
        r.setTitle(item.getTitle());
        r.setTag(item.getTag());
        return r;
    }
}
