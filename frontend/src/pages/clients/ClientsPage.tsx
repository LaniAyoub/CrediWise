import React, { useState, useEffect, useMemo } from "react";
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

// ── Search Filter ────────────────────────────────────────────────────────────

interface SearchState {
  mode: "local" | "national_id" | "primary_phone";
  query: string;
}

// ── Page Component ───────────────────────────────────────────────────────────

const ClientsPage = () => {
  const { user } = useAuth();
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
        ...(data.scoring && { scoring: data.scoring as string }),
        ...(data.cycle && { cycle: data.cycle as string }),
        ...(data.cbsId && { cbsId: data.cbsId as string }),
      };
      await clientService.create(payload);
      toast.success("Client created successfully!");
      setIsCreateModalOpen(false);
      fetchClients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to create client");
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
        ...(data.scoring && { scoring: data.scoring as string }),
        ...(data.cycle && { cycle: data.cycle as string }),
        ...(data.cbsId && { cbsId: data.cbsId as string }),
      };
      await clientService.update(editingClient.id, payload);
      toast.success("Client updated successfully!");
      setEditingClient(null);
      fetchClients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to update client");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setIsDeleting(true);
    try {
      await clientService.delete(deletingClient.id);
      toast.success("Client deleted successfully!");
      setDeletingClient(null);
      fetchClients();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Failed to delete client");
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
          <h1 className="text-2xl font-bold text-surface-900">Clients</h1>
          <p className="text-surface-500 mt-1">
            Manage physical persons and legal entities
          </p>
        </div>
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
          Add Client
        </Button>
      </div>

      {/* ── Quick Search by national ID / Phone ────────────────────── */}
      <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-3">
          Quick Search
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={searchMode}
            onChange={(e) => {
              setSearchMode(e.target.value as "national_id" | "primary_phone");
              setQuickSearchResult(null);
            }}
            className="rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring"
          >
            <option value="national_id">🪪 National ID</option>
            <option value="primary_phone">📞 Primary Phone</option>
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
                ? "Enter national ID…"
                : "Enter phone number…"
            }
            className="flex-1 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring placeholder:text-surface-400"
          />
          <Button
            onClick={handleQuickSearch}
            isLoading={isSearching}
            variant="secondary"
          >
            Search
          </Button>
        </div>

        {/* Search result */}
        {quickSearchResult === "not_found" && (
          <p className="mt-3 text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-2.5">
            ⚠️ No client found for this{" "}
            {searchMode === "national_id" ? "National ID" : "phone number"}.
          </p>
        )}
        {quickSearchResult && quickSearchResult !== "not_found" && (
          <div className="mt-3 flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                {clientInitials(quickSearchResult)}
              </div>
              <div>
                <p className="text-sm font-medium text-surface-800">
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
          placeholder="Search by name, phone, email, national ID…"
          onSearch={setSearchQuery}
        />
      </div>

      {/* ── Clients Table ──────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="table" rows={6} />
      ) : (
        <Table
          headers={[
            "Client",
            "Type",
            "Segment",
            "Business",
            "Contact",
            "Agence",
            "Manager",
            "Status",
            "Actions",
          ]}
          isEmpty={filteredClients.length === 0}
          emptyMessage={
            searchQuery
              ? "No clients match your search"
              : "No clients yet. Create the first one!"
          }
        >
          {filteredClients.map((c) => (
            <tr key={c.id} className="table-row-hover">
              {/* Client name / identity */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-700 text-xs font-bold">
                      {clientInitials(c)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-800">
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
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge
                  variant={c.clientType === "PHYSICAL" ? "info" : "neutral"}
                  size="sm"
                >
                  {typeLabel(c.clientType)}
                </Badge>
              </td>

              {/* Segment */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-600">
                  {c.segmentLibelle || "—"}
                </span>
              </td>

              {/* Business Sector & Activity */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm text-surface-600">
                    {c.secteurActiviteLibelle || "—"}
                  </p>
                  <p className="text-xs text-surface-400">
                    {c.sousActiviteLibelle || "—"}
                  </p>
                </div>
              </td>

              {/* Contact */}
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm text-surface-600">{c.email || "—"}</p>
                <p className="text-xs text-surface-400">
                  {c.primaryPhone || "—"}
                </p>
              </td>

              {/* Agence */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-600">
                  {c.agenceLibelle || c.agenceId || "—"}
                </span>
              </td>

              {/* Manager */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-surface-600">
                  {c.managerFullName || "—"}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingClient(c)}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingClient(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeletingClient(c)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* ── Create Modal ────────────────────────────────────────────── */}
      <Modal
        title="Add New Client"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        size="xl"
      >
        <ClientForm onSubmit={handleCreate} isLoading={isSubmitting} />
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        title="Edit Client"
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
        title="Client Details"
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
                <p className="font-semibold text-surface-900 text-base">
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
              { label: "ID", value: viewingClient.id },
              { label: "National ID", value: viewingClient.nationalId },
              { label: "Tax Identifier", value: viewingClient.taxIdentifier },
              {
                label: "Date of Birth",
                value: viewingClient.dateOfBirth?.split("T")[0],
              },
              { label: "Gender", value: viewingClient.gender },
              { label: "Nationality", value: viewingClient.nationality },
              {
                label: "Marital Status",
                value: viewingClient.situationFamiliale,
              },
              {
                label: "Monthly Income",
                value:
                  viewingClient.monthlyIncome != null
                    ? `${viewingClient.monthlyIncome.toLocaleString()} MAD`
                    : undefined,
              },
              { label: "Company", value: viewingClient.companyName },
              { label: "RC", value: viewingClient.registrationNumber },
              { label: "Email", value: viewingClient.email },
              { label: "Phone", value: viewingClient.primaryPhone },
              { label: "Secondary Phone", value: viewingClient.secondaryPhone },
              {
                label: "Address",
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
                label: "Agence",
                value: viewingClient.agenceLibelle || viewingClient.agenceId,
              },
              { label: "Manager", value: viewingClient.managerFullName },
              { label: "Scoring", value: viewingClient.scoring },
              { label: "Cycle", value: viewingClient.cycle },
              { label: "CBS ID", value: viewingClient.cbsId },
              { label: "Segment", value: viewingClient.segmentLibelle },
              {
                label: "Account Type",
                value: viewingClient.accountTypeLibelle,
              },
              {
                label: "Business Sector",
                value: viewingClient.secteurActiviteLibelle,
              },
              {
                label: "Business Activity",
                value: viewingClient.sousActiviteLibelle,
              },
              {
                label: "Risk Level",
                value:
                  viewingClient.ifcLevelOfRiskFr ||
                  viewingClient.ifcLevelOfRisk,
              },
              {
                label: "Created At",
                value: viewingClient.createdAt
                  ? new Date(viewingClient.createdAt).toLocaleString()
                  : undefined,
              },
              {
                label: "Updated At",
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
                  <span className="text-surface-800 text-right break-all">
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
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete "${deletingClient ? clientDisplayName(deletingClient) : ""}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ClientsPage;
