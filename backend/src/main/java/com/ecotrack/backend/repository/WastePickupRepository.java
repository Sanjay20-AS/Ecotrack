package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.WastePickup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WastePickupRepository extends JpaRepository<WastePickup, Long> {
    List<WastePickup> findByWasteId(Long wasteId);
    List<WastePickup> findByFacilityId(Long facilityId);
    List<WastePickup> findByStatus(String status);
}
