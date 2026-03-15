package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.Waste;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WasteRepository extends JpaRepository<Waste, Long> {
    List<Waste> findByUserId(Long userId);
    List<Waste> findByType(String type);
    List<Waste> findByStatus(String status);
    List<Waste> findByCollectedById(Long collectorId);
    List<Waste> findByCollectedByIdAndStatus(Long collectorId, String status);
}
