import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { clientService } from "@/services/client.service";
import { demandeService } from "@/services/demande.service";
import { agenceService } from "@/services/agence.service";
import { analyseService } from "@/services/analyseService";
import { useAuth } from "@/hooks/useAuth";
import { getStatusKey, getAllStatuses } from "@/utils/statusMapping";
import type { Agence } from "@/types/agence.types";
import type { Client } from "@/types/client.types";
import type { Demande, DemandeCreateRequest, DemandeStatut, DemandeUpdateRequest } from "@/types/demande.types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import DemandeForm from "@/components/forms/DemandeForm";
import toast from "react-hot-toast";

// ── Role-Based Access Control ────────────────────────────────────────────────
const CAN_CREATE_ROLES = ["SUPER_ADMIN", "FRONT_OFFICE"];
const CAN_EDIT_ROLES = ["SUPER_ADMIN", "FRONT_OFFICE"];
const CAN_DELETE_ROLES = ["SUPER_ADMIN"];
const CAN_APPROVE_ROLES = ["SUPER_ADMIN", "HEAD_OFFICE_DM", "BRANCH_DM"];
const CAN_MANAGE_AGENCE = ["SUPER_ADMIN", "TECH_USER"];

// ── Status groups ────────────────────────────────────────────────────────────
type StatusGroup = "all" | "active" | "terminated" | "refused";
const ACTIVE_STATUSES: DemandeStatut[] = [
  "DRAFT", "ANALYSE", "CHECK_BEFORE_COMMITTEE",
  "CREDIT_RISK_ANALYSIS", "COMMITTEE", "WAITING_CLIENT_APPROVAL",
];
const TERMINATED_STATUSES: DemandeStatut[] = ["READY_TO_DISBURSE", "DISBURSE"];
const REFUSED_STATUSES: DemandeStatut[] = ["REJECTED"];

// ── Column filter state ──────────────────────────────────────────────────────
type ColFilters = {
  nomCC: string;
  idClient: string;
  nom: string;
  idDemande: string;
  statut: "" | DemandeStatut;
  montant: string;
  secteur: string;
};

const EMPTY_COL_FILTERS: ColFilters = {
  nomCC: "", idClient: "", nom: "", idDemande: "",
  statut: "", montant: "", secteur: "",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const displayClient = (d: Demande) =>
  `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.companyName || d.clientId;

const formatAmount = (value?: number) =>
  value != null
    ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value) + " TND"
    : "—";

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";

const statusVariant = (status: DemandeStatut): "warning" | "info" | "success" | "danger" => {
  if (["DRAFT", "COMMITTEE", "WAITING_CLIENT_APPROVAL"].includes(status)) return "warning";
  if (["READY_TO_DISBURSE", "DISBURSE"].includes(status)) return "success";
  if (status === "REJECTED") return "danger";
  return "info"; // ANALYSE, CHECK_BEFORE_COMMITTEE, CREDIT_RISK_ANALYSIS
};

// ── PDF generation ────────────────────────────────────────────────────────────
const generateDemandePdf = (demande: Demande, popUpMessage?: string, noGuarantorsMsg?: string, noGuaranteesMsg?: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) { alert(popUpMessage || "Please allow pop-ups"); return; }

  const fd = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";
  const fa = (v?: number | null) => v != null ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(v) + " TND" : "—";
  const clientName = displayClient(demande);

  const guarantorsRows = (demande.guarantors && demande.guarantors.length > 0)
    ? demande.guarantors.map(g =>
        `<tr><td>${g.name || "—"}</td><td>${g.amplitudeId || "—"}</td><td>${g.clientRelationship || "—"}</td></tr>`
      ).join("")
    : `<tr><td colspan="3" class="empty">${noGuarantorsMsg || "Aucune caution"}</td></tr>`;

  const guaranteesRows = (demande.guarantees && demande.guarantees.length > 0)
    ? demande.guarantees.map(g =>
        `<tr><td>${g.owner || "—"}</td><td>${g.type || "—"}</td><td class="right">${Number(g.estimatedValue || 0).toLocaleString()} TND</td></tr>`
      ).join("")
    : `<tr><td colspan="3" class="empty">${noGuaranteesMsg || "Aucune garantie"}</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Demande de Crédit N° ${demande.id}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:"Segoe UI",Arial,sans-serif;font-size:11pt;color:#1a2e1a;background:#fff;padding:0}
    @page{size:A4;margin:20mm 18mm}
    @media print{.no-print{display:none!important}}
    /* Header */
    .header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;background:linear-gradient(135deg,#14532d 0%,#16a34a 100%);color:#fff;border-radius:0}
    .header-logo{font-size:22pt;font-weight:800;letter-spacing:1px}
    .header-sub{font-size:9pt;opacity:.8;margin-top:3px}
    .header-right{text-align:right;font-size:9pt;opacity:.85}
    /* Status badge */
    .status-badge{display:inline-block;padding:3px 12px;border-radius:999px;font-size:9pt;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
    .status-DRAFT{background:#fef3c7;color:#92400e}
    .status-ANALYSE{background:#fef9c3;color:#854d0e}
    .status-CHECK_BEFORE_COMMITTEE{background:#f3e8ff;color:#6b21a8}
    .status-CREDIT_RISK_ANALYSIS{background:#ffedd5;color:#9a3412}
    .status-COMMITTEE{background:#e0e7ff;color:#3730a3}
    .status-WAITING_CLIENT_APPROVAL{background:#cffafe;color:#155e75}
    .status-READY_TO_DISBURSE{background:#d1fae5;color:#065f46}
    .status-DISBURSE{background:#bbf7d0;color:#14532d}
    .status-REJECTED{background:#fee2e2;color:#991b1b}
    /* Title bar */
    .title-bar{background:#f0fdf4;border-bottom:2px solid #16a34a;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
    .title-bar h1{font-size:15pt;font-weight:700;color:#14532d}
    .title-bar .ref{font-size:9pt;color:#64748b}
    /* Body */
    .body{padding:20px 24px}
    /* Section */
    .section{margin-bottom:18px}
    .section-header{background:#16a34a;color:#fff;padding:7px 12px;font-size:10pt;font-weight:600;border-radius:4px 4px 0 0;margin-bottom:0}
    .section-body{border:1px solid #d1fae5;border-top:none;border-radius:0 0 4px 4px;padding:12px}
    /* Info grid */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}
    .info-row{display:flex;align-items:baseline;gap:8px;padding:4px 0;border-bottom:1px dotted #d1fae5}
    .info-row:last-child{border-bottom:none}
    .info-label{font-size:8.5pt;color:#64748b;font-weight:600;min-width:140px;flex-shrink:0}
    .info-value{font-size:9.5pt;color:#1a2e1a;font-weight:500}
    .info-value.amount{color:#15803d;font-weight:700;font-size:11pt}
    .info-value.risk-yes{color:#dc2626;font-weight:700}
    .info-value.risk-no{color:#16a34a;font-weight:700}
    /* Table */
    table{width:100%;border-collapse:collapse;font-size:9pt}
    th{background:#f0fdf4;color:#374151;font-weight:600;padding:7px 10px;text-align:left;border:1px solid #d1fae5}
    td{padding:6px 10px;border:1px solid #d1fae5;color:#374151;vertical-align:top}
    tr:nth-child(even) td{background:#f0fdf4}
    td.right{text-align:right;font-weight:600}
    td.empty{text-align:center;color:#94a3b8;font-style:italic;padding:14px}
    /* Consent */
    .consent{background:#fffbeb;border:1px solid #fcd34d;border-radius:4px;padding:12px;font-size:8.5pt;color:#78350f;line-height:1.7;direction:rtl;text-align:justify}
    /* Footer */
    .footer{background:#f0fdf4;border-top:1px solid #d1fae5;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;font-size:8pt;color:#94a3b8;margin-top:20px}
    /* Print buttons */
    .print-bar{background:#14532d;color:#fff;padding:10px 24px;display:flex;gap:10px;align-items:center;position:sticky;top:0;z-index:10}
    .print-btn{background:#16a34a;color:#fff;border:none;border-radius:6px;padding:6px 18px;font-size:10pt;cursor:pointer;font-weight:600}
    .print-btn:hover{background:#15803d}
    .close-btn{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:6px 18px;font-size:10pt;cursor:pointer}
  </style>
</head>
<body>
  <!-- Print toolbar -->
  <div class="print-bar no-print">
    <span style="flex:1;font-weight:600;font-size:11pt">Demande de Crédit N° ${demande.id}</span>
    <button class="print-btn" onclick="window.print()">🖨️ Imprimer / Télécharger PDF</button>
    <button class="close-btn" onclick="window.close()">✕ Fermer</button>
  </div>

  <!-- Page header -->
  <div class="header">
    <div>
      <div class="header-logo">CrediWise</div>
      <div class="header-sub">Plateforme de Gestion des Crédits</div>
    </div>
    <div class="header-right">
      <div><strong>Demande de Crédit</strong></div>
      <div>N° ${demande.id}</div>
      <div>Généré le ${fd(new Date().toISOString())}</div>
    </div>
  </div>

  <!-- Title bar -->
  <div class="title-bar">
    <h1>Fiche de Demande de Crédit</h1>
    <div class="ref">
      <span class="status-badge status-${demande.status}">${demande.status}</span>
    </div>
  </div>

  <div class="body">
    <!-- Section 1: Informations Client -->
    <div class="section">
      <div class="section-header">1. Informations Client</div>
      <div class="section-body">
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Client</span><span class="info-value">${clientName}</span></div>
          <div class="info-row"><span class="info-label">ID Client</span><span class="info-value">${demande.clientId || "—"}</span></div>
          <div class="info-row"><span class="info-label">Agence</span><span class="info-value">${demande.branchName || "—"}</span></div>
          <div class="info-row"><span class="info-label">Gestionnaire</span><span class="info-value">${demande.managerName || "—"}</span></div>
          <div class="info-row"><span class="info-label">Secteur d'activité</span><span class="info-value">${demande.businessSector || "—"}</span></div>
        </div>
      </div>
    </div>

    <!-- Section 2: Détails du Crédit -->
    <div class="section">
      <div class="section-header">2. Détails du Crédit</div>
      <div class="section-body">
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Objet du Crédit</span><span class="info-value">${demande.loanPurpose || "—"}</span></div>
          <div class="info-row"><span class="info-label">Montant Demandé</span><span class="info-value amount">${fa(demande.requestedAmount)}</span></div>
          <div class="info-row"><span class="info-label">Durée</span><span class="info-value">${demande.durationMonths ? demande.durationMonths + " mois" : "—"}</span></div>
          <div class="info-row"><span class="info-label">Produit</span><span class="info-value">${demande.productName || demande.productId || "—"}</span></div>
          <div class="info-row"><span class="info-label">Type d'objet</span><span class="info-value">${demande.assetType || "—"}</span></div>
          <div class="info-row"><span class="info-label">Capacité mensuelle</span><span class="info-value">${fa(demande.monthlyRepaymentCapacity)}</span></div>
          <div class="info-row"><span class="info-label">Canal de demande</span><span class="info-value">${demande.applicationChannel || "—"}</span></div>
          <div class="info-row"><span class="info-label">Date de création</span><span class="info-value">${fd(demande.createdAt)}</span></div>
        </div>
      </div>
    </div>

    <!-- Section 3: Évaluation des Risques -->
    <div class="section">
      <div class="section-header">3. Évaluation des Risques</div>
      <div class="section-body">
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">Restrictions bancaires</span>
            <span class="info-value ${demande.bankingRestriction ? 'risk-yes' : 'risk-no'}">${demande.bankingRestriction ? "⚠ OUI" : "✓ NON"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Problème juridique / compte bloqué</span>
            <span class="info-value ${demande.legalIssueOrAccountBlocked ? 'risk-yes' : 'risk-no'}">${demande.legalIssueOrAccountBlocked ? "⚠ OUI" : "✓ NON"}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 4: Cautions -->
    <div class="section">
      <div class="section-header">4. Cautions</div>
      <div class="section-body">
        <table>
          <thead><tr><th>Nom</th><th>ID Amplitude</th><th>Relation</th></tr></thead>
          <tbody>${guarantorsRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Section 5: Garanties / Collatéraux -->
    <div class="section">
      <div class="section-header">5. Garanties / Collatéraux</div>
      <div class="section-body">
        <table>
          <thead><tr><th>Propriétaire</th><th>Type</th><th style="text-align:right">Valeur Estimée</th></tr></thead>
          <tbody>${guaranteesRows}</tbody>
        </table>
      </div>
    </div>

    ${demande.consentText ? `
    <!-- Section 6: Déclaration de Consentement -->
    <div class="section">
      <div class="section-header">6. Déclaration de Consentement</div>
      <div class="section-body">
        <div class="consent">${demande.consentText.replace(/\n/g, "<br/>")}</div>
      </div>
    </div>` : ""}

    <!-- Signature block -->
    <div style="margin-top:32px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
      <div style="border-top:1px solid #94a3b8;padding-top:8px;text-align:center;font-size:9pt;color:#64748b">
        Signature du Client<br/><br/><br/>
      </div>
      <div style="border-top:1px solid #94a3b8;padding-top:8px;text-align:center;font-size:9pt;color:#64748b">
        Signature du Gestionnaire<br/><br/><br/>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>CrediWise — Plateforme de Gestion des Crédits</span>
    <span>Demande N° ${demande.id} | Généré le ${fd(new Date().toISOString())}</span>
  </div>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};

// ── Operation icon buttons ────────────────────────────────────────────────────
interface OpBtnProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}
const OpBtn: React.FC<OpBtnProps> = ({ title, icon, color, onClick, disabled = false, loading = false }) => (
  <button
    type="button"
    title={title}
    onClick={!disabled && !loading ? onClick : undefined}
    disabled={disabled || loading || !onClick}
    className={`inline-flex items-center justify-center w-7 h-7 rounded-md border transition-colors ${color} ${
      disabled || !onClick ? "opacity-30 cursor-not-allowed" : loading ? "opacity-60 cursor-wait" : "hover:scale-105 active:scale-95"
    }`}
  >
    {loading ? (
      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ) : icon}
  </button>
);

// SVG icons (24×24, stroke-based)
const EyeIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const PencilIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
const PaperPlaneIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);
const CheckCircleIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const XCircleIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ChartBarIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

// Shared input style for column filters
const filterInputClass =
  "w-full px-2 py-1 text-xs border border-surface-200 dark:border-surface-600 rounded bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const thClass =
  "px-3 py-3 text-left text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wide whitespace-nowrap";

// ── Main component ────────────────────────────────────────────────────────────
const DemandesPage = () => {
  const { t } = useTranslation("demandes");
  const commonT = useTranslation("common").t;
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [agences, setAgences] = useState<Agence[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusGroupFilter, setStatusGroupFilter] = useState<StatusGroup>("all");
  const [agenceFilter, setAgenceFilter] = useState("");
  const [colFilters, setColFilters] = useState<ColFilters>(EMPTY_COL_FILTERS);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDemande, setEditingDemande] = useState<Demande | null>(null);
  const [viewingDemande, setViewingDemande] = useState<Demande | null>(null);
  const [deletingDemande, setDeletingDemande] = useState<Demande | null>(null);
  const [rejectingDemande, setRejectingDemande] = useState<Demande | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  // ID of the demande currently being processed (submit / approve / analyse)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Permissions
  const userRole = user?.role || "";
  const canCreate = CAN_CREATE_ROLES.includes(userRole);
  const canEdit = CAN_EDIT_ROLES.includes(userRole);
  const canApprove = CAN_APPROVE_ROLES.includes(userRole);
  const canDelete = CAN_DELETE_ROLES.includes(userRole);
  const canManageAgence = CAN_MANAGE_AGENCE.includes(userRole);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await demandeService.getAll({ page: 0, size: 500 });
      setDemandes(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
    clientService.getAll({ page: 0, size: 200 }).then(r => setClients(r.data)).catch(() => {});
    // All roles can now read agences; load list for filter, or single agence for the label
    agenceService.getAll().then(r => setAgences(r.data)).catch(() => {});
  }, []);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredDemandes = useMemo(() => {
    let result = demandes;

    // Status group
    if (statusGroupFilter === "active") result = result.filter(d => ACTIVE_STATUSES.includes(d.status));
    else if (statusGroupFilter === "terminated") result = result.filter(d => TERMINATED_STATUSES.includes(d.status));
    else if (statusGroupFilter === "refused") result = result.filter(d => REFUSED_STATUSES.includes(d.status));

    // Agence (admin only — filter by branchName)
    if (agenceFilter) {
      const agence = agences.find(a => a.idBranch === agenceFilter);
      if (agence) {
        result = result.filter(d =>
          d.branchName?.toLowerCase() === agence.libelle.toLowerCase() ||
          d.branchName?.toLowerCase().includes(agence.libelle.toLowerCase())
        );
      }
    }

    // Column filters
    const q = (v: string) => v.trim().toLowerCase();
    if (colFilters.nomCC) result = result.filter(d => d.managerName?.toLowerCase().includes(q(colFilters.nomCC)));
    if (colFilters.idClient) result = result.filter(d => d.clientId.toLowerCase().includes(q(colFilters.idClient)));
    if (colFilters.nom) result = result.filter(d => displayClient(d).toLowerCase().includes(q(colFilters.nom)));
    if (colFilters.idDemande) result = result.filter(d => d.id.toString().includes(colFilters.idDemande.trim()));
    if (colFilters.statut) result = result.filter(d => d.status === colFilters.statut);
    if (colFilters.montant) result = result.filter(d => (d.requestedAmount?.toString() || "").includes(colFilters.montant.trim()));
    if (colFilters.secteur) result = result.filter(d => (d.businessSector || d.loanPurpose || "").toLowerCase().includes(q(colFilters.secteur)));

    return result;
  }, [demandes, statusGroupFilter, agenceFilter, agences, colFilters]);

  const setCol = (key: keyof ColFilters, value: string) =>
    setColFilters(prev => ({ ...prev, [key]: value }));

  const clearAllFilters = () => {
    setStatusGroupFilter("all");
    setAgenceFilter("");
    setColFilters(EMPTY_COL_FILTERS);
  };

  const hasActiveFilters =
    statusGroupFilter !== "all" ||
    agenceFilter !== "" ||
    Object.values(colFilters).some(v => v !== "");

  // ── Agence label for non-admin users ─────────────────────────────────────
  const userAgenceName = useMemo(() => {
    if (!user?.agenceId) return "—";
    const agence = agences.find(a => a.idBranch === user.agenceId);
    return agence ? agence.libelle : user.agenceId;
  }, [agences, user?.agenceId]);

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleCreate = async (data: {
    clientId: string; loanPurpose: string; requestedAmount: number; durationMonths: number;
    productId?: string; assetType?: string; monthlyRepaymentCapacity?: number;
    applicationChannel?: string; bankingRestriction: boolean; legalIssueOrAccountBlocked: boolean;
    consentText?: string;
    guarantors?: Array<{ name?: string; amplitudeId?: string; clientRelationship?: string }>;
    guarantees?: Array<{ owner?: string; type?: string; estimatedValue?: number }>;
  }) => {
    setIsSubmitting(true);
    try {
      const payload: DemandeCreateRequest = {
        clientId: data.clientId,
        loanPurpose: data.loanPurpose,
        requestedAmount: Number(data.requestedAmount),
        durationMonths: Number(data.durationMonths),
        bankingRestriction: data.bankingRestriction,
        legalIssueOrAccountBlocked: data.legalIssueOrAccountBlocked,
        ...(data.productId && { productId: data.productId }),
        ...(data.assetType && { assetType: data.assetType }),
        ...(Number.isFinite(data.monthlyRepaymentCapacity) && { monthlyRepaymentCapacity: Number(data.monthlyRepaymentCapacity) }),
        ...(data.applicationChannel && { applicationChannel: data.applicationChannel }),
        ...(data.consentText && { consentText: data.consentText }),
        ...(data.guarantors && data.guarantors.length > 0 && { guarantors: data.guarantors }),
        ...(data.guarantees && data.guarantees.length > 0 && { guarantees: data.guarantees }),
      };
      await demandeService.create(payload);
      toast.success(t("messages.created"));
      setIsCreateOpen(false);
      fetchDemandes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("messages.loadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: {
    clientId: string; loanPurpose: string; requestedAmount: number; durationMonths: number;
    productId?: string; assetType?: string; monthlyRepaymentCapacity?: number;
    applicationChannel?: string; bankingRestriction?: boolean; legalIssueOrAccountBlocked?: boolean;
    consentText?: string;
    guarantors?: Array<{ name?: string; amplitudeId?: string; clientRelationship?: string }>;
    guarantees?: Array<{ owner?: string; type?: string; estimatedValue?: number }>;
  }) => {
    if (!editingDemande) return;
    setIsSubmitting(true);
    try {
      const payload: DemandeUpdateRequest = {
        loanPurpose: data.loanPurpose,
        requestedAmount: Number(data.requestedAmount),
        durationMonths: Number(data.durationMonths),
        ...(data.productId && { productId: data.productId }),
        ...(data.assetType && { assetType: data.assetType }),
        ...(Number.isFinite(data.monthlyRepaymentCapacity) && { monthlyRepaymentCapacity: Number(data.monthlyRepaymentCapacity) }),
        ...(data.applicationChannel && { applicationChannel: data.applicationChannel }),
        ...(data.bankingRestriction !== undefined && { bankingRestriction: data.bankingRestriction }),
        ...(data.legalIssueOrAccountBlocked !== undefined && { legalIssueOrAccountBlocked: data.legalIssueOrAccountBlocked }),
        ...(data.consentText && { consentText: data.consentText }),
        ...(data.guarantors && data.guarantors.length > 0 && { guarantors: data.guarantors }),
        ...(data.guarantees && data.guarantees.length > 0 && { guarantees: data.guarantees }),
      };
      await demandeService.update(editingDemande.id, payload);
      toast.success(t("messages.updated"));
      setEditingDemande(null);
      fetchDemandes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("messages.loadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDemande) return;
    setIsDeleting(true);
    try {
      await demandeService.remove(deletingDemande.id);
      toast.success(t("messages.deleted"));
      setDeletingDemande(null);
      fetchDemandes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("messages.loadError"));
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Operation handlers ───────────────────────────────────────────────────
  const handleSubmit = async (d: Demande) => {
    setActionLoadingId(d.id);
    try {
      const res = await demandeService.submit(d.id);
      toast.success(t("messages.submitted"));
      if (res.data.dossierId != null) {
        // Products 101/102/103 → ANALYSE: go to analyse dossier
        navigate(`/analyse/dossiers/${res.data.dossierId}`);
      } else {
        // Other products → CHECK_BEFORE_COMMITTEE: no analyse dossier yet
        toast.success(t("messages.checkBeforeCommittee"));
        fetchDemandes();
        setActionLoadingId(null);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("messages.loadError"));
      setActionLoadingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingDemande) return;
    setIsRejecting(true);
    try {
      await demandeService.updateStatus(rejectingDemande.id, "REJECTED");
      toast.success(t("messages.rejected"));
      setRejectingDemande(null);
      fetchDemandes();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("messages.loadError"));
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAnalyse = async (d: Demande) => {
    setActionLoadingId(d.id);
    try {
      const dossiersRes = await analyseService.getDossierList();
      const dossier = dossiersRes.data.find(dos => dos.demandeId === d.id);
      if (dossier) {
        navigate(`/analyse/dossiers/${dossier.id}`);
      } else {
        toast.error(t("messages.loadError"));
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || t("messages.loadError"));
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="page-container space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t("title")}</h1>
          <p className="text-caption text-surface-600 dark:text-surface-400 mt-1">{t("subtitle")}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            {t("buttons.newDemande")}
          </Button>
        )}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">

          {/* Agence selector */}
          {canManageAgence ? (
            <select
              value={agenceFilter}
              onChange={e => setAgenceFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-surface-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t("filters.toutesAgences")}</option>
              {agences.filter(a => a.active !== false).map(a => (
                <option key={a.idBranch} value={a.idBranch}>{a.libelle}</option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 dark:bg-surface-700 text-sm border border-surface-200 dark:border-surface-600">
              <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              <span className="text-surface-500 dark:text-surface-400 font-medium text-xs uppercase tracking-wide">{t("filters.agence")}:</span>
              <span className="text-surface-900 dark:text-surface-50 font-semibold">{userAgenceName}</span>
            </div>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-surface-200 dark:bg-surface-700 hidden sm:block" />

          {/* Status group dropdown — green */}
          <select
            value={statusGroupFilter}
            onChange={e => setStatusGroupFilter(e.target.value as StatusGroup)}
            className="px-3 py-2 text-sm font-medium rounded-lg border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{t("filters.statusGroup.all")}</option>
            <option value="active">{t("filters.statusGroup.active")}</option>
            <option value="terminated">{t("filters.statusGroup.terminated")}</option>
            <option value="refused">{t("filters.statusGroup.refused")}</option>
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors"
            >
              {t("filters.clearAll")}
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchDemandes}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-600 transition-colors disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}><RefreshIcon /></span>
            {t("filters.refresh")}
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="table" rows={8} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm bg-white dark:bg-surface-800">
          <table className="min-w-full text-sm">

            {/* ── Column headers ─────────────────────────────────────── */}
            <thead>
              <tr className="bg-surface-50 dark:bg-surface-900/50 border-b border-surface-200 dark:border-surface-700">
                <th className={thClass}>{t("table.nomCC")}</th>
                <th className={thClass}>{t("table.idClient")}</th>
                <th className={thClass}>{t("table.nom")}</th>
                <th className={thClass}>{t("table.idDemande")}</th>
                <th className={thClass}>{t("table.statut")}</th>
                <th className={thClass}>{t("table.montant")}</th>
                <th className={thClass}>{t("table.secteur")}</th>
                <th className={thClass}>{t("table.produit")}</th>
                <th className={thClass}>{t("table.cycle")}</th>
                <th className={thClass}>{t("table.date")}</th>
                <th className={`${thClass} text-right`}>{t("table.operations")}</th>
              </tr>

              {/* ── Column filters ─────────────────────────────────── */}
              <tr className="bg-white dark:bg-surface-800 border-b-2 border-surface-200 dark:border-surface-700">
                {/* Nom CC */}
                <td className="px-3 py-2">
                  <input
                    value={colFilters.nomCC}
                    onChange={e => setCol("nomCC", e.target.value)}
                    placeholder={t("filters.searchPlaceholder")}
                    className={filterInputClass}
                  />
                </td>
                {/* ID client */}
                <td className="px-3 py-2">
                  <input
                    value={colFilters.idClient}
                    onChange={e => setCol("idClient", e.target.value)}
                    placeholder={t("filters.idClientPlaceholder")}
                    className={filterInputClass}
                  />
                </td>
                {/* Nom */}
                <td className="px-3 py-2">
                  <input
                    value={colFilters.nom}
                    onChange={e => setCol("nom", e.target.value)}
                    placeholder={t("filters.searchPlaceholder")}
                    className={filterInputClass}
                  />
                </td>
                {/* ID demande */}
                <td className="px-3 py-2">
                  <input
                    value={colFilters.idDemande}
                    onChange={e => setCol("idDemande", e.target.value)}
                    placeholder={t("filters.idDemandePlaceholder")}
                    className={filterInputClass}
                  />
                </td>
                {/* Statut */}
                <td className="px-3 py-2">
                  <select
                    value={colFilters.statut}
                    onChange={e => setCol("statut", e.target.value)}
                    className={filterInputClass}
                  >
                    <option value="">{t("filters.statusPlaceholder")}</option>
                    {getAllStatuses().map(s => (
                      <option key={s} value={s}>{commonT(getStatusKey(s))}</option>
                    ))}
                  </select>
                </td>
                {/* Montant */}
                <td className="px-3 py-2">
                  <input
                    value={colFilters.montant}
                    onChange={e => setCol("montant", e.target.value)}
                    placeholder={t("filters.montantPlaceholder")}
                    className={filterInputClass}
                  />
                </td>
                {/* Secteur */}
                <td className="px-3 py-2">
                  <input
                    value={colFilters.secteur}
                    onChange={e => setCol("secteur", e.target.value)}
                    placeholder={t("filters.secteurPlaceholder")}
                    className={filterInputClass}
                  />
                </td>
                {/* Produit — no filter */}
                <td className="px-3 py-2" />
                {/* Cycle — no filter */}
                <td className="px-3 py-2" />
                {/* Date — no filter */}
                <td className="px-3 py-2" />
                {/* Operations — no filter */}
                <td className="px-3 py-2" />
              </tr>
            </thead>

            {/* ── Data rows ──────────────────────────────────────────── */}
            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
              {filteredDemandes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-surface-400 dark:text-surface-500">
                    {t("messages.noResults")}
                  </td>
                </tr>
              ) : (
                filteredDemandes.map(d => (
                  <tr key={d.id} className="hover:bg-surface-50 dark:hover:bg-surface-700/30 transition-colors">

                    {/* Nom CC */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {d.managerName || "—"}
                      </span>
                    </td>

                    {/* ID client */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-surface-500 dark:text-surface-400 bg-surface-100 dark:bg-surface-700 px-1.5 py-0.5 rounded">
                        {d.clientId.slice(0, 8)}…
                      </span>
                    </td>

                    {/* Nom */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm text-surface-900 dark:text-surface-50">
                        {displayClient(d)}
                      </span>
                    </td>

                    {/* ID demande */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-surface-700 dark:text-surface-300">
                        {d.id}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge variant={statusVariant(d.status)}>
                        {commonT(getStatusKey(d.status))}
                      </Badge>
                    </td>

                    {/* Montant */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                        {formatAmount(d.requestedAmount)}
                      </span>
                    </td>

                    {/* Secteur */}
                    <td className="px-3 py-3 max-w-[160px]">
                      <span className="text-xs text-surface-600 dark:text-surface-400 line-clamp-2">
                        {d.businessSector || d.loanPurpose || "—"}
                      </span>
                    </td>

                    {/* Produit */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-surface-600 dark:text-surface-400">
                        {d.productName || d.productId || "—"}
                      </span>
                    </td>

                    {/* Cycle */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-surface-600 dark:text-surface-400">
                        {d.cycle ?? "—"}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-surface-500 dark:text-surface-400">
                        {formatDate(d.createdAt)}
                      </span>
                    </td>

                    {/* Operations — 7 icon buttons */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 flex-nowrap">
                        {/* Voir */}
                        <OpBtn
                          title={t("buttons.voir")}
                          icon={<EyeIcon />}
                          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                          onClick={() => setViewingDemande(d)}
                        />
                        {/* Modifier — DRAFT only, editor role */}
                        <OpBtn
                          title={t("buttons.modifier")}
                          icon={<PencilIcon />}
                          color="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          onClick={() => setEditingDemande(d)}
                          disabled={!canEdit || d.status !== "DRAFT"}
                        />
                        {/* Soumettre — DRAFT only, editor role */}
                        <OpBtn
                          title={t("buttons.soumettre")}
                          icon={<PaperPlaneIcon />}
                          color="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                          onClick={() => handleSubmit(d)}
                          disabled={!canEdit || d.status !== "DRAFT"}
                          loading={actionLoadingId === d.id}
                        />
                        {/* Rejeter — not already rejected/disbursed, approve role */}
                        <OpBtn
                          title={t("buttons.rejeter")}
                          icon={<XCircleIcon />}
                          color="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                          onClick={() => setRejectingDemande(d)}
                          disabled={!canApprove || d.status === "REJECTED" || d.status === "DISBURSE"}
                        />
                        {/* Analyser — only for ANALYSE status (products 101/102/103); CHECK_BEFORE_COMMITTEE has no dossier */}
                        <OpBtn
                          title={t("buttons.analyser")}
                          icon={<ChartBarIcon />}
                          color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                          onClick={() => handleAnalyse(d)}
                          disabled={d.status !== "ANALYSE" && d.status !== "CREDIT_RISK_ANALYSIS" && d.status !== "COMMITTEE" && d.status !== "WAITING_CLIENT_APPROVAL" && d.status !== "READY_TO_DISBURSE"}
                          loading={actionLoadingId === d.id}
                        />
                        {/* Supprimer — DRAFT only, delete role */}
                        <OpBtn
                          title={t("buttons.supprimer")}
                          icon={<TrashIcon />}
                          color="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          onClick={() => setDeletingDemande(d)}
                          disabled={!canDelete || d.status !== "DRAFT"}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Row count */}
          {filteredDemandes.length > 0 && (
            <div className="px-4 py-2 border-t border-surface-100 dark:border-surface-700 text-xs text-surface-400 dark:text-surface-500 text-right">
              {filteredDemandes.length} / {demandes.length} {t("table.total").toLowerCase()}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <Modal title={t("buttons.newDemande")} isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="xl">
        <DemandeForm onSubmit={handleCreate} clients={clients} isLoading={isSubmitting} />
      </Modal>

      <Modal title={t("modal.editDraftOnly")} isOpen={!!editingDemande} onClose={() => setEditingDemande(null)} size="xl">
        {editingDemande && (
          <DemandeForm onSubmit={handleUpdate} clients={clients} isLoading={isSubmitting} defaultValues={editingDemande} isEdit />
        )}
      </Modal>

      <Modal title={t("modal.details")} isOpen={!!viewingDemande} onClose={() => setViewingDemande(null)} size="xl">
        {viewingDemande && (
          <div className="space-y-6">
            <div className="space-y-2 text-sm">
              {[
                { label: "ID", value: viewingDemande.id },
                { label: "Client", value: displayClient(viewingDemande) },
                { label: "Status", value: viewingDemande.status },
                { label: "Loan Purpose", value: viewingDemande.loanPurpose },
                { label: "Requested Amount", value: viewingDemande.requestedAmount?.toLocaleString() },
                { label: "Duration", value: viewingDemande.durationMonths ? `${viewingDemande.durationMonths} months` : undefined },
                { label: "Product", value: viewingDemande.productName || viewingDemande.productId },
                { label: "Business Sector", value: viewingDemande.businessSector },
                { label: "Asset Type", value: viewingDemande.assetType },
                { label: "Monthly Capacity", value: viewingDemande.monthlyRepaymentCapacity?.toLocaleString() },
                { label: "Manager", value: viewingDemande.managerName },
                { label: "Branch", value: viewingDemande.branchName },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex justify-between gap-4 py-1.5 border-b border-surface-100 dark:border-surface-700">
                  <span className="text-surface-600 dark:text-surface-300 font-medium min-w-[150px]">{r.label}</span>
                  <span className="text-surface-900 dark:text-surface-50 text-right break-all">{r.value}</span>
                </div>
              ))}
            </div>
            {viewingDemande.consentText && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 p-4">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase mb-2">{t("modal.declarationOfConsent")}</p>
                <div dir="rtl" className="text-xs text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed text-justify">
                  {viewingDemande.consentText}
                </div>
              </div>
            )}
            {viewingDemande.guarantors && viewingDemande.guarantors.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">{t("modal.guarantors")}</p>
                <table className="w-full text-xs">
                  <thead><tr className="bg-surface-100 dark:bg-surface-700"><th className="px-3 py-2 text-left">{t("modal.guarantorName")}</th><th className="px-3 py-2 text-left">{t("modal.guarantorAmplitudeId")}</th><th className="px-3 py-2 text-left">{t("modal.guarantorRelationship")}</th></tr></thead>
                  <tbody>{viewingDemande.guarantors.map((g, i) => <tr key={i} className="border-b border-surface-100 dark:border-surface-700"><td className="px-3 py-2">{g.name || "—"}</td><td className="px-3 py-2">{g.amplitudeId || "—"}</td><td className="px-3 py-2">{g.clientRelationship || "—"}</td></tr>)}</tbody>
                </table>
              </div>
            )}
            {viewingDemande.guarantees && viewingDemande.guarantees.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">{t("modal.guarantees")}</p>
                <table className="w-full text-xs">
                  <thead><tr className="bg-surface-100 dark:bg-surface-700"><th className="px-3 py-2 text-left">{t("modal.guaranteeOwner")}</th><th className="px-3 py-2 text-left">{t("modal.guaranteeType")}</th><th className="px-3 py-2 text-right">{t("modal.guaranteeValue")}</th></tr></thead>
                  <tbody>{viewingDemande.guarantees.map((g, i) => <tr key={i} className="border-b border-surface-100 dark:border-surface-700"><td className="px-3 py-2">{g.owner || "—"}</td><td className="px-3 py-2">{g.type || "—"}</td><td className="px-3 py-2 text-right">{Number(g.estimatedValue || 0).toLocaleString()} TND</td></tr>)}</tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-surface-100">
              {viewingDemande.status === "DRAFT" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                  {t("messages.pdfDraftBlocked")}
                </p>
              )}
              <Button
                variant="outline"
                disabled={viewingDemande.status === "DRAFT"}
                onClick={() => generateDemandePdf(viewingDemande, t("messages.allowPopUps"), t("messages.noGuarantors"), t("messages.noGuarantees"))}
              >
                {t("modal.downloadPdf")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingDemande}
        onClose={() => setDeletingDemande(null)}
        onConfirm={handleDelete}
        title={t("confirm.deleteTitle")}
        message={t("confirm.deleteMessage", { id: deletingDemande?.id.toString() || "" })}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={!!rejectingDemande}
        onClose={() => setRejectingDemande(null)}
        onConfirm={handleRejectConfirm}
        title={t("confirm.rejectTitle")}
        message={t("confirm.rejectMessage", { id: rejectingDemande?.id.toString() || "" })}
        isLoading={isRejecting}
      />
    </div>
  );
};

export default DemandesPage;
