package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.Facility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long> {
    List<Facility> findByType(String type);
    List<Facility> findByIsActive(boolean isActive);
    List<Facility> findAll();
}
