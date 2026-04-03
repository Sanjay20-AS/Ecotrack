package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.CarbonFootprintSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarbonFootprintRepository extends JpaRepository<CarbonFootprintSummary, Long> {
    List<CarbonFootprintSummary> findByUserId(Long userId);
    CarbonFootprintSummary findByUserIdAndMonthAndYear(Long userId, int month, int year);
}
