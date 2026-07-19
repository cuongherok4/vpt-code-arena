package com.vpt.arena.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AdminUserListResponse {
    private List<AdminUserDto> items;
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
}
