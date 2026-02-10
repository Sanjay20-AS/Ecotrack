package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.EducationContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationContentRepository extends JpaRepository<EducationContent, Long> {
    List<EducationContent> findByCategory(String category);
    List<EducationContent> findByDifficulty(String difficulty);
    List<EducationContent> findByCreatedByIdOrderByCreatedAtDesc(Long createdBy);
}
