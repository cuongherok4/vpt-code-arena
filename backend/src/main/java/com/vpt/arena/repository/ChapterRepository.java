package com.vpt.arena.repository;

import com.vpt.arena.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

    @Query("SELECT DISTINCT c FROM Chapter c LEFT JOIN FETCH c.lessons ORDER BY c.order ASC")
    List<Chapter> findAllWithLessons();
}
