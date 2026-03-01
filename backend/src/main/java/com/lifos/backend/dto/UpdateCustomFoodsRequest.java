package com.lifos.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class UpdateCustomFoodsRequest {
    private List<String> foods;
}
