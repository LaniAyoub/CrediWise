package org.acme.dto;

import lombok.Builder;
import lombok.Getter;
import org.acme.entity.enums.DecisionType;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class ScoringResponse {

    public Long demandeId;
    public UUID clientId;
    public LocalDateTime scoredAt;

    // ── I. Décision Règles de Gestion (DRG) ──────────────────────────────────

    /** A. Critère d'éligibilité — âge (≥18 à l'octroi, ≤70 à la fin du crédit) */
    public DecisionType drgAge;

    /** A. Critère d'éligibilité — ancienneté bancaire (< 3 mois → A_ETUDIER) */
    public DecisionType drgAnciennete;

    /** B. Budget — revenu net mensuel (< 3 000 → REFUSE) */
    public DecisionType drgBudget;

    /** C. Fichage — interdit bancaire ou contentieux */
    public DecisionType drgFichage;

    /** D. Offre commerciale — durée et montant */
    public DecisionType drgOffre;

    /** Décision globale DRG */
    public DecisionType decisionDRG;

    // ── II. Score Statistique (DSS) ───────────────────────────────────────────

    /**
     * Score brut : S = Σ(coef × indicateur) + constante
     * Formule : =SOMMEPROD(coefs; valeurs) + intercept
     */
    public double scoreBrut;

    /**
     * Score ajusté sur [0, 1000] :
     * S_a = 1000 × (S − Smin) / (Smax − Smin)
     */
    public double scoreAjuste;

    /** Décision DSS : ACCEPTE ≥ 375 | A_ETUDIER [305, 375[ | REFUSE < 305 */
    public DecisionType decisionDSS;

    // ── III. Décision Système ─────────────────────────────────────────────────

    /** Décision finale issue de la matrice DRG × DSS */
    public DecisionType decisionSysteme;

    // ── Détail du score ───────────────────────────────────────────────────────

    /**
     * Contribution de chaque variable au score brut.
     * Clés : constante, age_group, cat_mat, cred_amt_group,
     *        cred_taux_group, duree_pret_group, isepa, salaire_group
     */
    public Map<String, Double> scoreDetails;
}
