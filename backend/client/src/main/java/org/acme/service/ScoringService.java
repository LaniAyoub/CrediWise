package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;
import org.acme.dto.ScoringAnalysisDTO;
import org.acme.dto.ScoringAnalysisDTO.AgeScoreDTO;
import org.acme.dto.ScoringAnalysisDTO.HistoryScoreDTO;
import org.acme.dto.ScoringAnalysisDTO.IncomeScoreDTO;
import org.acme.dto.ScoringAnalysisDTO.SectorScoreDTO;
import org.acme.entity.Client;
import org.acme.entity.SousActivite;
import org.acme.util.AgeCalculator;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Service for analyzing and calculating client credit scores
 * Criteria: Sector of activity, Age, History, Income
 */
@Slf4j
@ApplicationScoped
public class ScoringService {

    // Weighting scheme (total = 100%)
    private static final double SECTOR_WEIGHT = 0.35; // Sector risk: 35%
    private static final double AGE_WEIGHT = 0.20;    // Age profile: 20%
    private static final double HISTORY_WEIGHT = 0.25; // Client history: 25%
    private static final double INCOME_WEIGHT = 0.20;  // Income capacity: 20%

    /**
     * Analyze a client's creditworthiness based on multiple criteria
     * @param client The client to analyze
     * @return Comprehensive scoring analysis
     */
    public ScoringAnalysisDTO analyzeScoringCriteria(Client client) {
        log.info("Analyzing scoring for client ID: {}", client.getId());

        // Calculate individual criterion scores
        SectorScoreDTO sectorScore = calculateSectorScore(client);
        AgeScoreDTO ageScore = calculateAgeScore(client);
        HistoryScoreDTO historyScore = calculateHistoryScore(client);
        IncomeScoreDTO incomeScore = calculateIncomeScore(client);

        // Calculate weighted overall score
        double overallScore = calculateWeightedScore(
                sectorScore.getScore(),
                ageScore.getScore(),
                historyScore.getScore(),
                incomeScore.getScore()
        );

        // Determine risk level based on overall score
        String riskLevel = determineRiskLevel(overallScore);

        // Generate recommendation
        String recommendation = generateRecommendation(overallScore, riskLevel, client);

        return ScoringAnalysisDTO.builder()
                .overallScore(overallScore)
                .riskLevel(riskLevel)
                .sectorScore(sectorScore)
                .ageScore(ageScore)
                .historyScore(historyScore)
                .incomeScore(incomeScore)
                .recommendation(recommendation)
                .analysisDate(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();
    }

    /**
     * Calculate score based on sector of activity and risk level
     * Risk levels: LOW (90), MEDIUM (70), HIGH (50), VERY_HIGH (30)
     */
    private SectorScoreDTO calculateSectorScore(Client client) {
        double score = 70.0; // Default score
        String riskLevel = "MEDIUM";
        String sectorName = "N/A";
        String subActivityName = "N/A";

        try {
            if (client.getRiskLevel() != null) {
                String riskLevelStr = client.getRiskLevel().getIfcLevelOfRisk();
                
                if (riskLevelStr != null) {
                    switch (riskLevelStr.toUpperCase()) {
                        case "LOW":
                            score = 90.0;
                            riskLevel = "LOW";
                            break;
                        case "MEDIUM":
                            score = 70.0;
                            riskLevel = "MEDIUM";
                            break;
                        case "HIGH":
                            score = 50.0;
                            riskLevel = "HIGH";
                            break;
                        case "VERY_HIGH":
                            score = 30.0;
                            riskLevel = "VERY_HIGH";
                            break;
                        default:
                            score = 70.0;
                    }
                }

                // Get sector and sub-activity names
                if (client.getRiskLevel().getSousActivite() != null) {
                    SousActivite sousActivite = client.getRiskLevel().getSousActivite();
                    subActivityName = sousActivite.getLibelle();
                    
                    if (sousActivite.getSecteurActivite() != null) {
                        sectorName = sousActivite.getSecteurActivite().getLibelle();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating sector score for client {}: {}", client.getId(), e.getMessage());
        }

        return SectorScoreDTO.builder()
                .sectorName(sectorName)
                .subActivityName(subActivityName)
                .score(score)
                .riskLevel(riskLevel)
                .weight(SECTOR_WEIGHT * 100)
                .build();
    }

    /**
     * Calculate score based on client age
     * Young (18-30): score gradually increases from 50 to 90
     * Optimal age range: 30-55 (score 90)
     * Senior (56-70): score gradually decreases from 85 to 60
     * Over 70: lower score
     */
    private AgeScoreDTO calculateAgeScore(Client client) {
        double score = 60.0;
        String ageGroup = "UNKNOWN";
        int age = 0;

        try {
            if (client.getDateOfBirth() != null) {
                age = AgeCalculator.calculateAge(client.getDateOfBirth());

                if (age >= 18 && age < 30) {
                    // Young: gradually increase from 50 to 90
                    score = 50.0 + ((age - 18) * (40.0 / 12.0)); // (90-50)/(30-18) = 40/12
                    ageGroup = "YOUNG";
                } else if (age >= 30 && age <= 55) {
                    // Optimal range: 90
                    score = 90.0;
                    ageGroup = "ADULT";
                } else if (age > 55 && age <= 70) {
                    // Senior: gradually decrease from 85 to 60
                    score = 85.0 - ((age - 55) * 1.0);
                    ageGroup = "SENIOR";
                } else {
                    // Over 70: lower score
                    score = 40.0;
                    ageGroup = "VERY_SENIOR";
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating age score for client {}: {}", client.getId(), e.getMessage());
        }

        return AgeScoreDTO.builder()
                .age(age)
                .score(Math.max(0.0, Math.min(100.0, score))) // Clamp between 0-100
                .ageGroup(ageGroup)
                .weight(AGE_WEIGHT * 100)
                .build();
    }

    /**
     * Calculate score based on client history
     * PROSPECT (new client): score 65
     * ACTIVE (established): score 85 (indicates payment history)
     */
    private HistoryScoreDTO calculateHistoryScore(Client client) {
        double score = 65.0;
        String historyAssessment = "NEW";
        String clientStatus = "UNKNOWN";

        try {
            if (client.getStatus() != null) {
                clientStatus = client.getStatus().toString();
                
                switch (client.getStatus()) {
                    case PROSPECT:
                        score = 65.0;
                        historyAssessment = "NEW";
                        break;
                    case ACTIVE:
                        score = 85.0;
                        historyAssessment = "ESTABLISHED";
                        break;
                    default:
                        score = 65.0;
                        historyAssessment = "NEW";
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating history score for client {}: {}", client.getId(), e.getMessage());
        }

        return HistoryScoreDTO.builder()
                .clientStatus(clientStatus)
                .score(score)
                .historyAssessment(historyAssessment)
                .weight(HISTORY_WEIGHT * 100)
                .build();
    }

    /**
     * Calculate score based on monthly income (in Tunisian Dinars - TND)
     * No income (≤ 0): 30
     * Low income (< 1,000 TND): 50
     * Medium income (1,000 - 1,999 TND): 75
     * High income (2,000 - 3,999 TND): 90
     * Very high (≥ 4,000 TND): 95
     */
    private IncomeScoreDTO calculateIncomeScore(Client client) {
        double score = 70.0;
        String incomeLevel = "UNKNOWN";

        try {
            if (client.getMonthlyIncome() != null) {
                BigDecimal income = client.getMonthlyIncome();

                if (income.compareTo(BigDecimal.ZERO) <= 0) {
                    score = 30.0;
                    incomeLevel = "NO_INCOME";
                } else if (income.compareTo(BigDecimal.valueOf(1000)) < 0) {
                    score = 50.0;
                    incomeLevel = "LOW";
                } else if (income.compareTo(BigDecimal.valueOf(2000)) < 0) {
                    score = 75.0;
                    incomeLevel = "MEDIUM";
                } else if (income.compareTo(BigDecimal.valueOf(4000)) < 0) {
                    score = 90.0;
                    incomeLevel = "HIGH";
                } else {
                    score = 95.0;
                    incomeLevel = "VERY_HIGH";
                }
            }
        } catch (Exception e) {
            log.warn("Error calculating income score for client {}: {}", client.getId(), e.getMessage());
        }

        return IncomeScoreDTO.builder()
                .monthlyIncome(client.getMonthlyIncome())
                .score(score)
                .incomeLevel(incomeLevel)
                .weight(INCOME_WEIGHT * 100)
                .build();
    }

    /**
     * Calculate weighted overall score
     * Formula: (sectorScore * 0.35) + (ageScore * 0.20) + (historyScore * 0.25) + (incomeScore * 0.20)
     */
    private double calculateWeightedScore(double sectorScore, double ageScore, 
                                         double historyScore, double incomeScore) {
        double weighted = (sectorScore * SECTOR_WEIGHT) +
                         (ageScore * AGE_WEIGHT) +
                         (historyScore * HISTORY_WEIGHT) +
                         (incomeScore * INCOME_WEIGHT);
        return Math.min(100.0, Math.max(0.0, weighted)); // Clamp between 0-100
    }

    /**
     * Determine risk level based on overall score
     * 75-100: LOW RISK
     * 60-74: MEDIUM RISK
     * 40-59: HIGH RISK
     * 0-39: VERY HIGH RISK
     */
    private String determineRiskLevel(double score) {
        if (score >= 75) {
            return "LOW";
        } else if (score >= 60) {
            return "MEDIUM";
        } else if (score >= 40) {
            return "HIGH";
        } else {
            return "VERY_HIGH";
        }
    }

    /**
     * Generate recommendation based on scoring analysis
     */
    private String generateRecommendation(double score, String riskLevel, Client client) {
        StringBuilder recommendation = new StringBuilder();

        recommendation.append("Risk Level: ").append(riskLevel).append(". ");

        switch (riskLevel) {
            case "LOW":
                recommendation.append("Excellent creditworthiness. ");
                recommendation.append("Recommended for approval with standard terms.");
                break;
            case "MEDIUM":
                recommendation.append("Acceptable creditworthiness. ");
                recommendation.append("Can be approved with standard terms and monitoring.");
                break;
            case "HIGH":
                recommendation.append("Elevated risk detected. ");
                recommendation.append("Recommend additional verification and higher interest rates.");
                break;
            case "VERY_HIGH":
                recommendation.append("Significant risk detected. ");
                recommendation.append("Recommend rejection or substantial collateral requirement.");
                break;
        }

        // Add type-specific guidance
        if (client.getClientType() != null) {
            recommendation.append(" (").append(client.getClientType()).append(" client)");
        }

        return recommendation.toString();
    }

    /**
     * Calculate score string for Client entity (simplified)
     * Returns like: "75 (LOW RISK)"
     */
    public String calculateScoreString(Client client) {
        try {
            ScoringAnalysisDTO analysis = analyzeScoringCriteria(client);
            return String.format("%.0f (%s)", analysis.getOverallScore(), analysis.getRiskLevel());
        } catch (Exception e) {
            log.error("Error calculating score string for client {}: {}", client.getId(), e.getMessage());
            return "N/A";
        }
    }
}
