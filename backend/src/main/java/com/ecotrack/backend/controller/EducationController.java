package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.EducationContent;
import com.ecotrack.backend.repository.EducationContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/education")
public class EducationController {

    @Autowired
    private EducationContentRepository educationContentRepository;

    @GetMapping
    public List<EducationContent> getAll() {
        return educationContentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @GetMapping("/category/{category}")
    public List<EducationContent> getByCategory(@PathVariable String category) {
        return educationContentRepository.findByCategory(category);
    }

    @GetMapping("/featured")
    public List<EducationContent> getFeatured() {
        return educationContentRepository.findAll(Sort.by(Sort.Direction.DESC, "viewsCount"))
                .stream().limit(3).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EducationContent> getById(@PathVariable Long id) {
        return educationContentRepository.findById(id).map(content -> {
            content.setViewsCount(content.getViewsCount() + 1);
            educationContentRepository.save(content);
            return ResponseEntity.ok(content);
        }).orElse(ResponseEntity.notFound().build());
    }
}
