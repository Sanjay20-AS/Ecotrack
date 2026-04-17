package com.ecotrack.backend.repository;

import com.ecotrack.backend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    @Query("SELECT e FROM Event e WHERE e.eventDate >= :now ORDER BY e.eventDate ASC")
    List<Event> findUpcomingEvents(@Param("now") LocalDateTime now);
    
    @Query("SELECT e FROM Event e WHERE e.location = :location AND e.eventDate >= :now ORDER BY e.eventDate ASC")
    List<Event> findUpcomingEventsByLocation(@Param("location") String location, @Param("now") LocalDateTime now);
    
    @Query("SELECT e FROM Event e WHERE e.category = :category AND e.eventDate >= :now ORDER BY e.eventDate ASC")
    List<Event> findUpcomingEventsByCategory(@Param("category") String category, @Param("now") LocalDateTime now);
    
    @Query("SELECT e FROM Event e WHERE e.location = :location AND e.category = :category AND e.eventDate >= :now ORDER BY e.eventDate ASC")
    List<Event> findUpcomingEventsByLocationAndCategory(@Param("location") String location, @Param("category") String category, @Param("now") LocalDateTime now);
}
