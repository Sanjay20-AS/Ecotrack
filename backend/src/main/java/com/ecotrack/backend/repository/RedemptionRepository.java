package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.Redemption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RedemptionRepository extends JpaRepository<Redemption, Long> {
    List<Redemption> findByUserIdOrderByRedeemedAtDesc(Long userId);
    int countByUserId(Long userId);
}
