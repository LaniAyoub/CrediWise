package org.acme.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Complete Step 3 (Risque Client) response.
 * stepStatus values: EMPTY | DRAFT | CONFIRMED | MODIFIED_AFTER_CONFIRM
 */
public record StepRisqueClientResponse(

    // ─── DOSSIER CONTEXT ────────────────────────────────────────
    @JsonProperty("dossierId")    Long dossierId,
    @JsonProperty("demandeId")    Long demandeId,
    @JsonProperty("dossierStatus") String dossierStatus,

    // ─── SECTION 1.1: Situation du client ───────────────────────
    @JsonProperty("situationFamiliale")       String situationFamiliale,
    @JsonProperty("situationFamilialeAutre")  String situationFamilialeAutre,
    @JsonProperty("situationLogement")        String situationLogement,
    @JsonProperty("situationLogementAutre")   String situationLogementAutre,
    @JsonProperty("dureeSejour")              Integer dureeSejour,
    @JsonProperty("ancienneteQuartier")       Integer ancienneteQuartier,
    @JsonProperty("nombrePersonnesCharge")    Integer nombrePersonnesCharge,
    @JsonProperty("nombreEnfants")            Integer nombreEnfants,

    // ─── SECTION 1.2: Références familiales ─────────────────────
    @JsonProperty("referenceFamiliales") List<ReferenceFamilialeItem> referenceFamiliales,

    // ─── SECTION 2.1: Enquêtes de moralité ──────────────────────
    @JsonProperty("enquetesMoralite") List<EnqueteMoraliteItem> enquetesMoralite,

    // ─── SECTION 2.2: Avis comité ───────────────────────────────
    @JsonProperty("avisComite") String avisComite,

    // ─── SECTION 3: Historique crédit ───────────────────────────
    @JsonProperty("nombreCreditsAnterieurs") Integer nombreCreditsAnterieurs,
    @JsonProperty("noteCentraleRisque")      String noteCentraleRisque,
    @JsonProperty("estGarant")               Boolean estGarant,

    // ─── SECTION 4: Prêts en cours ──────────────────────────────
    @JsonProperty("pretsCours") List<PretCoursItem> pretsCours,

    // ─── SECTION 4.1: Analyse crédit ────────────────────────────
    @JsonProperty("analyseCredit") String analyseCredit,

    // ─── SECTION 5: Comptes bancaires ───────────────────────────
    @JsonProperty("comptesBancaires") List<CompteBancaireItem> comptesBancaires,

    // ─── SECTION 5.1: Analyse des comptes ───────────────────────
    @JsonProperty("analyseComptes") String analyseComptes,

    // ─── STEP METADATA ──────────────────────────────────────────
    @JsonProperty("isComplete")  Boolean isComplete,
    @JsonProperty("stepStatus")  String stepStatus,

    @JsonProperty("confirmedBy")     UUID confirmedBy,
    @JsonProperty("confirmedByName") String confirmedByName,
    @JsonProperty("confirmedAt")     LocalDateTime confirmedAt,

    @JsonProperty("lastEditedBy")     UUID lastEditedBy,
    @JsonProperty("lastEditedByName") String lastEditedByName,
    @JsonProperty("lastEditedAt")     LocalDateTime lastEditedAt,

    @JsonProperty("createdAt") LocalDateTime createdAt

) {
    /** Section 1.2 item */
    public record ReferenceFamilialeItem(
        @JsonProperty("id")          Long id,
        @JsonProperty("prenom")      String prenom,
        @JsonProperty("nom")         String nom,
        @JsonProperty("telephone")   String telephone,
        @JsonProperty("lienParente") String lienParente,
        @JsonProperty("ordre")       Integer ordre
    ) {}

    /** Section 2.1 item */
    public record EnqueteMoraliteItem(
        @JsonProperty("id")              Long id,
        @JsonProperty("lienAvecClient")  String lienAvecClient,
        @JsonProperty("contact")         String contact,
        @JsonProperty("nomComplet")      String nomComplet,
        @JsonProperty("amplitude")       String amplitude,
        @JsonProperty("opinion")         String opinion,
        @JsonProperty("ordre")           Integer ordre
    ) {}

    /** Section 5 item */
    public record CompteBancaireItem(
        @JsonProperty("id")          Long id,
        @JsonProperty("banqueImf")   String banqueImf,
        @JsonProperty("typeCompte")  String typeCompte,
        @JsonProperty("solde")       BigDecimal solde,
        @JsonProperty("ordre")       Integer ordre
    ) {}

    /** Section 4 item */
    public record PretCoursItem(
        @JsonProperty("id")                         Long id,
        @JsonProperty("nomInstitution")              String nomInstitution,
        @JsonProperty("objet")                       String objet,
        @JsonProperty("dureeEnMois")                 Integer dureeEnMois,
        @JsonProperty("montantInitial")              BigDecimal montantInitial,
        @JsonProperty("encoursSolde")                BigDecimal encoursSolde,
        @JsonProperty("montantEcheance")             BigDecimal montantEcheance,
        @JsonProperty("nombreEcheancesRestantes")    Integer nombreEcheancesRestantes,
        @JsonProperty("nombreEcheancesRetard")       Integer nombreEcheancesRetard,
        @JsonProperty("joursRetardMax")              Integer joursRetardMax,
        @JsonProperty("ordre")                       Integer ordre
    ) {}
}
