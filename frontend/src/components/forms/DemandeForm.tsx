import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "@/types/client.types";
import type { Demande } from "@/types/demande.types";
import { clientService } from "@/services/client.service";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import ClientSearchInput from "@/components/forms/ClientSearchInput";

// Products 101/102/103 → ANALYSE workflow (full analysis steps + rules)
// Products 104+ → CHECK_BEFORE_COMMITTEE workflow (checklist service, no analyse steps)
const PRODUCT_OPTIONS = [
  { id: "101", label: "Crédit Micro Tatouir" },
  { id: "102", label: "Crédit TPE Mostakbali" },
  { id: "103", label: "Crédit PME Imtiez" },
  { id: "104", label: "Product Auto" },
  { id: "105", label: "Crédit EL BEYA" },
  { id: "110", label: "Crédit Agricole Saba" },
];

const GUARANTEE_TYPE_OPTIONS = [ "Gage véhicule", "Fixed asset", "Nant Fds de commerce", "Aval salarié", "Caution solidaire", "Traite", "Stock", ];

const ASSET_TYPE_OPTIONS = [
  "BFR - MARCHANDISES",
  "BFR - MATIERES PREMIERES",
  "BFR - AUTRES",
  "INVEST - IMMOBILIER",
  "INVEST - AUTRES",
  "PERSO - EDUCATION",
  "PERSO - HABITAT",
  "PERSO - URGENCE",
  "PERSO - AUTRES",
];



const APPLICATION_CHANNELS = [
  { value: "AGENCY", label: "Agency" },
  { value: "FIELD", label: "Field" },
  { value: "CALL_CENTER", label: "Call Center" },
  { value: "MYADVANS", label: "MyAdvans" },
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
  /** @deprecated Legacy prop kept so DemandesPage compiles without changes — no longer used for search */
  clients?: Client[];
  isLoading: boolean;
  defaultValues?: Demande;
  isEdit?: boolean;
}

const DemandeForm = ({
  onSubmit,
  isLoading,
  defaultValues,
  isEdit = false,
}: DemandeFormProps) => {
  const { t } = useTranslation('demandes');
  const { user } = useAuth();
  // Full client object fetched after selection (for snapshot display)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

  const watchApplicationChannel = watch("applicationChannel");

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
      <div className="mb-6">
        <ClientSearchInput
          onSelect={async (clientId) => {
            setValue("clientId", clientId, { shouldValidate: true });
            try {
              const res = await clientService.getById(clientId);
              setSelectedClient(res.data);
            } catch {
              setSelectedClient(null);
            }
          }}
          lockedClient={selectedClient}
          onClear={() => {
            setSelectedClient(null);
            setValue("clientId", "", { shouldValidate: true });
          }}
          error={errors.clientId?.message}
        />
        <input type="hidden" {...register("clientId")} />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          {t('form.loanPurpose')}
          <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <textarea
          {...register("loanPurpose")}
          rows={3}
          placeholder={t('form.loanPurposePlaceholder')}
          className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-all resize-none"
        />
        {errors.loanPurpose?.message && (
          <p className="mt-1.5 text-xs text-red-500">{errors.loanPurpose.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {t('form.requestedAmount')}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              {...register("requestedAmount")}
              placeholder={t('form.requestedAmountPlaceholder')}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 pr-14 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400 dark:text-surface-500 pointer-events-none">TND</span>
          </div>
          {errors.requestedAmount?.message && (
            <p className="mt-1.5 text-xs text-red-500">{errors.requestedAmount.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {t('form.durationMonths')}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="1"
              {...register("durationMonths")}
              placeholder={t('form.durationMonthsPlaceholder')}
              className="block w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 pr-14 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400 dark:text-surface-500 pointer-events-none">mois</span>
          </div>
          {errors.durationMonths?.message && (
            <p className="mt-1.5 text-xs text-red-500">{errors.durationMonths.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <div className="mb-4">
          <label htmlFor="productId" className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">
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
        <div className="mb-4">
          <label htmlFor="assetType" className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">
            {t('form.assetType')}
          </label>
          <select
            id="assetType"
            className="block w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus-ring hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400 transition-all duration-200"
            {...register("assetType")}
          >
            <option value="">{t('form.assetTypePlaceholder')}</option>
            {ASSET_TYPE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {errors.assetType?.message && (
            <p className="mt-1.5 text-xs text-red-500">{errors.assetType.message}</p>
          )}
        </div>
      </div>

      {/* Manager Assignment — snapshot card */}
      <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 transition-colors">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">{t('form.managerAssignment')}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 dark:bg-emerald-700 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">
              {(user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
              {user?.firstName || "—"} {user?.lastName || ""}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 uppercase">
                {user?.role || "—"}
              </span>
              <span className="text-xs text-surface-500 dark:text-surface-400">{t('form.managerAutoAssigned')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Repayment Capacity */}
      <div className="mb-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 p-4 transition-colors">
        <label htmlFor="monthlyRepaymentCapacity" className="block text-sm font-semibold text-surface-800 dark:text-surface-200 mb-1">
          {t('form.monthlyRepaymentCapacity')}
        </label>
        <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">{t('form.monthlyRepaymentCapacityHint')}</p>
        <div className="relative max-w-xs">
          <input
            id="monthlyRepaymentCapacity"
            type="number"
            min="0"
            step="0.01"
            {...register("monthlyRepaymentCapacity")}
            placeholder={t('form.monthlyRepaymentCapacityPlaceholder')}
            className="block w-full rounded-lg border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 px-4 py-2.5 pr-14 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-400 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400 dark:text-surface-500 pointer-events-none">TND</span>
        </div>
        {errors.monthlyRepaymentCapacity?.message && (
          <p className="mt-1.5 text-xs text-red-500">{errors.monthlyRepaymentCapacity.message}</p>
        )}
      </div>

      {/* Application Channel Select */}
      <div className="mb-4">
        <label htmlFor="applicationChannel" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
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
