package org.acme.entity.enums;

/**
 * Status of an analysis dossier — follows the credit lifecycle.
 */
public enum DossierStatus {
    DRAFT,                      // Draft — demande created but not submitted
    SUBMITTED,                  // Submitted — demande submitted by front office
    ANALYSE,                    // Analyse — manager started analysis (Step 1)
    CHECK_BEFORE_COMMITTEE,     // Check before committee — pre-committee review
    CREDIT_RISK_ANALYSIS,       // Credit risk analysis — risk assessment phase
    COMMITTEE,                  // Committee — awaiting committee decision
    WAITING_CLIENT_APPROVAL,    // Waiting client approval — awaiting customer response
    READY_TO_DISBURSE,          // Ready to disburse — approved and ready for disbursement
    DISBURSE,                   // Disburse — funds disbursed
    REJECTED                    // Rejected — credit application rejected
}
