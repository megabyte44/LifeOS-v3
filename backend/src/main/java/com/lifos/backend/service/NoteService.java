package com.lifos.backend.service;

import com.lifos.backend.dto.*;
import com.lifos.backend.entity.Note;
import com.lifos.backend.entity.User;
import com.lifos.backend.exception.ResourceNotFoundException;
import com.lifos.backend.repository.NoteRepository;
import com.lifos.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    private User getUser(String uid) {
        return userRepository.findById(uid)
                .orElseThrow(() -> new ResourceNotFoundException("User", "uid", uid));
    }

    private NoteResponse toResponse(Note n) {
        return NoteResponse.builder()
                .id(n.getId().toString())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .createdAt(n.getCreatedAt().toString())
                .build();
    }

    public List<NoteResponse> getAll(String uid) {
        return noteRepository.findAllByUserUidOrderByCreatedAtDesc(uid)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public NoteResponse create(String uid, CreateNoteRequest req) {
        User user = getUser(uid);
        Note n = Note.builder()
                .user(user)
                .title(req.getTitle())
                .content(req.getContent())
                .type(req.getType())
                .build();
        return toResponse(noteRepository.save(n));
    }

    @Transactional
    public NoteResponse update(String uid, UUID id, UpdateNoteRequest req) {
        Note n = noteRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", id));
        if (req.getTitle()   != null) n.setTitle(req.getTitle());
        if (req.getContent() != null) n.setContent(req.getContent());
        if (req.getType()    != null) n.setType(req.getType());
        return toResponse(noteRepository.save(n));
    }

    @Transactional
    public void delete(String uid, UUID id) {
        Note n = noteRepository.findByIdAndUserUid(id, uid)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", id));
        noteRepository.delete(n);
    }
}
