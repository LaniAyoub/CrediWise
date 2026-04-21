package org.acme.entity.enums;

/**
 * Status of a credit demande — follows the full credit lifecycle.
 */
public enum DemandeStatut {
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
