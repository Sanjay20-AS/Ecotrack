package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.MarketplaceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketplaceItemRepository extends JpaRepository<MarketplaceItem, Long> {
    List<MarketplaceItem> findByCategory(String category);
    List<MarketplaceItem> findBySellerId(Long sellerId);
    List<MarketplaceItem> findByStatus(String status);
}
