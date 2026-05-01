package org.acme.entity.enums;

/**
 * Status of an analysis dossier — follows the credit lifecycle.
 */
public enum DossierStatus {
    DRAFT,                      // Brouillon — demande créée, non encore soumise
    ANALYSE,                    // Analyse — dossier créé, étapes 1-7 (produits 101,102,103)
    CHECK_BEFORE_COMMITTEE,     // Vérifications avant comité — checklist pré-comité (produits 104,105)
    CREDIT_RISK_ANALYSIS,       // Analyse risque — phase d'évaluation des risques
    COMMITTEE,                  // Comité — en attente de décision du comité
    WAITING_CLIENT_APPROVAL,    // Attente accord client — en attente de réponse du client
    READY_TO_DISBURSE,          // Prêt à décaisser — approuvé, prêt au décaissement
    DISBURSE,                   // Décaissé — fonds décaissés
    REJECTED                    // Refusé — demande de crédit rejetée
}
