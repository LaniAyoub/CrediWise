import React, { useState } from "react";
import { clientService } from "@/services/client.service";
import type { Client } from "@/types/client.types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import toast from "react-hot-toast";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Detail row component ──────────────────────────────────────────────────────

const DetailRow = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-surface-50">
      <span className="text-surface-500 font-medium min-w-[160px] text-sm">{label}</span>
      <span className="text-surface-800 text-right break-all text-sm">{value}</span>
    </div>
  );
};

// ── Page Component ────────────────────────────────────────────────────────────

const ClientSearchPage = () => {
  const [searchMode, setSearchMode] = useState<"national_id" | "primary_phone">("national_id");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Client | null | "not_found">(null);
  const [isSearching, setIsSearching] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null);
    try {
      const params =
        searchMode === "national_id"
          ? { national_id: query.trim() }
          : { primary_phone: query.trim() };
      const res = await clientService.search(params);
      setResult(res.data);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setResult("not_found");
      } else {
        toast.error("Search failed. Please try again.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResult(null);
  };

  const foundClient = result && result !== "not_found" ? result : null;

  return (
    <div className="page-container space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Client Search</h1>
        <p className="text-surface-500 mt-1">
          Find a client quickly by national ID or phone number
        </p>
      </div>

      {/* ── Search Card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
          Search by
        </p>

        {/* Mode tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setSearchMode("national_id"); setResult(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border ${
              searchMode === "national_id"
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-white border-surface-200 text-surface-500 hover:border-surface-300"
            }`}
          >
            🪪 National ID
          </button>
          <button
            type="button"
            onClick={() => { setSearchMode("primary_phone"); setResult(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 border ${
              searchMode === "primary_phone"
                ? "bg-brand-50 border-brand-200 text-brand-700"
                : "bg-white border-surface-200 text-surface-500 hover:border-surface-300"
            }`}
          >
            📞 Phone Number
          </button>
        </div>

        {/* Search input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder={
              searchMode === "national_id"
                ? "Enter national ID (e.g. 12345678)…"
                : "Enter phone number (e.g. +216 20000000)…"
            }
            className="flex-1 rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring placeholder:text-surface-400"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2.5 rounded-xl border border-surface-200 text-surface-400 hover:text-surface-600 hover:border-surface-300 text-sm transition-all"
            >
              ✕
            </button>
          )}
          <Button onClick={handleSearch} isLoading={isSearching}>
            Search
          </Button>
        </div>

        {/* ── Not found state ───────────────────────────────────────── */}
        {result === "not_found" && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <p className="text-sm text-amber-700">
              No client found for this{" "}
              <strong>{searchMode === "national_id" ? "National ID" : "phone number"}</strong>.
              Please check the value and try again.
            </p>
          </div>
        )}

        {/* ── Found state ───────────────────────────────────────────── */}
        {foundClient && (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 space-y-4">
            {/* Client header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {clientInitials(foundClient)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-surface-900">
                    {clientDisplayName(foundClient)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={foundClient.clientType === "PHYSICAL" ? "info" : "neutral"} size="sm">
                      {typeLabel(foundClient.clientType)}
                    </Badge>
                    <Badge variant={statusVariant(foundClient.status)} size="sm">
                      {foundClient.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setViewingClient(foundClient)}>
                View Details
              </Button>
            </div>

            {/* Quick summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 pt-2 border-t border-brand-100">
              <DetailRow label="National ID" value={foundClient.nationalId} />
              <DetailRow label="Phone" value={foundClient.primaryPhone} />
              <DetailRow label="Email" value={foundClient.email} />
              <DetailRow label="Agence" value={foundClient.agenceLibelle || foundClient.agenceId} />
              <DetailRow label="Segment" value={foundClient.segmentLibelle} />
              <DetailRow label="Account Type" value={foundClient.accountTypeLibelle} />
              <DetailRow label="Manager" value={foundClient.managerFullName} />
              <DetailRow label="CBS ID" value={foundClient.cbsId} />
            </div>
          </div>
        )}
      </div>

      {/* ── Full Detail Modal ─────────────────────────────────────────── */}
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
                  <Badge variant={viewingClient.clientType === "PHYSICAL" ? "info" : "neutral"} size="sm">
                    {typeLabel(viewingClient.clientType)}
                  </Badge>
                  <Badge variant={statusVariant(viewingClient.status)} size="sm">
                    {viewingClient.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* All details */}
            {[
              { label: "ID", value: viewingClient.id },
              { label: "National ID", value: viewingClient.nationalId },
              { label: "Tax Identifier", value: viewingClient.taxIdentifier },
              { label: "Date of Birth", value: viewingClient.dateOfBirth?.split("T")[0] },
              { label: "Gender", value: viewingClient.gender },
              { label: "Nationality", value: viewingClient.nationality },
              { label: "Marital Status", value: viewingClient.situationFamiliale },
              {
                label: "Monthly Income",
                value: viewingClient.monthlyIncome != null
                  ? `${viewingClient.monthlyIncome.toLocaleString()} TND`
                  : undefined,
              },
              { label: "Company", value: viewingClient.companyName },
              { label: "Sigle", value: viewingClient.sigle },
              { label: "RC", value: viewingClient.registrationNumber },
              { label: "Principal Interlocutor", value: viewingClient.principalInterlocutor },
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
                ].filter(Boolean).join(", "),
              },
              { label: "Agence", value: viewingClient.agenceLibelle || viewingClient.agenceId },
              { label: "Manager", value: viewingClient.managerFullName },
              { label: "Relation", value: viewingClient.relationAvecClient },
              { label: "Scoring", value: viewingClient.scoring },
              { label: "Cycle", value: viewingClient.cycle },
              { label: "CBS ID", value: viewingClient.cbsId },
              { label: "Segment", value: viewingClient.segmentLibelle },
              { label: "Account Type", value: viewingClient.accountTypeLibelle },
              { label: "Business Sector", value: viewingClient.secteurActiviteLibelle },
              { label: "Business Activity", value: viewingClient.sousActiviteLibelle },
              { label: "Risk Level", value: viewingClient.ifcLevelOfRiskFr || viewingClient.ifcLevelOfRisk },
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
                  <span className="text-surface-500 font-medium min-w-[160px]">{row.label}</span>
                  <span className="text-surface-800 text-right break-all">{row.value}</span>
                </div>
              ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientSearchPage;