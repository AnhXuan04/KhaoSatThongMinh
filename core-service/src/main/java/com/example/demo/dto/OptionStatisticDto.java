package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class OptionStatisticDto {
    private String text;
    private int count;
    private int percentage;
}
