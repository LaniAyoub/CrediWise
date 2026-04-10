package org.acme.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO for scoring analysis with detailed breakdown by criteria
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScoringAnalysisDTO {

    // Overall score (0-100)
    private Double overallScore;

    // Risk level: LOW, MEDIUM, HIGH, VERY_HIGH
    private String riskLevel;

    // Detailed criteria scores
    private SectorScoreDTO sectorScore;
    private AgeScoreDTO ageScore;
    private HistoryScoreDTO historyScore;
    private IncomeScoreDTO incomeScore;

    // Summary
    private String recommendation;
    private String analysisDate;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SectorScoreDTO {
        private String sectorName;
        private String subActivityName;
        private Double score;
        private String riskLevel; // LOW, MEDIUM, HIGH, VERY_HIGH
        private Double weight; // Percentage contribution to overall score
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AgeScoreDTO {
        private Integer age;
        private Double score;
        private String ageGroup; // YOUNG, ADULT, SENIOR
        private Double weight;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HistoryScoreDTO {
        private String clientStatus; // PROSPECT, ACTIVE
        private Double score;
        private String historyAssessment; // NEW, ESTABLISHED, RISKY
        private Double weight;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IncomeScoreDTO {
        private BigDecimal monthlyIncome;
        private Double score;
        private String incomeLevel; // LOW, MEDIUM, HIGH
        private Double weight;
    }
}
