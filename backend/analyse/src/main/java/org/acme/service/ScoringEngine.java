package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.dto.ScoringRequest;
import org.acme.dto.ScoringResponse;
import org.acme.entity.enums.DecisionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.LinkedHashMap;
import java.util.Map;


@ApplicationScoped
public class ScoringEngine {

    // =========================================================================
    // Coefficients du modèle statistique
    // =========================================================================

    private static final double INTERCEPT = -0.09064;

    // --- Âge (age_group) ---
    private static final double COEF_AGE_18_30 =  0.10688;
    private static final double COEF_AGE_30_40 =  1.24519;
    private static final double COEF_AGE_40_50 =  0.14090;
    private static final double COEF_AGE_50_60 = -0.54037;
    private static final double COEF_AGE_60P   = -0.76215;



    private static final double COEF_MAT_AUTRE       = -0.66338;
    private static final double COEF_MAT_CELIBATAIRE =  0.34592;
    private static final double COEF_MAT_MARIE       =  0.29790;





    // --- Montant accordé (cred_amt_group) ---


    private static final double COEF_AMT_3K_10K  =  0.53635;
    private static final double COEF_AMT_10K_15K = -0.17718;
    private static final double COEF_AMT_15K_20K = -0.91360;
    private static final double COEF_AMT_20K_30K = -0.55212;
    private static final double COEF_AMT_30K_40K =  0.00963;

    // --- Taux d'intérêt (cred_taux_group) ---
    private static final double COEF_RATE_0_10  = -0.29548;
    private static final double COEF_RATE_10_12 =  0.01340;
    private static final double COEF_RATE_12P   =  0.14851;

    // --- Durée du crédit (duree_pret_group) ---
    private static final double COEF_DUR_3M_1Y = -1.45093;
    private static final double COEF_DUR_1Y_5Y = -0.17316;
    private static final double COEF_DUR_5Y_7Y = -0.29808;

    // --- Compte épargne (isepa_1) ---
    private static final double COEF_ISEPA = -1.03645;

    // --- Salaire (salaire_group) ---
    private static final double COEF_SAL_3K_5K  =  0.73526;
    private static final double COEF_SAL_5K_8K  =  0.52041;
    private static final double COEF_SAL_8K_12K = -1.01275;
    private static final double COEF_SAL_12KP   =  0.13668;

    // =========================================================================
    // Bornes de normalisation du score brut
    //
    // Smin = tous les pires indicateurs actifs (coefs négatifs cumulés)
    // Smax = tous les meilleurs indicateurs actifs (coefs positifs cumulés)
    //
    // Smin =  INTERCEPT + COEF_AGE_60P + COEF_MAT_AUTRE + COEF_AMT_15K_20K
    //       + COEF_RATE_0_10 + COEF_DUR_3M_1Y + COEF_ISEPA + COEF_SAL_8K_12K
    //       = −6.22538
    //
    // Smax =  INTERCEPT + COEF_AGE_30_40 + COEF_MAT_CELIBATAIRE + COEF_AMT_3K_10K
    //       + COEF_RATE_12P + COEF_DUR_1Y_5Y + 0 (pas d'épargne) + COEF_SAL_3K_5K
    //       = 2.74743
    // =========================================================================
    private static final double SCORE_MIN = -6.22538;
    private static final double SCORE_MAX =  2.74743;


    private static final double DSS_ACCEPTE  = 375.0;
    private static final double DSS_A_ETUDIER = 305.0;



    private static final int    MIN_AGE              = 18;
    private static final int    MAX_AGE_END_CREDIT   = 70;
    private static final int    MIN_SENIORITY_MONTHS = 3;
    private static final double MIN_INCOME           = 3_000.0;
    private static final int    MIN_DURATION_MONTHS  = 3;
    private static final int    MAX_DURATION_MONTHS  = 84;   // 7 ans
    private static final int    ETUDIER_DURATION     = 60;   // 5 ans
    private static final double MIN_AMOUNT           = 3_000.0;
    private static final double MAX_AMOUNT           = 40_000.0;

    
    public ScoringResponse score(ScoringRequest req) {

        LocalDate requestDate = req.getRequestDate() != null
                ? req.getRequestDate()
                : LocalDate.now();

        int ageAtRequest = computeAge(req.getDateOfBirth(), requestDate);
        // Approximation : on convertit les mois en années entières pour l'âge fin
        int ageAtEndOfCredit = ageAtRequest + (req.getDurationMonths() / 12);

        // ── I. DRG ──────────────────────────────────────────────────────────
        DecisionType drgAge        = evaluateAge(ageAtRequest, ageAtEndOfCredit);
        DecisionType drgAnciennete = evaluateAnciennete(req.getBankingEntryDate(), requestDate);
        DecisionType drgBudget     = evaluateBudget(req.getMonthlyIncome());
        DecisionType drgFichage    = evaluateFichage(req.getBankingRestriction(), req.getLegalIssueOrAccountBlocked());
        DecisionType drgOffre      = evaluateOffre(req.getRequestedAmount(), req.getDurationMonths());

        DecisionType decisionDRG = combineDRG(drgAge, drgAnciennete, drgBudget, drgFichage, drgOffre);

        // ── II. DSS ──────────────────────────────────────────────────────────
        Map<String, Double> details = new LinkedHashMap<>();
        double scoreBrut   = computeRawScore(req, ageAtRequest, details);
        double scoreAjuste = normalizeScore(scoreBrut);
        DecisionType decisionDSS = evaluateDSS(scoreAjuste);

        // ── III. Décision Système ────────────────────────────────────────────
        DecisionType decisionSysteme = combineSystemDecision(decisionDRG, decisionDSS);

        return ScoringResponse.builder()
                .demandeId(req.getDemandeId())
                .clientId(req.getClientId())
                .scoredAt(LocalDateTime.now())
                .drgAge(drgAge)
                .drgAnciennete(drgAnciennete)
                .drgBudget(drgBudget)
                .drgFichage(drgFichage)
                .drgOffre(drgOffre)
                .decisionDRG(decisionDRG)
                .scoreBrut(scoreBrut)
                .scoreAjuste(Math.round(scoreAjuste * 1000.0) / 1000.0)
                .decisionDSS(decisionDSS)
                .decisionSysteme(decisionSysteme)
                .scoreDetails(details)
                .build();
    }

    // =========================================================================
    // I. Règles de gestion — évaluations individuelles
    // =========================================================================

    


    private DecisionType evaluateAge(int ageAtRequest, int ageAtEnd) {
        if (ageAtRequest < MIN_AGE)        return DecisionType.REFUSE;
        if (ageAtEnd    > MAX_AGE_END_CREDIT) return DecisionType.REFUSE;
        return DecisionType.ACCEPTE;
    }

    /**
     * A. Critère d'éligibilité — Ancienneté bancaire
     * À étudier si l'ancienneté est inférieure à 3 mois.
     * Si la date d'entrée n'est pas fournie, la règle ne déclenche pas de pénalité.
     */
    private DecisionType evaluateAnciennete(LocalDate bankingEntryDate, LocalDate requestDate) {
        if (bankingEntryDate == null) return DecisionType.ACCEPTE;
        Period period = Period.between(bankingEntryDate, requestDate);
        int totalMonths = period.getYears() * 12 + period.getMonths();
        return totalMonths < MIN_SENIORITY_MONTHS ? DecisionType.A_ETUDIER : DecisionType.ACCEPTE;
    }

    /**
     * B. Budget — Revenu net mensuel
     * Refus si < 3 000.
     */
    private DecisionType evaluateBudget(BigDecimal monthlyIncome) {
        if (monthlyIncome == null) return DecisionType.REFUSE;
        return monthlyIncome.doubleValue() < MIN_INCOME ? DecisionType.REFUSE : DecisionType.ACCEPTE;
    }

    /**
     * C. Fichage — Interdit bancaire ou contentieux/blocage contentieux
     * Refus immédiat si l'un ou l'autre est vrai.
     */
    private DecisionType evaluateFichage(Boolean bankingRestriction, Boolean legalIssue) {
        if (Boolean.TRUE.equals(bankingRestriction)) return DecisionType.REFUSE;
        if (Boolean.TRUE.equals(legalIssue))         return DecisionType.REFUSE;
        return DecisionType.ACCEPTE;
    }

    /**
     * D. Offre commerciale — Montant et durée
     * Refus si hors bornes absolues.
     * À étudier si durée > 5 ans (≤ 7 ans).
     */
    private DecisionType evaluateOffre(BigDecimal requestedAmount, Integer durationMonths) {
        double amount = requestedAmount.doubleValue();
        if (amount < MIN_AMOUNT || amount > MAX_AMOUNT)                return DecisionType.REFUSE;
        if (durationMonths < MIN_DURATION_MONTHS
                || durationMonths > MAX_DURATION_MONTHS)               return DecisionType.REFUSE;
        if (durationMonths > ETUDIER_DURATION)                         return DecisionType.A_ETUDIER;
        return DecisionType.ACCEPTE;
    }

    /**
     * Combinaison DRG :
     *  - Au moins 1 REFUSE  → REFUSE
     *  - Pas de REFUSE + au moins 1 A_ETUDIER → A_ETUDIER
     *  - Tous ACCEPTE → ACCEPTE
     */
    private DecisionType combineDRG(DecisionType... decisions) {
        boolean hasRefuse  = false;
        boolean hasEtudier = false;
        for (DecisionType d : decisions) {
            if (d == DecisionType.REFUSE)    hasRefuse  = true;
            if (d == DecisionType.A_ETUDIER) hasEtudier = true;
        }
        if (hasRefuse)  return DecisionType.REFUSE;
        if (hasEtudier) return DecisionType.A_ETUDIER;
        return DecisionType.ACCEPTE;
    }

    // =========================================================================
    // II. Score statistique — calcul du score brut
    // =========================================================================

    /**
     * S = intercept + Σ (coef_i × indicateur_i)
     * Les contributions sont enregistrées dans {@code details} pour la transparence.
     */
    private double computeRawScore(ScoringRequest req, int age, Map<String, Double> details) {
        double s = INTERCEPT;
        details.put("constante", INTERCEPT);

        double ageCoef = resolveAgeCoef(age);
        s += ageCoef;
        details.put("age_group", ageCoef);

        double matCoef = resolveMaritalCoef(req.getMaritalStatus());
        s += matCoef;
        details.put("cat_mat", matCoef);

        double amtCoef = resolveAmountCoef(req.getRequestedAmount());
        s += amtCoef;
        details.put("cred_amt_group", amtCoef);

        double rateCoef = resolveRateCoef(req.getInterestRate());
        s += rateCoef;
        details.put("cred_taux_group", rateCoef);

        double durCoef = resolveDurationCoef(req.getDurationMonths());
        s += durCoef;
        details.put("duree_pret_group", durCoef);

        double isepaCoef = Boolean.TRUE.equals(req.getHasSavingsAccount()) ? COEF_ISEPA : 0.0;
        s += isepaCoef;
        details.put("isepa", isepaCoef);

        double salCoef = resolveSalaryCoef(req.getMonthlyIncome());
        s += salCoef;
        details.put("salaire_group", salCoef);

        return s;
    }

    // --- Résolution des coefficients par variable ---

    private double resolveAgeCoef(int age) {
        if (age < 30) return COEF_AGE_18_30;
        if (age < 40) return COEF_AGE_30_40;
        if (age < 50) return COEF_AGE_40_50;
        if (age < 60) return COEF_AGE_50_60;
        return COEF_AGE_60P;
    }

    /**
     * Mapping situation matrimoniale → groupe du modèle :
     *  MARRIED              → Marié(e)     → COEF_MAT_MARIE
     *  SINGLE               → Célibataire  → COEF_MAT_CELIBATAIRE
     *  DIVORCED/SEPARATED/
     *  WIDOWER/OTHER/null   → Autre        → COEF_MAT_AUTRE
     */
    private double resolveMaritalCoef(String maritalStatus) {
        if (maritalStatus == null) return COEF_MAT_AUTRE;
        return switch (maritalStatus.toUpperCase()) {
            case "MARRIED"                   -> COEF_MAT_MARIE;
            case "SINGLE"                    -> COEF_MAT_CELIBATAIRE;
            default                          -> COEF_MAT_AUTRE;
        };
    }

    private double resolveAmountCoef(BigDecimal requestedAmount) {
        double amt = requestedAmount.doubleValue();
        if (amt <  10_000) return COEF_AMT_3K_10K;
        if (amt <  15_000) return COEF_AMT_10K_15K;
        if (amt <  20_000) return COEF_AMT_15K_20K;
        if (amt <  30_000) return COEF_AMT_20K_30K;
        return COEF_AMT_30K_40K;
    }

    /**
     * Si le taux n'est pas fourni, on n'applique aucun coefficient (la variable
     * n'est pas dans le scope de la demande en cours).
     */
    private double resolveRateCoef(Double interestRate) {
        if (interestRate == null) return 0.0;
        if (interestRate < 10.0)  return COEF_RATE_0_10;
        if (interestRate < 12.0)  return COEF_RATE_10_12;
        return COEF_RATE_12P;
    }

    private double resolveDurationCoef(int durationMonths) {
        if (durationMonths <= 12) return COEF_DUR_3M_1Y;
        if (durationMonths <= 60) return COEF_DUR_1Y_5Y;
        return COEF_DUR_5Y_7Y;
    }

    private double resolveSalaryCoef(BigDecimal monthlyIncome) {
        double sal = monthlyIncome.doubleValue();
        if (sal <  5_000)  return COEF_SAL_3K_5K;
        if (sal <  8_000)  return COEF_SAL_5K_8K;
        if (sal < 12_000)  return COEF_SAL_8K_12K;
        return COEF_SAL_12KP;
    }

    // --- Normalisation ---

    /**
     * S_a = 1 000 × (S − Smin) / (Smax − Smin)
     * Résultat clampé sur [0, 1 000] pour couvrir des cas extrêmes hors modèle.
     */
    private double normalizeScore(double rawScore) {
        double adjusted = 1000.0 * (rawScore - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
        return Math.max(0.0, Math.min(1000.0, adjusted));
    }

    // --- Décision DSS ---

    private DecisionType evaluateDSS(double scoreAjuste) {
        if (scoreAjuste >= DSS_ACCEPTE)   return DecisionType.ACCEPTE;
        if (scoreAjuste >= DSS_A_ETUDIER) return DecisionType.A_ETUDIER;
        return DecisionType.REFUSE;
    }

    // =========================================================================
    // III. Décision Système — matrice DRG × DSS
    // =========================================================================

    /**
     * Matrice issue du fichier « Grille du score » :
     *
     *  DRG\DSS     | ACCEPTE   | A_ETUDIER | REFUSE
     *  ------------|-----------|-----------|--------
     *  ACCEPTE     | ACCEPTE   | A_ETUDIER | REFUSE
     *  A_ETUDIER   | A_ETUDIER | A_ETUDIER | REFUSE
     *  REFUSE      | REFUSE    | REFUSE    | REFUSE
     */
    private DecisionType combineSystemDecision(DecisionType drg, DecisionType dss) {
        if (drg == DecisionType.REFUSE) return DecisionType.REFUSE;

        return switch (dss) {
            case REFUSE    -> DecisionType.REFUSE;
            case A_ETUDIER -> DecisionType.A_ETUDIER;
            case ACCEPTE   -> drg == DecisionType.ACCEPTE
                    ? DecisionType.ACCEPTE
                    : DecisionType.A_ETUDIER;  // DRG = A_ETUDIER + DSS = ACCEPTE → A_ETUDIER
        };
    }

    // =========================================================================
    // Utilitaires
    // =========================================================================

    private int computeAge(LocalDate dateOfBirth, LocalDate referenceDate) {
        return Period.between(dateOfBirth, referenceDate).getYears();
    }
}
