import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { clientService } from "@/services/client.service";
import type {
  Client,
  ClientCreateRequest,
  ClientUpdateRequest,
} from "@/types/client.types";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import SearchBar from "@/components/ui/SearchBar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ClientForm from "@/components/forms/ClientForm";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusVariant = (status: string): "success" | "warning" | "neutral" => {
  if (status === "ACTIVE") return "success";
  if (status === "PROSPECT") return "warning";
  return "neutral";
};

const typeLabel = (clientType: string) =>
  clientType === "PHYSICAL" ? "Physical" : "Legal";

const clientDisplayName = (c: Client): string => {
  if (c.clientType === "PHYSICAL") {
    return [c.firstName, c.lastName].filter(Boolean).join(" ") || "—";
  }
  return c.companyName || "—";
};

const clientInitials = (c: Client): string => {
  if (c.clientType === "PHYSICAL") {
    return `${c.firstName?.[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase();
  }
  return (c.companyName?.[0] ?? "L").toUpperCase();
};

const formatAccountType = (c: Client): string => {
  if (c.accountTypeLibelle === "Other" && c.accountTypeCustomName) {
    return c.accountTypeCustomName;
  }
  return c.accountTypeLibelle || "—";
};

// ── Role-Based Access Control ───────────────────────────────────────────────
const CAN_CREATE_ROLES = ["SUPER_ADMIN", "FRONT_OFFICE", "CRO"];
const CAN_EDIT_ROLES = ["SUPER_ADMIN", "FRONT_OFFICE", "CRO"];
const CAN_DELETE_ROLES = ["SUPER_ADMIN"];

// ── Page Component ───────────────────────────────────────────────────────────

const ClientsPage = () => {
  const { t } = useTranslation('clients');
  const { user } = useAuth();
  const canCreate = CAN_CREATE_ROLES.includes(user?.role || "");
  const canEdit = CAN_EDIT_ROLES.includes(user?.role || "");
  const canDelete = CAN_DELETE_ROLES.includes(user?.role || "");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick search by national ID or phone
  const [searchMode, setSearchMode] = useState<"national_id" | "primary_phone">(
    "national_id",
  );
  const [quickSearchQuery, setQuickSearchQuery] = useState("");
  const [quickSearchResult, setQuickSearchResult] = useState<
    Client | null | "not_found"
  >(null);
  const [isSearching, setIsSearching] = useState(false);

  const displayReference = (label?: string, id?: number) => {
    if (label && label.trim()) return label;
    if (id != null) return `#${id}`;
    return "—";
  };

  const fetchClients = async () => {
    try {
      const response = await clientService.getAll({ page: 0, size: 100 });
      setClients(response.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // ── Local filter ──────────────────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.primaryPhone?.toLowerCase().includes(q) ||
        c.nationalId?.toLowerCase().includes(q) ||
        c.agenceLibelle?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q),
    );
  }, [clients, searchQuery]);

  const clientStats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.status === "ACTIVE").length;
    const prospect = clients.filter((c) => c.status === "PROSPECT").length;
    return { total, active, prospect };
  }, [clients]);

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCreate = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload: ClientCreateRequest = {
        clientType: data.clientType as "PHYSICAL" | "LEGAL",
        ...(data.firstName && { firstName: data.firstName as string }),
        ...(data.lastName && { lastName: data.lastName as string }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth as string }),
        ...(data.nationalId && { nationalId: data.nationalId as string }),
        ...(data.taxIdentifier && {
          taxIdentifier: data.taxIdentifier as string,
        }),
        ...(data.gender && {
          gender: data.gender as "MALE" | "FEMALE" | "OTHER",
        }),
        ...(data.situationFamiliale && {
          situationFamiliale: data.situationFamiliale as
            | "SINGLE"
            | "MARRIED"
            | "DIVORCED"
            | "SEPARATED"
            | "WIDOWER"
            | "OTHER",
        }),
        ...(data.nationality && { nationality: data.nationality as string }),
        ...(data.monthlyIncome !== undefined && {
          monthlyIncome: Number(data.monthlyIncome),
        }),
        ...(data.companyName && { companyName: data.companyName as string }),
        ...(data.sigle && { sigle: data.sigle as string }),
        ...(data.registrationNumber && {
          registrationNumber: data.registrationNumber as string,
        }),
        ...(data.principalInterlocutor && {
          principalInterlocutor: data.principalInterlocutor as string,
        }),
        ...(data.email && { email: data.email as string }),
        ...(data.primaryPhone && { primaryPhone: data.primaryPhone as string }),
        ...(data.secondaryPhone && {
          secondaryPhone: data.secondaryPhone as string,
        }),
        ...(data.addressStreet && {
          addressStreet: data.addressStreet as string,
        }),
        ...(data.addressCity && { addressCity: data.addressCity as string }),
        ...(data.addressPostal && {
          addressPostal: data.addressPostal as string,
        }),
        ...(data.addressCountry && {
          addressCountry: data.addressCountry as string,
        }),
        ...(data.agenceId && { agenceId: data.agenceId as string }),
        ...(data.segmentId && { segmentId: Number(data.segmentId) }),
        ...(data.accountTypeId && {
          accountTypeId: Number(data.accountTypeId),
        }),
        ...(data.secteurActiviteId && {
          secteurActiviteId: Number(data.secteurActiviteId),
        }),
        ...(data.sousActiviteId && {
          sousActiviteId: Number(data.sousActiviteId),
        }),
        // Auto-assign the current manager as the client's assigned manager
        ...(user?.id && { assignedManagerId: user.id }),
        ...(data.relationAvecClient && {
          relationAvecClient: data.relationAvecClient as
            | "CLIENT"
            | "SUPPLIER"
            | "NEIGHBOUR"
            | "OTHER",
        }),
        ...(data.relationAvecClientOther && {
          relationAvecClientOther: data.relationAvecClientOther as string,
        }),
        ...(data.accountNumber && { accountNumber: data.accountNumber as string }),
        ...(data.accountTypeCustomName && {
          accountTypeCustomName: data.accountTypeCustomName as string,
        }),
        ...(data.scoring && { scoring: data.scoring as string }),
        ...(data.cbsId && { cbsId: data.cbsId as string }),
      };
      await clientService.create(payload);
      toast.success(t('messages.created'));
      setIsCreateModalOpen(false);
      fetchClients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdate = async (data: any) => {
    if (!editingClient) return;
    setIsSubmitting(true);
    try {
      const payload: ClientUpdateRequest = {
        ...(data.status && { status: data.status as "PROSPECT" | "ACTIVE" }),
        ...(data.firstName && { firstName: data.firstName as string }),
        ...(data.lastName && { lastName: data.lastName as string }),
        ...(data.dateOfBirth && { dateOfBirth: data.dateOfBirth as string }),
        ...(data.nationalId && { nationalId: data.nationalId as string }),
        ...(data.gender && {
          gender: data.gender as "MALE" | "FEMALE" | "OTHER",
        }),
        ...(data.situationFamiliale && {
          situationFamiliale: data.situationFamiliale as
            | "SINGLE"
            | "MARRIED"
            | "DIVORCED"
            | "SEPARATED"
            | "WIDOWER"
            | "OTHER",
        }),
        ...(data.nationality && { nationality: data.nationality as string }),
        ...(data.monthlyIncome !== undefined && {
          monthlyIncome: Number(data.monthlyIncome),
        }),
        ...(data.companyName && { companyName: data.companyName as string }),
        ...(data.sigle && { sigle: data.sigle as string }),
        ...(data.registrationNumber && {
          registrationNumber: data.registrationNumber as string,
        }),
        ...(data.principalInterlocutor && {
          principalInterlocutor: data.principalInterlocutor as string,
        }),
        ...(data.email && { email: data.email as string }),
        ...(data.primaryPhone && { primaryPhone: data.primaryPhone as string }),
        ...(data.secondaryPhone && {
          secondaryPhone: data.secondaryPhone as string,
        }),
        ...(data.addressStreet && {
          addressStreet: data.addressStreet as string,
        }),
        ...(data.addressCity && { addressCity: data.addressCity as string }),
        ...(data.addressPostal && {
          addressPostal: data.addressPostal as string,
        }),
        ...(data.addressCountry && {
          addressCountry: data.addressCountry as string,
        }),
        ...(data.agenceId && { agenceId: data.agenceId as string }),
        ...(data.segmentId && { segmentId: Number(data.segmentId) }),
        ...(data.accountTypeId && {
          accountTypeId: Number(data.accountTypeId),
        }),
        ...(data.secteurActiviteId && {
          secteurActiviteId: Number(data.secteurActiviteId),
        }),
        ...(data.sousActiviteId && {
          sousActiviteId: Number(data.sousActiviteId),
        }),
        ...(data.relationAvecClient && {
          relationAvecClient: data.relationAvecClient as
            | "CLIENT"
            | "SUPPLIER"
            | "NEIGHBOUR"
            | "OTHER",
        }),
        ...(data.relationAvecClientOther && {
          relationAvecClientOther: data.relationAvecClientOther as string,
        }),
        ...(data.accountNumber && { accountNumber: data.accountNumber as string }),
        ...(data.accountTypeCustomName && {
          accountTypeCustomName: data.accountTypeCustomName as string,
        }),
        ...(data.scoring && { scoring: data.scoring as string }),
        ...(data.cbsId && { cbsId: data.cbsId as string }),
      };
      await clientService.update(editingClient.id, payload);
      toast.success(t('messages.updated'));
      setEditingClient(null);
      fetchClients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      await clientService.delete(deletingClient.id);
      toast.success(t('messages.deleted'));
      setDeletingClient(null);
      fetchClients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('messages.loadError'));
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Quick search by national ID / phone ────────────────────────────────────
  const handleQuickSearch = async () => {
    if (!quickSearchQuery.trim()) return;
    setIsSearching(true);
    setQuickSearchResult(null);
    try {
      const params =
        searchMode === "national_id"
          ? { national_id: quickSearchQuery.trim() }
          : { primary_phone: quickSearchQuery.trim() };
      const res = await clientService.search(params);
      setQuickSearchResult(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setQuickSearchResult("not_found");
      } else {
        toast.error("Search failed");
      }
    } finally {
      setIsSearching(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-surface-900 dark:text-surface-50">{t('title')}</h1>
          <p className="text-caption text-surface-600 dark:text-surface-400 mt-2">
            Manage physical persons and legal entities
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            {t('buttons.add')}
          </Button>
        )}
      </div>

      {/* ── Quick Search by national ID / Phone ────────────────────── */}
      <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-5 shadow-sm transition-colors">
        <p className="text-label text-surface-600 dark:text-surface-400 mb-4">
          {t('messages.searchSubtitle')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={searchMode}
            onChange={(e) => {
              setSearchMode(e.target.value as "national_id" | "primary_phone");
              setQuickSearchResult(null);
            }}
            className="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700 px-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 focus-ring transition-colors"
          >
            <option value="national_id">{t('searchOptions.nationalId')}</option>
            <option value="primary_phone">{t('searchOptions.primaryPhone')}</option>
          </select>
          <input
            type="text"
            value={quickSearchQuery}
            onChange={(e) => {
              setQuickSearchQuery(e.target.value);
              setQuickSearchResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleQuickSearch()}
            placeholder={
              searchMode === "national_id"
                ? t('quickSearch.nationalIdPlaceholder')
                : t('quickSearch.phonePlaceholder')
            }
            className="flex-1 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700 px-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 focus-ring placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-colors"
          />
          <Button
            onClick={handleQuickSearch}
            isLoading={isSearching}
            variant="secondary"
          >
            {t('quickSearch.searchButton')}
          </Button>
        </div>

        {/* Search result */}
        {quickSearchResult === "not_found" && (
          <p className="mt-3 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-2.5">
            ⚠️ {t('details.noClientFound')}{" "}
            {searchMode === "national_id" ? t('searchOptions.nationalId') : t('searchOptions.primaryPhone')}.
          </p>
        )}
        {quickSearchResult && quickSearchResult !== "not_found" && (
          <div className="mt-3 flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                {clientInitials(quickSearchResult)}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                  {clientDisplayName(quickSearchResult)}
                </p>
                <p className="text-xs text-surface-500">
                  {quickSearchResult.primaryPhone} ·{" "}
                  {quickSearchResult.nationalId}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewingClient(quickSearchResult as Client)}
            >
              View
            </Button>
          </div>
        )}
      </div>

      {/* ── Table Search & Filter ───────────────────────────────────── */}
      <div className="max-w-sm">
        <SearchBar
          placeholder={t('searchPlaceholder')}
          onSearch={setSearchQuery}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-3 transition-colors">
          <p className="text-xs text-surface-500 uppercase tracking-wide">Total</p>
          <p className="text-xl font-semibold text-surface-900 dark:text-surface-50 mt-1">{clientStats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs text-emerald-700 uppercase tracking-wide">Active</p>
          <p className="text-xl font-semibold text-emerald-800 mt-1">{clientStats.active}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <p className="text-xs text-amber-700 uppercase tracking-wide">Prospect</p>
          <p className="text-xl font-semibold text-amber-800 mt-1">{clientStats.prospect}</p>
        </div>
      </div>

      {/* ── Clients Table ──────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          headers={[
            t('table.name'),
            t('table.type'),
            t('table.classification'),
            t('table.contact'),
            t('table.assignment'),
            t('table.status'),
            t('table.cycle'),
            t('table.actions'),
          ]}
          isEmpty={filteredClients.length === 0}
          emptyMessage={
            searchQuery
              ? t('messages.noSearch')
              : t('messages.noResults')
          }
        >
          {filteredClients.map((c) => (
            <tr key={c.id} className="table-row-hover">
              {/* Client name / identity */}
              <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 text-xs font-bold">
                      {clientInitials(c)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800 dark:text-surface-200">
                      {clientDisplayName(c)}
                    </p>
                    <p className="text-xs text-surface-400">
                      {c.nationalId ||
                        c.registrationNumber ||
                        c.id.slice(0, 8) + "..."}
                    </p>
                  </div>
                </div>
              </td>

              {/* Type */}
              <td className="px-4 py-3 align-top">
                <Badge
                  variant={c.clientType === "PHYSICAL" ? "info" : "neutral"}
                  size="sm"
                >
                  {typeLabel(c.clientType)}
                </Badge>
              </td>

              {/* Business classification */}
              <td className="px-4 py-3 align-top">
                <div>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    Segment: {displayReference(c.segmentLibelle, c.segmentId)}
                  </p>
                  <p className="text-sm text-surface-700 dark:text-surface-300 font-medium">
                    {displayReference(c.secteurActiviteLibelle, c.secteurActiviteId)}
                  </p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {displayReference(c.sousActiviteLibelle, c.sousActiviteId)}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    Account: {formatAccountType(c)}
                  </p>
                </div>
              </td>

              {/* Contact */}
              <td className="px-4 py-3 align-top">
                <p className="text-sm text-surface-600 dark:text-surface-300">{c.email || "—"}</p>
                <p className="text-xs text-surface-400 dark:text-surface-500">
                  {c.primaryPhone || "—"}
                </p>
              </td>

              {/* Assignment */}
              <td className="px-4 py-3 align-top">
                <div>
                  <p className="text-sm text-surface-600 dark:text-surface-300">{c.managerFullName || "—"}</p>
                  <p className="text-xs text-surface-400 dark:text-surface-500">
                    {c.agenceLibelle || c.agenceId || "—"}
                  </p>
                </div>
              </td>

              {/* Status */}
              <td className="px-4 py-3 align-top">
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              </td>

              {/* Cycle */}
              <td className="px-4 py-3 align-top">
                <span className="inline-flex items-center rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-2 py-0.5 text-xs font-medium text-surface-700 dark:text-surface-300">
                  {c.cycle || "0"}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 align-top">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-w-[72px]"
                    onClick={() => setViewingClient(c)}
                  >
                    {t('buttons.view')}
                  </Button>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[72px]"
                      onClick={() => setEditingClient(c)}
                    >
                      {t('buttons.edit')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[72px] text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeletingClient(c)}
                    >
                      {t('buttons.delete')}
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* ── Create Modal ────────────────────────────────────────────── */}
      <Modal
        title={t('modals.createTitle')}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="xl"
      >
        <ClientForm onSubmit={handleCreate} isLoading={isSubmitting} />
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        title={t('modals.editTitle')}
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        size="xl"
      >
        {editingClient && (
          <ClientForm
            onSubmit={handleUpdate}
            defaultValues={editingClient}
            isLoading={isSubmitting}
            isEdit
          />
        )}
      </Modal>

      {/* ── View Detail Modal ───────────────────────────────────────── */}
      <Modal
        title={t('details.title')}
        isOpen={!!viewingClient}
        onClose={() => setViewingClient(null)}
        size="xl"
      >
        {viewingClient && (
          <div className="space-y-4 text-sm">
            {/* Header card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-50 border border-surface-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 font-bold text-lg">
                {clientInitials(viewingClient)}
              </div>
              <div>
                <p className="font-semibold text-surface-900 dark:text-surface-100 text-base">
                  {clientDisplayName(viewingClient)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      viewingClient.clientType === "PHYSICAL"
                        ? "info"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {typeLabel(viewingClient.clientType)}
                  </Badge>
                  <Badge
                    variant={statusVariant(viewingClient.status)}
                    size="sm"
                  >
                    {viewingClient.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Details grid */}
            {[
              { label: t('detailLabels.id'), value: viewingClient.id },
              { label: t('detailLabels.nationalId'), value: viewingClient.nationalId },
              { label: t('detailLabels.taxIdentifier'), value: viewingClient.taxIdentifier },
              {
                label: t('detailLabels.dateOfBirth'),
                value: viewingClient.dateOfBirth?.split("T")[0],
              },
              { label: t('detailLabels.gender'), value: viewingClient.gender },
              { label: t('detailLabels.nationality'), value: viewingClient.nationality },
              {
                label: t('detailLabels.maritalStatus'),
                value: viewingClient.situationFamiliale,
              },
              {
                label: t('detailLabels.monthlyIncome'),
                value:
                  viewingClient.monthlyIncome != null
                    ? `${viewingClient.monthlyIncome.toLocaleString()} MAD`
                    : undefined,
              },
              { label: t('detailLabels.company'), value: viewingClient.companyName },
              { label: t('detailLabels.rc'), value: viewingClient.registrationNumber },
              { label: t('detailLabels.email'), value: viewingClient.email },
              { label: t('detailLabels.phone'), value: viewingClient.primaryPhone },
              { label: t('detailLabels.secondaryPhone'), value: viewingClient.secondaryPhone },
              {
                label: t('detailLabels.address'),
                value: [
                  viewingClient.addressStreet,
                  viewingClient.addressCity,
                  viewingClient.addressPostal,
                  viewingClient.addressCountry,
                ]
                  .filter(Boolean)
                  .join(", "),
              },
              {
                label: t('detailLabels.agence'),
                value: viewingClient.agenceLibelle || viewingClient.agenceId,
              },
              { label: t('detailLabels.manager'), value: viewingClient.managerFullName },
              { label: t('detailLabels.scoring'), value: viewingClient.scoring },
              { label: t('detailLabels.cycle'), value: viewingClient.cycle },
              { label: t('detailLabels.cbsId'), value: viewingClient.cbsId },
              { label: t('detailLabels.segment'), value: viewingClient.segmentLibelle },
              {
                label: t('detailLabels.accountType'),
                value:
                  viewingClient.accountTypeLibelle === "Other" &&
                  viewingClient.accountTypeCustomName
                    ? `${viewingClient.accountTypeLibelle} (${viewingClient.accountTypeCustomName})`
                    : viewingClient.accountTypeLibelle,
              },
              { label: t('detailLabels.accountNumber'), value: viewingClient.accountNumber },
              {
                label: t('detailLabels.businessSector'),
                value: viewingClient.secteurActiviteLibelle,
              },
              {
                label: t('detailLabels.businessActivity'),
                value: viewingClient.sousActiviteLibelle,
              },
              {
                label: t('detailLabels.riskLevel'),
                value: viewingClient.ifcLevelOfRisk,
              },
              {
                label: t('detailLabels.relationOtherDetails'),
                value:
                  viewingClient.relationAvecClient === "OTHER"
                    ? viewingClient.relationAvecClientOther
                    : undefined,
              },
              {
                label: t('detailLabels.createdAt'),
                value: viewingClient.createdAt
                  ? new Date(viewingClient.createdAt).toLocaleString()
                  : undefined,
              },
              {
                label: t('detailLabels.updatedAt'),
                value: viewingClient.updatedAt
                  ? new Date(viewingClient.updatedAt).toLocaleString()
                  : undefined,
              },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between gap-4 py-1.5 border-b border-surface-50"
                >
                  <span className="text-surface-500 font-medium min-w-[140px]">
                    {row.label}
                  </span>
                  <span className="text-surface-800 dark:text-surface-300 text-right break-all">
                    {row.value}
                  </span>
                </div>
              ))}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingClient(viewingClient);
                  setViewingClient(null);
                }}
              >
                {t('buttons.edit')}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteTitle')}
        message={t('confirm.deleteMessage', { name: deletingClient ? clientDisplayName(deletingClient) : "" })}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ClientsPage;
