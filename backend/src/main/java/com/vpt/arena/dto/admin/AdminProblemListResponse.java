package com.vpt.arena.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminProblemListResponse {
    private List<AdminProblemDto> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
}
