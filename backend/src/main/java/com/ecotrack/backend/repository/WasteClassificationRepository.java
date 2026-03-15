package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.WasteClassification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WasteClassificationRepository extends JpaRepository<WasteClassification, Long> {
    List<WasteClassification> findByUserIdOrderByCreatedAtDesc(Long userId);
}
