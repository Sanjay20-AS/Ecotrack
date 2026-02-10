package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.Community;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunityRepository extends JpaRepository<Community, Long> {
    List<Community> findByCategory(String category);
    List<Community> findByCreatorId(Long creatorId);
}
