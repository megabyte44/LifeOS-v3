package com.lifos.backend.service;

import com.lifos.backend.dto.UpdateUserRequest;
import com.lifos.backend.dto.UserProfileResponse;
import com.lifos.backend.entity.User;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User ensureUserExists(String uid, String email, String displayName, String photoUrl) {
        return userRepository.findById(uid).orElseGet(() -> {
            log.info("First login for user {} — creating profile", uid);
            return userRepository.save(User.builder()
                    .uid(uid)
                    .email(email != null ? email : uid + "@firebase.local")
                    .displayName(displayName)
                    .photoURL(photoUrl)
                    .role("user")
                    .build());
        });
    }

    public UserProfileResponse getUserProfile(String uid) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
        return toResponse(user);
    }

    @Transactional
    public UserProfileResponse updateUser(String uid, UpdateUserRequest request) {
        User user = userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
        if (request.getDisplayName() != null) user.setDisplayName(request.getDisplayName());
        if (request.getPhotoURL() != null)    user.setPhotoURL(request.getPhotoURL());
        return toResponse(userRepository.save(user));
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .uid(user.getUid())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .photoURL(user.getPhotoURL())
                .role(user.getRole())
                .createdAt(user.getCreatedAt().toString())
                .build();
    }
}
