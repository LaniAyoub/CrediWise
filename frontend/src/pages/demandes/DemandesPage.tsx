import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { clientService } from "@/services/client.service";
import { demandeService } from "@/services/demande.service";
import { useAuth } from "@/hooks/useAuth";
import { getStatusKey, getAllStatuses } from "@/utils/statusMapping";
import type { Client } from "@/types/client.types";
import type {
  Demande,
  DemandeCreateRequest,
  DemandeStatut,
  DemandeUpdateRequest,
} from "@/types/demande.types";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import DemandeForm from "@/components/forms/DemandeForm";
import toast from "react-hot-toast";

// ── Role-Based Access Control ───────────────────────────────────────────────
const CAN_CREATE_ROLES = ["SUPER_ADMIN", "FRONT_OFFICE"];
const CAN_EDIT_ROLES = ["SUPER_ADMIN", "FRONT_OFFICE"];
const CAN_DELETE_ROLES = ["SUPER_ADMIN"];
const CAN_APPROVE_ROLES = ["SUPER_ADMIN", "HEAD_OFFICE_DM", "BRANCH_DM"];

const statusVariant = (status: DemandeStatut): "warning" | "info" | "success" | "danger" => {
  if (status === "DRAFT") return "warning";
  if (status === "SUBMITTED") return "info";
  if (status === "ANALYSE") return "info";
  if (status === "CHECK_BEFORE_COMMITTEE") return "info";
  if (status === "CREDIT_RISK_ANALYSIS") return "info";
  if (status === "COMMITTEE") return "warning";
  if (status === "WAITING_CLIENT_APPROVAL") return "warning";
  if (status === "READY_TO_DISBURSE") return "success";
  if (status === "DISBURSE") return "success";
  if (status === "REJECTED") return "danger";
  return "danger";
};

const generateDemandePdf = (demande: Demande, popUpMessage?: string, noGuarantorsMsg?: string, noGuaranteesMsg?: string) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(popUpMessage || "Please allow pop-ups to download PDF");
    return;
  }

  const guarantorsHtml = (demande.guarantors && demande.guarantors.length > 0)
    ? demande.guarantors
        .map(
          (g) =>
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.name || "—"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.amplitudeId || "—"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.clientRelationship || "—"}</td>
            </tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${noGuarantorsMsg || "No guarantors"}</td></tr>`;

  const guaranteesHtml = (demande.guarantees && demande.guarantees.length > 0)
    ? demande.guarantees
        .map(
          (g) =>
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.owner || "—"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${g.type || "—"}</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${Number(g.estimatedValue || 0).toLocaleString()} MAD</td>
            </tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${noGuaranteesMsg || "No guarantees"}</td></tr>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Demande ${demande.id}</title>
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          max-width: 850px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          border-bottom: 2px solid #007bff;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0 0 10px 0;
          color: #007bff;
          font-size: 24px;
        }
        .header-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #666;
        }
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section-title {
          background-color: #f0f0f0;
          padding: 10px;
          font-weight: bold;
          font-size: 13px;
          border-left: 3px solid #007bff;
          margin-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 15px;
        }
        .info-row {
          font-size: 13px;
        }
        .info-label {
          font-weight: bold;
          color: #555;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          margin-top: 10px;
        }
        th {
          background-color: #007bff;
          color: white;
          padding: 10px;
          text-align: left;
        }
        td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
        .consent-box {
          background-color: #fff9e6;
          border: 1px solid #ffc107;
          padding: 12px;
          font-size: 11px;
          line-height: 1.8;
          margin-top: 10px;
          text-align: justify;
          direction: rtl;
        }
        .signature-section {
          margin-top: 30px;
          display: flex;
          justify-content: space-around;
          font-size: 12px;
        }
        .signature-box {
          text-align: center;
          width: 150px;
        }
        .signature-line {
          border-top: 1px solid #000;
          margin-top: 40px;
          margin-bottom: 5px;
        }
        .no-print {
          text-align: center;
          margin: 20px 0;
        }
        .print-btn, .close-btn {
          padding: 8px 16px;
          margin: 0 5px;
          font-size: 13px;
          cursor: pointer;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
        }
        .close-btn {
          background-color: #999;
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="print-btn" onclick="window.print()">Print / Download PDF</button>
        <button class="close-btn" onclick="window.close()">Close</button>
      </div>

      <div class="header">
        <h1>Demande de Financement</h1>
        <div class="header-info">
          <span><strong>Reference:</strong> #${demande.id}</span>
          <span><strong>Date:</strong> ${new Date(demande.createdAt || new Date()).toLocaleDateString()}</span>
          <span><strong>Status:</strong> ${demande.status}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">INFORMATION CLIENT</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Client:</span> ${displayClient(demande)}</div>
          <div class="info-row"><span class="info-label">Branch:</span> ${demande.branchName || "—"}</div>
          <div class="info-row"><span class="info-label">Manager:</span> ${demande.managerName || "—"}</div>
          <div class="info-row"><span class="info-label">Type:</span> ${demande.clientType || "—"}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">CREDIT REQUEST</div>
        <div class="info-grid">
          <div class="info-row"><span class="info-label">Purpose:</span> ${demande.loanPurpose || "—"}</div>
          <div class="info-row"><span class="info-label">Amount:</span> ${Number(demande.requestedAmount || 0).toLocaleString()} MAD</div>
          <div class="info-row"><span class="info-label">Duration:</span> ${demande.durationMonths || "—"} months</div>
          <div class="info-row"><span class="info-label">Product:</span> ${demande.productName || demande.productId || "—"}</div>
          <div class="info-row"><span class="info-label">Asset Type:</span> ${demande.assetType || "—"}</div>
          <div class="info-row"><span class="info-label">Monthly Capacity:</span> ${Number(demande.monthlyRepaymentCapacity || 0).toLocaleString()} MAD</div>
          <div class="info-row"><span class="info-label">Channel:</span> ${demande.applicationChannel || "—"}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">GUARANTORS</div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Amplitude ID</th>
              <th>Relationship</th>
            </tr>
          </thead>
          <tbody>
            ${guarantorsHtml}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">GUARANTEES / COLLATERAL</div>
        <table>
          <thead>
            <tr>
              <th>Owner</th>
              <th>Type</th>
              <th>Estimated Value (MAD)</th>
            </tr>
          </thead>
          <tbody>
            ${guaranteesHtml}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">DECLARATION OF CONSENT</div>
        <div class="consent-box">
          إنّي الممضي أسفله صاحب بطاقة التعريف الوطنية المذكورة أعلاه أشهد وأصرّح بصحّة المعطيات والمعلومات المبيّنة أعلاه<br><br>
          كما أنّي وطبقا لأحكام القانون الأساسي عدد 33 لسنة 2004 المؤرخ في 24 جويلية 2004 المتعلّق بحماية المعطيات الشخصية<br><br>
          أصرّح وأشهد أنّه قد تمّ إعلامي من طرف شركة أدفانس تونيزي أنّ المعطيات الشخصية التي تخصّني تمّ جمعها وتمّت معالجتها من طرف الشركة في إطار المطلب المقدّم من طرفي للحصول على تمويل صغير وأنّه قد تمّ إعلامي بالهدف من تجميعها وبالحقوق المرتبطة بها والتي يخوّلها لي القانون وأشهد بقبولي لتجميع ومعالجة معطياتي الشخصية.
        </div>
      </div>

      <div class="section">
        <div class="signature-section">
          <div class="signature-box">
            <p>Client / Representative</p>
            <div class="signature-line"></div>
            <p style="font-size: 10px; color: #999;">Date & Signature</p>
          </div>
          <div class="signature-box">
            <p>Manager</p>
            <div class="signature-line"></div>
            <p style="font-size: 10px; color: #999;">Date & Signature</p>
          </div>
          <div class="signature-box">
            <p>Agency Director</p>
            <div class="signature-line"></div>
            <p style="font-size: 10px; color: #999;">Date & Signature</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

const displayClient = (d: Demande) =>
  `${d.firstName || ""} ${d.lastName || ""}`.trim() || d.companyName || d.clientId;

const formatAmount = (value?: number) =>
  value != null ? `${Number(value).toLocaleString()} MAD` : "—";

const DemandesPage = () => {
  const { t } = useTranslation('demandes');
  const commonT = useTranslation('common').t;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | DemandeStatut>("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDemande, setEditingDemande] = useState<Demande | null>(null);
  const [viewingDemande, setViewingDemande] = useState<Demande | null>(null);
  const [deletingDemande, setDeletingDemande] = useState<Demande | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [analyzingDemandeId, setAnalyzingDemandeId] = useState<number | null>(null);

  const fetchDemandes = async () => {
    setLoading(true);
    try {
      const res = await demandeService.getAll({ page: 0, size: 100, ...(statusFilter && { statut: statusFilter }) });
      setDemandes(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await clientService.getAll({ page: 0, size: 200 });
      setClients(res.data);
    } catch {
      // handled by interceptor
    }
  };

  useEffect(() => {
    fetchDemandes();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredDemandes = useMemo(() => {
    if (!searchQuery) return demandes;
    const q = searchQuery.toLowerCase();
    return demandes.filter(
      (d) =>
        displayClient(d).toLowerCase().includes(q) ||
        d.status.toLowerCase().includes(q) ||
        d.loanPurpose?.toLowerCase().includes(q) ||
        d.managerName?.toLowerCase().includes(q) ||
        d.branchName?.toLowerCase().includes(q) ||
        d.id.toString().includes(q)
    );
  }, [demandes, searchQuery]);

  const demandeStats = useMemo(() => {
    const total = demandes.length;
    const draft = demandes.filter((d) => d.status === "DRAFT").length;
    const submitted = demandes.filter((d) => d.status === "SUBMITTED").length;
    const validated = demandes.filter((d) => d.status === "ANALYSE").length;
    return { total, draft, submitted, validated };
  }, [demandes]);

  const handleCreate = async (data: {
    clientId: string;
    loanPurpose: string;
    requestedAmount: number;
    durationMonths: number;
    productId?: string;
    assetType?: string;
    monthlyRepaymentCapacity?: number;
    applicationChannel?: string;
    bankingRestriction: boolean;
    legalIssueOrAccountBlocked: boolean;
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
        ...(Number.isFinite(data.monthlyRepaymentCapacity) && {
          monthlyRepaymentCapacity: Number(data.monthlyRepaymentCapacity),
        }),
        ...(data.applicationChannel && { applicationChannel: data.applicationChannel }),
        ...(data.consentText && { consentText: data.consentText }),
        ...(data.guarantors && data.guarantors.length > 0 && { guarantors: data.guarantors }),
        ...(data.guarantees && data.guarantees.length > 0 && { guarantees: data.guarantees }),
      };

      await demandeService.create(payload);
      toast.success(t('messages.created'));
      setIsCreateOpen(false);
      fetchDemandes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: {
    clientId: string;
    loanPurpose: string;
    requestedAmount: number;
    durationMonths: number;
    productId?: string;
    assetType?: string;
    monthlyRepaymentCapacity?: number;
    applicationChannel?: string;
    bankingRestriction?: boolean;
    legalIssueOrAccountBlocked?: boolean;
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
        ...(Number.isFinite(data.monthlyRepaymentCapacity) && {
          monthlyRepaymentCapacity: Number(data.monthlyRepaymentCapacity),
        }),
        ...(data.applicationChannel && { applicationChannel: data.applicationChannel }),
        ...(data.bankingRestriction !== undefined && { bankingRestriction: data.bankingRestriction }),
        ...(data.legalIssueOrAccountBlocked !== undefined && { legalIssueOrAccountBlocked: data.legalIssueOrAccountBlocked }),
        ...(data.consentText && { consentText: data.consentText }),
        ...(data.guarantors && data.guarantors.length > 0 && { guarantors: data.guarantors }),
        ...(data.guarantees && data.guarantees.length > 0 && { guarantees: data.guarantees }),
      };

      await demandeService.update(editingDemande.id, payload);
      toast.success(t('messages.updated'));
      setEditingDemande(null);
      fetchDemandes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDemande = async (demande: Demande) => {
    try {
      await demandeService.submit(demande.id);
      toast.success(t('messages.submitted'));
      fetchDemandes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    }
  };

  const handleDecision = async (demande: Demande, status: "ANALYSE" | "REJECTED") => {
    try {
      await demandeService.updateStatus(demande.id, status);
      toast.success(status === "ANALYSE" ? t('messages.validated') : t('messages.rejected'));
      fetchDemandes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    }
  };

  const handleDelete = async () => {
    if (!deletingDemande) return;
    setIsDeleting(true);
    try {
      await demandeService.remove(deletingDemande.id);
      toast.success(t('messages.deleted'));
      setDeletingDemande(null);
      fetchDemandes();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartAnalysis = async (demande: Demande) => {
    // Only allow if status is SUBMITTED
    if (demande.status !== 'SUBMITTED') {
      toast.error('Can only start analysis from SUBMITTED status');
      return;
    }

    setAnalyzingDemandeId(demande.id);
    try {
      // Unified API call: creates dossier + updates status atomically
      const result = await demandeService.startAnalysis(demande.id);

      // Optimistically update the local state with new status
      setDemandes(prevDemandes =>
        prevDemandes.map(d =>
          d.id === demande.id ? { ...d, status: 'ANALYSE' } : d
        )
      );

      toast.success(result.data.message || 'Analysis started successfully');

      // Navigate to the newly created dossier
      setTimeout(() => {
        navigate(`/analyse/dossiers/${result.data.dossierId}`);
      }, 1000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to start analysis');
      // Refetch to ensure we have correct state if optimistic update was wrong
      fetchDemandes();
    } finally {
      setAnalyzingDemandeId(null);
    }
  };

  const canCreate = CAN_CREATE_ROLES.includes(user?.role || "");
  const canEdit = CAN_EDIT_ROLES.includes(user?.role || "");
  const canDelete = CAN_DELETE_ROLES.includes(user?.role || "");
  const canApprove = CAN_APPROVE_ROLES.includes(user?.role || "");

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t('title')}</h1>
          <p className="text-caption text-surface-600 dark:text-surface-400 mt-2">{t('subtitle')}</p>
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
            {t('buttons.newDemande')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <SearchBar
            placeholder={t('searchPlaceholder')}
            onSearch={setSearchQuery}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | DemandeStatut)}
          className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 focus-ring transition-colors"
        >
          <option value="">{commonT('dossier.allStatuses')}</option>
          {getAllStatuses().map((status) => (
            <option key={status} value={status}>
              {commonT(getStatusKey(status))}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 transition-colors">
          <p className="text-label text-surface-600 dark:text-surface-400">{t('table.total')}</p>
          <p className="text-xl font-bold text-surface-900 dark:text-surface-50 mt-2">{demandeStats.total}</p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 transition-colors">
          <p className="text-label text-amber-700 dark:text-amber-300">{commonT(getStatusKey('DRAFT'))}</p>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-2">{demandeStats.draft}</p>
        </div>
        <div className="rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50 dark:bg-brand-900/20 px-4 py-3 transition-colors">
          <p className="text-label text-brand-700 dark:text-brand-300">{commonT(getStatusKey('SUBMITTED'))}</p>
          <p className="text-xl font-bold text-brand-900 dark:text-brand-200 mt-2">{demandeStats.submitted}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3 transition-colors">
          <p className="text-label text-emerald-700 dark:text-emerald-300">{commonT(getStatusKey('ANALYSE'))}</p>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-2">{demandeStats.validated}</p>
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          headers={[t('table.client'), t('table.status'), "Financial", "Assignment", "Timeline", t('table.actions')]}
          isEmpty={filteredDemandes.length === 0}
          emptyMessage={t('messages.noResults')}
        >
          {filteredDemandes.map((d) => {
            const canEditThisDemande = d.status === "DRAFT" && canEdit;
            const canSubmitThisDemande = d.status === "DRAFT" && canCreate;
            const canDecideThisDemande = d.status === "SUBMITTED" && canApprove;
            const canDeleteThisDemande = d.status === "DRAFT" && canDelete;

            return (
              <tr key={d.id} className="table-row-hover">
                <td className="px-4 py-3 align-top">
                  <p className="text-sm font-medium text-surface-800">{displayClient(d)}</p>
                  <p className="text-xs text-surface-400">#{d.id}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <Badge variant={statusVariant(d.status)}>{commonT(getStatusKey(d.status))}</Badge>
                </td>
                <td className="px-4 py-3 align-top text-sm text-surface-600">
                  <p className="font-medium text-surface-700">{formatAmount(d.requestedAmount)}</p>
                  <p className="text-xs text-surface-400">
                    {d.durationMonths ? `${d.durationMonths} months` : "—"}
                  </p>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-1">{d.loanPurpose || "—"}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-sm text-surface-600">{d.managerName || "—"}</p>
                  <p className="text-xs text-surface-400">{d.branchName || "—"}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="text-xs text-surface-500">
                    Created: {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                  </p>
                  <p className="text-xs text-surface-400">
                    Updated: {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : "—"}
                  </p>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="min-w-[78px]" onClick={() => setViewingDemande(d)}>
                      {t('buttons.view')}
                    </Button>
                    {canEditThisDemande && (
                      <Button variant="outline" size="sm" className="min-w-[78px]" onClick={() => setEditingDemande(d)}>
                        {t('buttons.edit')}
                      </Button>
                    )}
                    {canSubmitThisDemande && (
                      <Button variant="outline" size="sm" className="min-w-[78px]" onClick={() => handleSubmitDemande(d)}>
                        {t('buttons.submit')}
                      </Button>
                    )}
                    {canDecideThisDemande && (
                      <>
                        <Button variant="outline" size="sm" className="min-w-[78px]" onClick={() => handleDecision(d, "ANALYSE")}>
                          {t('buttons.approve')}
                        </Button>
                        <Button variant="outline" size="sm" className="min-w-[78px]" onClick={() => handleDecision(d, "REJECTED")}>
                          {t('buttons.reject')}
                        </Button>
                      </>
                    )}
                    {d.status === "SUBMITTED" && canCreate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[120px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleStartAnalysis(d)}
                        disabled={analyzingDemandeId === d.id}
                      >
                        {analyzingDemandeId === d.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Starting...
                          </>
                        ) : (
                          'Start Analysis'
                        )}
                      </Button>
                    )}
                    {canDeleteThisDemande && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="min-w-[78px] text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingDemande(d)}
                      >
                        {t('buttons.delete')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <Modal
        title="Create Demande"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        size="xl"
      >
        <DemandeForm
          onSubmit={handleCreate}
          clients={clients}
          isLoading={isSubmitting}
        />
      </Modal>

      <Modal
        title={t('modal.editDraftOnly')}
        isOpen={!!editingDemande}
        onClose={() => setEditingDemande(null)}
        size="xl"
      >
        {editingDemande && (
          <DemandeForm
            onSubmit={handleUpdate}
            clients={clients}
            isLoading={isSubmitting}
            defaultValues={editingDemande}
            isEdit
          />
        )}
      </Modal>

      <Modal
        title={t('modal.details')}
        isOpen={!!viewingDemande}
        onClose={() => setViewingDemande(null)}
        size="xl"
      >
        {viewingDemande && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-2 text-sm">
              {[
                { label: "ID", value: viewingDemande.id },
                { label: "Client", value: displayClient(viewingDemande) },
                { label: "Status", value: viewingDemande.status },
                { label: "Loan Purpose", value: viewingDemande.loanPurpose },
                { label: "Requested Amount", value: viewingDemande.requestedAmount?.toLocaleString() },
                { label: "Duration", value: viewingDemande.durationMonths ? `${viewingDemande.durationMonths} months` : undefined },
                { label: "Product", value: viewingDemande.productName || viewingDemande.productId },
                { label: "Asset Type", value: viewingDemande.assetType },
                { label: "Monthly Capacity", value: viewingDemande.monthlyRepaymentCapacity?.toLocaleString() },
                { label: "Application Channel", value: viewingDemande.applicationChannel },
                { label: "Manager", value: viewingDemande.managerName },
                { label: "Branch", value: viewingDemande.branchName },
                { label: "Created By", value: viewingDemande.createdBy },
                { label: "Updated By", value: viewingDemande.updatedBy },
                { label: "Deleted By", value: viewingDemande.deletedBy },
                {
                  label: "Deleted At",
                  value: viewingDemande.deletedAt
                    ? new Date(viewingDemande.deletedAt).toLocaleString()
                    : undefined,
                },
              ]
                .filter((row) => row.value)
                .map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 py-1.5 border-b border-surface-50"
                  >
                    <span className="text-surface-500 font-medium min-w-[150px]">{row.label}</span>
                    <span className="text-surface-800 text-right break-all">{row.value}</span>
                  </div>
                ))}
            </div>

            {/* Consent Text - Arabic Display */}
            {viewingDemande.consentText && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-semibold text-amber-800 uppercase mb-2">{t('modal.declarationOfConsent')}</p>
                <div dir="rtl" className="text-xs text-surface-700 whitespace-pre-wrap leading-relaxed text-justify">
                  {viewingDemande.consentText}
                </div>
              </div>
            )}

            {/* Guarantors Table */}
            {viewingDemande.guarantors && viewingDemande.guarantors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-surface-800 mb-2">{t('modal.guarantors')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-100 border-b border-surface-200">
                        <th className="px-3 py-2 text-left text-surface-700">{t('modal.guarantorName')}</th>
                        <th className="px-3 py-2 text-left text-surface-700">{t('modal.guarantorAmplitudeId')}</th>
                        <th className="px-3 py-2 text-left text-surface-700">{t('modal.guarantorRelationship')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingDemande.guarantors.map((g, idx) => (
                        <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                          <td className="px-3 py-2 text-surface-800">{g.name || "—"}</td>
                          <td className="px-3 py-2 text-surface-800">{g.amplitudeId || "—"}</td>
                          <td className="px-3 py-2 text-surface-800">{g.clientRelationship || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Guarantees Table */}
            {viewingDemande.guarantees && viewingDemande.guarantees.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-surface-800 mb-2">{t('modal.guarantees')}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface-100 border-b border-surface-200">
                        <th className="px-3 py-2 text-left text-surface-700">{t('modal.guaranteeOwner')}</th>
                        <th className="px-3 py-2 text-left text-surface-700">{t('modal.guaranteeType')}</th>
                        <th className="px-3 py-2 text-right text-surface-700">{t('modal.guaranteeValue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewingDemande.guarantees.map((g, idx) => (
                        <tr key={idx} className="border-b border-surface-100 hover:bg-surface-50">
                          <td className="px-3 py-2 text-surface-800">{g.owner || "—"}</td>
                          <td className="px-3 py-2 text-surface-800">{g.type || "—"}</td>
                          <td className="px-3 py-2 text-right text-surface-800">{Number(g.estimatedValue || 0).toLocaleString()} MAD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PDF Download Button */}
            <div className="flex justify-end pt-4 border-t border-surface-100">
              <Button
                variant="outline"
                onClick={() => generateDemandePdf(viewingDemande, t('messages.allowPopUps'), t('messages.noGuarantors'), t('messages.noGuarantees'))}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-2m4 2l4-2" />
                  </svg>
                }
              >
                {t('modal.downloadPdf')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingDemande}
        onClose={() => setDeletingDemande(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteTitle')}
        message={t('confirm.deleteMessage', { id: deletingDemande?.id.toString() || '' })}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DemandesPage;
