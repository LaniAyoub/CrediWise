package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entity.Demande;

import java.time.LocalDate;
import java.time.Period;

/**
 * Calcul du score crédit embarqué dans le service nouvelle_demande.
 *
 * Implémente la grille « Grille du score » :
 *   I.  DRG — Décision Règles de Gestion
 *   II. DSS — Score Statistique (régression logistique, normalisé 0-1000)
 *   III.    — Décision Système (matrice DRG × DSS)
 *
 * Le résultat est formaté sous la forme "DECISION|score" (ex: "ACCEPTE|652")
 * pour être stocké dans clients.scoring (VARCHAR 50).
 */
@ApplicationScoped
public class ScoringCalculator {

    // =========================================================================
    // Coefficients du modèle
    // =========================================================================

    private static final double INTERCEPT = -0.09064;

    // Âge
    private static final double COEF_AGE_18_30 =  0.10688;
    private static final double COEF_AGE_30_40 =  1.24519;
    private static final double COEF_AGE_40_50 =  0.14090;
    private static final double COEF_AGE_50_60 = -0.54037;
    private static final double COEF_AGE_60P   = -0.76215;

    // Situation matrimoniale
    private static final double COEF_MAT_AUTRE       = -0.66338;
    private static final double COEF_MAT_CELIBATAIRE =  0.34592;
    private static final double COEF_MAT_MARIE       =  0.29790;

    // Montant
    private static final double COEF_AMT_3K_10K  =  0.53635;
    private static final double COEF_AMT_10K_15K = -0.17718;
    private static final double COEF_AMT_15K_20K = -0.91360;
    private static final double COEF_AMT_20K_30K = -0.55212;
    private static final double COEF_AMT_30K_40K =  0.00963;

    // Durée
    private static final double COEF_DUR_3M_1Y = -1.45093;
    private static final double COEF_DUR_1Y_5Y = -0.17316;
    private static final double COEF_DUR_5Y_7Y = -0.29808;

    // Compte épargne
    private static final double COEF_ISEPA = -1.03645;

    // Salaire
    private static final double COEF_SAL_3K_5K  =  0.73526;
    private static final double COEF_SAL_5K_8K  =  0.52041;
    private static final double COEF_SAL_8K_12K = -1.01275;
    private static final double COEF_SAL_12KP   =  0.13668;

    // Bornes de normalisation
    private static final double SCORE_MIN = -6.22538;
    private static final double SCORE_MAX =  2.74743;

    // Seuils DSS
    private static final double DSS_ACCEPTE   = 375.0;
    private static final double DSS_A_ETUDIER = 305.0;

    // Seuils DRG
    private static final int    MIN_AGE             = 18;
    private static final int    MAX_AGE_END         = 70;
    private static final double MIN_INCOME          = 3_000.0;
    private static final int    MIN_DURATION        = 3;
    private static final int    MAX_DURATION        = 84;
    private static final int    ETUDIER_DURATION    = 60;
    private static final double MIN_AMOUNT          = 3_000.0;
    private static final double MAX_AMOUNT          = 40_000.0;

    // =========================================================================
    // API publique
    // =========================================================================

    /**
     * Calcule le score d'une demande et retourne une chaîne formatée
     * "DECISION|scoreAjuste" (ex: "ACCEPTE|652") à stocker dans clients.scoring.
     */
    public String compute(Demande demande) {
        LocalDate requestDate = demande.requestDate != null
                ? demande.requestDate.toLocalDate()
                : LocalDate.now();

        // ── I. DRG ──────────────────────────────────────────────────────────
        int age    = demande.dateOfBirth != null ? Period.between(demande.dateOfBirth, requestDate).getYears() : 30;
        int ageEnd = age + (demande.durationMonths != null ? demande.durationMonths / 12 : 0);

        String drgAge        = evalAge(age, ageEnd);
        String drgBudget     = evalBudget(demande);
        String drgFichage    = evalFichage(demande);
        String drgOffre      = evalOffre(demande);
        String drg           = combineDRG(drgAge, drgBudget, drgFichage, drgOffre);

        // ── II. DSS ──────────────────────────────────────────────────────────
        double raw      = rawScore(demande, age);
        double adjusted = Math.max(0, Math.min(1000, 1000.0 * (raw - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)));
        int    score    = (int) Math.round(adjusted);
        String dss      = score >= DSS_ACCEPTE ? "ACCEPTE" : score >= DSS_A_ETUDIER ? "A_ETUDIER" : "REFUSE";

        // ── III. Décision Système ─────────────────────────────────────────────
        String decision = systemDecision(drg, dss);

        return decision;
    }

    // =========================================================================
    // DRG
    // =========================================================================

    private String evalAge(int age, int ageEnd) {
        if (age < MIN_AGE || ageEnd > MAX_AGE_END) return "REFUSE";
        return "ACCEPTE";
    }

    private String evalBudget(Demande d) {
        if (d.monthlyIncome == null) return "REFUSE";
        return d.monthlyIncome.doubleValue() < MIN_INCOME ? "REFUSE" : "ACCEPTE";
    }

    private String evalFichage(Demande d) {
        if (Boolean.TRUE.equals(d.bankingRestriction))        return "REFUSE";
        if (Boolean.TRUE.equals(d.legalIssueOrAccountBlocked)) return "REFUSE";
        return "ACCEPTE";
    }

    private String evalOffre(Demande d) {
        if (d.requestedAmount == null || d.durationMonths == null) return "REFUSE";
        double amt = d.requestedAmount.doubleValue();
        int    dur = d.durationMonths;
        if (amt < MIN_AMOUNT || amt > MAX_AMOUNT)           return "REFUSE";
        if (dur < MIN_DURATION || dur > MAX_DURATION)       return "REFUSE";
        if (dur > ETUDIER_DURATION)                         return "A_ETUDIER";
        return "ACCEPTE";
    }

    private String combineDRG(String... decisions) {
        boolean hasRefuse  = false;
        boolean hasEtudier = false;
        for (String d : decisions) {
            if ("REFUSE".equals(d))    hasRefuse  = true;
            if ("A_ETUDIER".equals(d)) hasEtudier = true;
        }
        if (hasRefuse)  return "REFUSE";
        if (hasEtudier) return "A_ETUDIER";
        return "ACCEPTE";
    }

    // =========================================================================
    // Score brut
    // =========================================================================

    private double rawScore(Demande d, int age) {
        double s = INTERCEPT;
        s += ageCoef(age);
        s += maritalCoef(d.maritalStatus);
        s += amountCoef(d);
        s += durationCoef(d);
        s += isepaCoef(d.accountType);
        s += salaryCoef(d);
        return s;
    }

    private double ageCoef(int age) {
        if (age < 30) return COEF_AGE_18_30;
        if (age < 40) return COEF_AGE_30_40;
        if (age < 50) return COEF_AGE_40_50;
        if (age < 60) return COEF_AGE_50_60;
        return COEF_AGE_60P;
    }

    private double maritalCoef(String maritalStatus) {
        if (maritalStatus == null) return COEF_MAT_AUTRE;
        return switch (maritalStatus.toUpperCase()) {
            case "MARRIED"  -> COEF_MAT_MARIE;
            case "SINGLE"   -> COEF_MAT_CELIBATAIRE;
            default         -> COEF_MAT_AUTRE;
        };
    }

    private double amountCoef(Demande d) {
        if (d.requestedAmount == null) return 0.0;
        double amt = d.requestedAmount.doubleValue();
        if (amt < 10_000) return COEF_AMT_3K_10K;
        if (amt < 15_000) return COEF_AMT_10K_15K;
        if (amt < 20_000) return COEF_AMT_15K_20K;
        if (amt < 30_000) return COEF_AMT_20K_30K;
        return COEF_AMT_30K_40K;
    }

    private double durationCoef(Demande d) {
        if (d.durationMonths == null) return 0.0;
        if (d.durationMonths <= 12) return COEF_DUR_3M_1Y;
        if (d.durationMonths <= 60) return COEF_DUR_1Y_5Y;
        return COEF_DUR_5Y_7Y;
    }

    /**
     * Détecte un compte épargne d'après le libellé du type de compte
     * (ex: "Saving Account", "Compte Épargne", "Term Deposit").
     */
    private double isepaCoef(String accountType) {
        if (accountType == null) return 0.0;
        String lower = accountType.toLowerCase();
        boolean hasSavings = lower.contains("saving") || lower.contains("epargne")
                || lower.contains("épargne") || lower.contains("term deposit");
        return hasSavings ? COEF_ISEPA : 0.0;
    }

    private double salaryCoef(Demande d) {
        if (d.monthlyIncome == null) return 0.0;
        double sal = d.monthlyIncome.doubleValue();
        if (sal <  5_000)  return COEF_SAL_3K_5K;
        if (sal <  8_000)  return COEF_SAL_5K_8K;
        if (sal < 12_000)  return COEF_SAL_8K_12K;
        return COEF_SAL_12KP;
    }

    // =========================================================================
    // Matrice de décision système
    // =========================================================================

    private String systemDecision(String drg, String dss) {
        if ("REFUSE".equals(drg)) return "REFUSE";
        return switch (dss) {
            case "REFUSE"    -> "REFUSE";
            case "A_ETUDIER" -> "A_ETUDIER";
            default -> "ACCEPTE".equals(drg) ? "ACCEPTE" : "A_ETUDIER";
        };
    }
}
