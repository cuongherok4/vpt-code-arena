package com.vpt.arena.repository;

import com.vpt.arena.entity.MessageReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageReportRepository extends JpaRepository<MessageReport, UUID> {
}
