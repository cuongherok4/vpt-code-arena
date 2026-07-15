package com.vpt.arena.repository;

import com.vpt.arena.entity.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, UUID> {

    @Query("SELECT DISTINCT c FROM Chapter c LEFT JOIN FETCH c.lessons WHERE c.language = :language ORDER BY c.order ASC")
    List<Chapter> findAllByLanguageWithLessons(@Param("language") String language);
}
