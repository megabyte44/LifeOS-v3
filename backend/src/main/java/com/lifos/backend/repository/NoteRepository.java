package com.lifos.backend.repository;

import com.lifos.backend.entity.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NoteRepository extends JpaRepository<Note, UUID> {
    List<Note> findAllByUserUidOrderByCreatedAtDesc(String userUid);
    Optional<Note> findByIdAndUserUid(UUID id, String userUid);
    long countByUserUid(String userUid);
}
