package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.Preference;
import com.lifos.backend.repository.PreferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PreferenceService {

    private final PreferenceRepository preferenceRepository;

    public PreferenceResponse get(String uid) {
        Preference p = preferenceRepository.findByUserUid(uid)
                .orElse(buildDefault(uid));
        return toResponse(p);
    }

    @Transactional
    public PreferenceResponse update(String uid, UpdatePreferenceRequest req) {
        Preference p = preferenceRepository.findByUserUid(uid)
                .orElse(buildDefault(uid));
        if (req.getFeatures()   != null) p.setFeatures(req.getFeatures());
        if (req.getOnboarding() != null) p.setOnboarding(req.getOnboarding());
        return toResponse(preferenceRepository.save(p));
    }

    private PreferenceResponse toResponse(Preference p) {
        return PreferenceResponse.builder()
                .features(p.getFeatures())
                .onboarding(p.getOnboarding())
                .build();
    }

    private Preference buildDefault(String uid) {
        Map<String, Object> defaultFeatures = new HashMap<>();
        defaultFeatures.put("waterIntake",             false);
        defaultFeatures.put("todaysPlan",              true);
        defaultFeatures.put("financialSnapshot",       true);
        defaultFeatures.put("todoList",                true);
        defaultFeatures.put("habitStreaks",            true);
        defaultFeatures.put("gymTracker",              false);
        defaultFeatures.put("proteinIntake",           false);
        defaultFeatures.put("foodSupplements",         false);
        defaultFeatures.put("overloadTracker",         false);
        defaultFeatures.put("gymProteinIntake",        false);
        defaultFeatures.put("gymFoodSupplements",      false);
        defaultFeatures.put("proteinIntakeWidget",     false);
        defaultFeatures.put("supplementIntakeWidget",  false);
        return Preference.builder()
                .userUid(uid)
                .features(defaultFeatures)
                .build();
    }
}
