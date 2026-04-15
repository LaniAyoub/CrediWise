import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "@/types/client.types";
import type { Demande, GuarantorDto, GuaranteeDto } from "@/types/demande.types";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const PRODUCT_OPTIONS = [
  { id: "101", label: "Crédit Micro Tatouir" },
  { id: "102", label: "Crédit TPE Mostakbali" },
  { id: "103", label: "Crédit PME Imtiez" },
  { id: "104", label: "Crédit EL BEYA" },
  { id: "110", label: "Crédit Agricole Saba" },
];

const APPLICATION_CHANNELS = [
  { value: "BRANCH", label: "Branch" },
  { value: "MOBILE", label: "Mobile" },
  { value: "WEB", label: "Web" },
  { value: "PHONE", label: "Phone" },
  { value: "OTHER", label: "Other" },
];

const CONSENT_TEXT = `إنّي الممضي أسفله صاحب بطاقة التعريف الوطنية المذكورة أعلاه أشهد وأصرّح بصحّة المعطيات والمعلومات المبيّنة أعلاه

كما أنّي وطبقا لأحكام القانون الأساسي عدد 33 لسنة 2004 المؤرخ في 24 جويلية 2004 المتعلّق بحماية المعطيات الشخصية

أصرّح وأشهد أنّه قد تمّ إعلامي من طرف شركة أدفانس تونيزي أنّ المعطيات الشخصية التي تخصّني تمّ جمعها وتمّت معالجتها من طرف الشركة في إطار المطلب المقدّم من طرفي للحصول على تمويل صغير وأنّه قد تمّ إعلامي بالهدف من تجميعها وبالحقوق المرتبطة بها والتي يخوّلها لي القانون وأشهد بقبولي لتجميع ومعالجة معطياتي الشخصية.`;

const demandeSchema = z.object({
  clientId: z.string().uuid("Client is required"),
  loanPurpose: z.string().trim().min(3, "Loan purpose must have at least 3 characters"),
  requestedAmount: z.coerce.number().gt(0, "Requested amount must be greater than 0"),
  durationMonths: z.coerce.number().int().min(1, "Duration must be at least 1 month").max(480, "Duration seems too high"),
  productId: z.string().optional().or(z.literal("")),
  assetType: z.string().optional().or(z.literal("")),
  monthlyRepaymentCapacity: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().min(0, "Capacity cannot be negative").optional()
  ),
  applicationChannel: z.string().optional().or(z.literal("")),
  applicationChannelOther: z.string().optional().or(z.literal("")),
  bankingRestriction: z.boolean(),
  legalIssueOrAccountBlocked: z.boolean(),
  guarantors: z.array(z.object({
    name: z.string().optional().or(z.literal("")),
    amplitudeId: z.string().optional().or(z.literal("")),
    clientRelationship: z.string().optional().or(z.literal("")),
  })).optional(),
  guarantees: z.array(z.object({
    owner: z.string().optional().or(z.literal("")),
    type: z.string().optional().or(z.literal("")),
    estimatedValue: z.preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      z.coerce.number().min(0).optional()
    ),
  })).optional(),
  consentText: z.string().optional(),
});

type DemandeFormData = z.infer<typeof demandeSchema>;

interface DemandeFormProps {
  onSubmit: (data: DemandeFormData) => void;
  clients: Client[];
  isLoading: boolean;
  defaultValues?: Demande;
  isEdit?: boolean;
}

const clientLabel = (client: Client) => {
  if (client.clientType === "PHYSICAL") {
    return `${client.firstName || ""} ${client.lastName || ""}`.trim() || client.id;
  }
  return client.companyName || client.id;
};

const DemandeForm = ({
  onSubmit,
  clients,
  isLoading,
  defaultValues,
  isEdit = false,
}: DemandeFormProps) => {
  const { t } = useTranslation('demandes');
  const { user } = useAuth();
  const [clientQuery, setClientQuery] = useState("");
  const [hoveredField, setHoveredField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<DemandeFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(demandeSchema) as any,
    defaultValues: defaultValues
      ? {
          clientId: defaultValues.clientId,
          loanPurpose: defaultValues.loanPurpose || "",
          requestedAmount: Number(defaultValues.requestedAmount || 0),
          durationMonths: Number(defaultValues.durationMonths || 1),
          productId: defaultValues.productId || "",
          assetType: defaultValues.assetType || "",
          monthlyRepaymentCapacity:
            defaultValues.monthlyRepaymentCapacity != null
              ? Number(defaultValues.monthlyRepaymentCapacity)
              : undefined,
          applicationChannel: defaultValues.applicationChannel?.split(":")?.[0] || "",
          applicationChannelOther: defaultValues.applicationChannel?.includes("OTHER:")
            ? defaultValues.applicationChannel.split("OTHER:")?.[1]?.trim() || ""
            : "",
          bankingRestriction: defaultValues.bankingRestriction ?? false,
          legalIssueOrAccountBlocked: defaultValues.legalIssueOrAccountBlocked ?? false,
          guarantors: defaultValues.guarantors || [],
          guarantees: defaultValues.guarantees || [],
        }
      : {
          clientId: "",
          loanPurpose: "",
          requestedAmount: 0,
          durationMonths: 12,
          productId: "",
          assetType: "",
          monthlyRepaymentCapacity: undefined,
          applicationChannel: "",
          applicationChannelOther: "",
          bankingRestriction: false,
          legalIssueOrAccountBlocked: false,
          guarantors: [],
          guarantees: [],
        },
  });

  const { fields: guarantorFields, append: appendGuarantor, remove: removeGuarantor } = useFieldArray({
    control,
    name: "guarantors",
  });

  const { fields: guaranteeFields, append: appendGuarantee, remove: removeGuarantee } = useFieldArray({
    control,
    name: "guarantees",
  });

  const selectedClientId = watch("clientId");
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const fullName = `${client.firstName || ""} ${client.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(q) ||
        client.companyName?.toLowerCase().includes(q) ||
        client.nationalId?.toLowerCase().includes(q) ||
        client.primaryPhone?.toLowerCase().includes(q) ||
        client.email?.toLowerCase().includes(q)
      );
    });
  }, [clients, clientQuery]);

  const showHint = (field: keyof DemandeFormData, hint: string) => {
    const value = watch(field);
    if (hoveredField !== field) return null;
    if (typeof value === "string" && value.trim().length > 0) return null;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) return null;
    return <p className="mt-1 text-xs text-brand-600">{hint}</p>;
  };

  const watchApplicationChannel = watch("applicationChannel");
  const watchApplicationChannelOther = watch("applicationChannelOther");

  const onFormSubmit = (data: DemandeFormData) => {
    // Process applicationChannel: if OTHER is selected, combine with the text input
    let finalApplicationChannel = data.applicationChannel || "";
    if (finalApplicationChannel === "OTHER" && data.applicationChannelOther) {
      finalApplicationChannel = `OTHER: ${data.applicationChannelOther}`;
    }

    // Filter out empty guarantors and guarantees
    const filteredGuarantors = (data.guarantors || []).filter(
      (g) => g.name || g.amplitudeId || g.clientRelationship
    );
    const filteredGuarantees = (data.guarantees || []).filter(
      (g) => g.owner || g.type || g.estimatedValue
    );

    onSubmit({
      ...data,
      applicationChannel: finalApplicationChannel,
      consentText: CONSENT_TEXT, // Always send the fixed consent text
      guarantors: filteredGuarantors.length > 0 ? filteredGuarantors : undefined,
      guarantees: filteredGuarantees.length > 0 ? filteredGuarantees : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-1">
      <div className="mb-6 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 transition-colors">
        <label htmlFor="client-search" className="block text-label text-surface-700 dark:text-surface-300 mb-2">
          {t('form.searchClient')}
        </label>
        <input
          id="client-search"
          value={clientQuery}
          onChange={(e) => setClientQuery(e.target.value)}
          placeholder={t('form.searchClientPlaceholder')}
          className="block w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-700 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus-ring placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-colors"
        />
        <p className="mt-2 text-xs text-surface-600 dark:text-surface-400">{filteredClients.length} {t('form.clientsFound')}</p>
      </div>

      {!isEdit && clientQuery.trim() && filteredClients.length > 0 && (
        <div className="mb-4 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-2 max-h-44 overflow-y-auto transition-colors">
          {filteredClients.slice(0, 8).map((client) => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
              onClick={() => {
                setClientQuery(clientLabel(client));
                setValue("clientId", client.id, { shouldValidate: true });
              }}
            >
              <p className="text-sm text-surface-900 dark:text-surface-100">{clientLabel(client)}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">{client.nationalId || client.primaryPhone || client.email || client.id}</p>
            </button>
          ))}
        </div>
      )}

      {!isEdit && clientQuery.trim() && filteredClients.length === 1 && !selectedClientId && (
        <div className="mb-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const only = filteredClients[0];
              setValue("clientId", only.id, { shouldValidate: true });
            }}
          >
            {t('form.useMatchedClient')}
          </Button>
        </div>
      )}

      {selectedClient && (
        <div className="mb-4 rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 p-4 transition-colors">
          <p className="text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase mb-2">Selected Client</p>
          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{clientLabel(selectedClient)}</p>
          <p className="text-xs text-surface-500 mt-1">
            {selectedClient.nationalId || selectedClient.primaryPhone || selectedClient.email}
          </p>
          {errors.clientId?.message && (
            <p className="mt-1.5 text-xs text-red-500">{errors.clientId.message}</p>
          )}
          <input type="hidden" {...register("clientId")} />
        </div>
      )}
      {!selectedClient && errors.clientId?.message && (
        <p className="mt-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {errors.clientId.message}
        </p>
      )}

      {selectedClient && (
        <div className="mb-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 p-4 transition-colors">
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300 mb-2">Client Snapshot (Auto-filled from database)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-surface-700 dark:text-surface-300">
            <p><span className="font-semibold">First Name:</span> {selectedClient.firstName || "—"}</p>
            <p><span className="font-semibold">Last Name:</span> {selectedClient.lastName || "—"}</p>
            <p><span className="font-semibold">Gender:</span> {selectedClient.gender || "—"}</p>
            <p><span className="font-semibold">Segment:</span> {selectedClient.segmentLibelle || "—"}</p>
            <p><span className="font-semibold">Business Sector:</span> {selectedClient.secteurActiviteLibelle || "—"}</p>
            <p><span className="font-semibold">Business Activity:</span> {selectedClient.sousActiviteLibelle || "—"}</p>
            <p><span className="font-semibold">IFC Risk Level:</span> {selectedClient.ifcLevelOfRisk || "—"}</p>
          </div>
        </div>
      )}

      <div
        onMouseEnter={() => setHoveredField("loanPurpose")}
        onMouseLeave={() => setHoveredField(null)}
      >
        <Input
          label="Loan Purpose"
          {...register("loanPurpose")}
          error={errors.loanPurpose?.message}
          placeholder="e.g. Equipment purchase for production line"
          onFocus={() => setHoveredField("loanPurpose")}
          onBlur={() => setHoveredField(null)}
        />
        {showHint("loanPurpose", "Describe clearly why the client needs this loan.")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <div
          onMouseEnter={() => setHoveredField("requestedAmount")}
          onMouseLeave={() => setHoveredField(null)}
        >
          <Input
            label="Requested Amount"
            type="number"
            min="0"
            step="0.01"
            {...register("requestedAmount")}
            error={errors.requestedAmount?.message}
            onFocus={() => setHoveredField("requestedAmount")}
            onBlur={() => setHoveredField(null)}
          />
          {showHint("requestedAmount", "Enter a positive amount only (no negative values).")}
        </div>
        <Input
          label="Duration (months)"
          type="number"
          min="1"
          step="1"
          {...register("durationMonths")}
          error={errors.durationMonths?.message}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <div className="mb-4">
          <label htmlFor="productId" className="block text-sm font-medium text-surface-600 mb-1.5">
            {t('form.product')}
          </label>
          <select
            id="productId"
            className="block w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus-ring hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400 transition-all duration-200"
            {...register("productId")}
          >
            <option value="">{t('form.selectProduct')}</option>
            {PRODUCT_OPTIONS.map((product) => (
              <option key={product.id} value={product.id}>
                {product.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t('form.assetType')}
          {...register("assetType")}
          error={errors.assetType?.message}
          placeholder={t('form.assetTypePlaceholder')}
        />
      </div>

      <div className="mb-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 p-3 transition-colors">
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">{t('form.managerAssignment')}</p>
        <p className="text-xs text-surface-600 dark:text-surface-400 mt-1">
          {t('form.managerAutoAssigned')}
        </p>
        <p className="text-xs text-surface-700 dark:text-surface-300 mt-1">
          {t('form.currentUser')} {user?.firstName || "—"} {user?.lastName || ""} ({user?.role || "—"})
        </p>
      </div>

      <div className="mb-4">
        <Input
          label={t('form.monthlyRepaymentCapacity')}
          type="number"
          min="0"
          step="0.01"
          {...register("monthlyRepaymentCapacity")}
          error={errors.monthlyRepaymentCapacity?.message}
          placeholder={t('form.monthlyRepaymentCapacityPlaceholder')}
        />
      </div>

      {/* Application Channel Select */}
      <div className="mb-4">
        <label htmlFor="applicationChannel" className="block text-sm font-medium text-surface-600 mb-1.5">
          {t('form.applicationChannel')}
        </label>
        <select
          id="applicationChannel"
          className="block w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus-ring hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400 transition-all duration-200"
          {...register("applicationChannel")}
        >
          <option value="">{t('form.selectChannel')}</option>
          {APPLICATION_CHANNELS.map((channel) => (
            <option key={channel.value} value={channel.value}>
              {channel.label}
            </option>
          ))}
        </select>
        {errors.applicationChannel?.message && (
          <p className="mt-1.5 text-xs text-red-500">{errors.applicationChannel.message}</p>
        )}
      </div>

      {/* Conditional: Other Channel Text Input */}
      {watchApplicationChannel === "OTHER" && (
        <div className="mb-4">
          <Input
            label={t('form.specifyChannel')}
            {...register("applicationChannelOther")}
            error={errors.applicationChannelOther?.message}
            placeholder={t('form.specifyChannelPlaceholder')}
          />
        </div>
      )}

      {/* Risk Assessment Section */}
      <div className="mb-6 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 transition-colors">
        <h3 className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-4">{t('form.riskAssessment')}</h3>

        {/* Banking Restriction */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            {t('form.bankingRestriction')}
            <span className="text-rose-600 dark:text-rose-400 ml-1">*</span>
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={watch("bankingRestriction") === true}
                onChange={() => setValue("bankingRestriction", true)}
                className="w-4 h-4 border-surface-300 dark:border-surface-600"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">{t('form.yes')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={watch("bankingRestriction") === false}
                onChange={() => setValue("bankingRestriction", false)}
                className="w-4 h-4 border-surface-300 dark:border-surface-600"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">{t('form.no')}</span>
            </label>
          </div>
          {errors.bankingRestriction && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.bankingRestriction.message}</p>
          )}
        </div>

        {/* Legal Issue or Account Blocked */}
        <div>
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-3">
            {t('form.legalIssueOrAccountBlocked')}
            <span className="text-rose-600 dark:text-rose-400 ml-1">*</span>
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={watch("legalIssueOrAccountBlocked") === true}
                onChange={() => setValue("legalIssueOrAccountBlocked", true)}
                className="w-4 h-4 border-surface-300 dark:border-surface-600"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">{t('form.yes')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={watch("legalIssueOrAccountBlocked") === false}
                onChange={() => setValue("legalIssueOrAccountBlocked", false)}
                className="w-4 h-4 border-surface-300 dark:border-surface-600"
              />
              <span className="text-sm text-surface-700 dark:text-surface-300">{t('form.no')}</span>
            </label>
          </div>
          {errors.legalIssueOrAccountBlocked && (
            <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.legalIssueOrAccountBlocked.message}</p>
          )}
        </div>
      </div>

      {/* Consent Text - Read-only Display */}
      <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 transition-colors">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3">{t('form.declarationOfConsent')}</p>
        <div dir="rtl" className="text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap leading-relaxed text-justify">
          {CONSENT_TEXT}
        </div>
      </div>

      {/* Guarantors Section */}
      <div className="mb-6 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('form.guarantorsSection')}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendGuarantor({ name: "", amplitudeId: "", clientRelationship: "" })}
          >
            {t('form.addGuarantor')}
          </Button>
        </div>

        {guarantorFields.length > 0 ? (
          <div className="space-y-3">
            {guarantorFields.map((field, idx) => (
              <div key={field.id} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-surface-200 dark:border-surface-700 transition-colors">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label={t('form.guarantorName')}
                    {...register(`guarantors.${idx}.name`)}
                    error={errors.guarantors?.[idx]?.name?.message}
                    placeholder={t('form.guarantorNamePlaceholder')}
                  />
                  <Input
                    label={t('form.guarantorAmplitudeId')}
                    {...register(`guarantors.${idx}.amplitudeId`)}
                    error={errors.guarantors?.[idx]?.amplitudeId?.message}
                    placeholder={t('form.guarantorAmplitudeIdPlaceholder')}
                  />
                  <Input
                    label={t('form.guarantorRelationship')}
                    {...register(`guarantors.${idx}.clientRelationship`)}
                    error={errors.guarantors?.[idx]?.clientRelationship?.message}
                    placeholder={t('form.guarantorRelationshipPlaceholder')}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeGuarantor(idx)}
                  >
                    {t('form.removeGuarantor')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-surface-500 italic">{t('form.noGuarantorsAdded')}</p>
        )}
      </div>

      {/* Guarantees Section */}
      <div className="mb-6 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-4 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-100">{t('form.guaranteesSection')}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendGuarantee({ owner: "", type: "", estimatedValue: undefined })}
          >
            {t('form.addGuarantee')}
          </Button>
        </div>

        {guaranteeFields.length > 0 ? (
          <div className="space-y-3">
            {guaranteeFields.map((field, idx) => (
              <div key={field.id} className="bg-white dark:bg-surface-800 rounded-lg p-3 border border-surface-200 dark:border-surface-700 transition-colors">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label={t('form.guaranteeOwner')}
                    {...register(`guarantees.${idx}.owner`)}
                    error={errors.guarantees?.[idx]?.owner?.message}
                    placeholder={t('form.guaranteeOwnerPlaceholder')}
                  />
                  <Input
                    label={t('form.guaranteeType')}
                    {...register(`guarantees.${idx}.type`)}
                    error={errors.guarantees?.[idx]?.type?.message}
                    placeholder={t('form.guaranteeTypePlaceholder')}
                  />
                  <Input
                    label={t('form.guaranteeValue')}
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`guarantees.${idx}.estimatedValue`)}
                    error={errors.guarantees?.[idx]?.estimatedValue?.message}
                    placeholder={t('form.guaranteeValuePlaceholder')}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeGuarantee(idx)}
                  >
                    {t('form.removeGuarantee')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-surface-500 italic">{t('form.noGuaranteesAdded')}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? t('buttons.update') : t('buttons.create')}
        </Button>
      </div>
    </form>
  );
};

export default DemandeForm;
