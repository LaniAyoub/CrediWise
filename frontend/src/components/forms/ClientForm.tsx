import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "@/types/client.types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { referenceService, type ReferenceItem } from "@/services/reference.service";
import {
  isAtLeast18YearsOld,
  isValidTunisianPhone,
} from "@/utils/validators";

// ── Validation schema ────────────────────────────────────────────────────────
const clientSchema = z
  .object({
    clientType: z.enum(["PHYSICAL", "LEGAL"]),

    // Physical - made optional, validated in superRefine
    firstName: z.string().optional().or(z.literal("")),
    lastName: z.string().optional().or(z.literal("")),
    dateOfBirth: z.string().optional().or(z.literal("")),
    nationalId: z.string().optional().or(z.literal("")),
    taxIdentifier: z.string().optional().or(z.literal("")),
    gender: z.string().optional().or(z.literal("")),
    situationFamiliale: z.string().optional().or(z.literal("")),
    nationality: z.string().optional().or(z.literal("")),
    monthlyIncome: z.string().optional().or(z.literal("")),

    // Legal - made optional, validated in superRefine
    companyName: z.string().optional().or(z.literal("")),
    sigle: z.string().optional().or(z.literal("")),
    registrationNumber: z.string().optional().or(z.literal("")),
    principalInterlocutor: z.string().optional().or(z.literal("")),

    // Contact - always required
    email: z
      .string()
      .min(1, "Email is required")
      .email("Email must be a valid email address"),
    primaryPhone: z
      .string()
      .min(1, "Primary phone is required")
      .refine(
        (val) => isValidTunisianPhone(val),
        "Phone phone must be numeric  8 digits",
      ),
    secondaryPhone: z
      .string()
      .optional()
      .refine(
        (val) => !val || isValidTunisianPhone(val),
        "Secondary phone must be numeric 8 digits",
      )
      .or(z.literal("")),
    addressStreet: z.string().min(1, "Street is required"),
    addressCity: z.string().min(1, "City is required"),
    addressPostal: z.string().min(1, "Postal code is required"),
    addressCountry: z.string().min(1, "Country is required"),

    // Other - always required
    // agenceId is auto-injected from manager's auth context — not in the form
    relationAvecClient: z.string().min(1, "Relation is required"),
    relationAvecClientOther: z.string().optional().or(z.literal("")),
    accountNumber: z
      .string()
      .min(1, "Account number is required")
      .regex(/^\d{20}$/, "Account number must be exactly 20 numeric digits"),
    accountTypeCustomName: z.string().optional().or(z.literal("")),
    scoring: z.string().optional().or(z.literal("")),
    cycle: z.string().optional().or(z.literal("")),
    cbsId: z.string().optional().or(z.literal("")),

    // Reference entities (numeric IDs) - REQUIRED
    segmentId: z.string().min(1, "Segment is required"),
    accountTypeId: z.string().min(1, "Account type is required"),
    secteurActiviteId: z.string().min(1, "Business sector is required"),
    sousActiviteId: z.string().min(1, "Business activity is required"),

    // Update-only
    status: z
      .enum(["PROSPECT", "ACTIVE"], {
        message: "Status is required",
      })
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // Validate PHYSICAL specific fields
    if (data.clientType === "PHYSICAL") {
      if (!data.firstName || data.firstName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstName"],
          message: "First name is required",
        });
      }
      if (!data.lastName || data.lastName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastName"],
          message: "Last name is required",
        });
      }
      if (!data.dateOfBirth || data.dateOfBirth.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateOfBirth"],
          message: "Date of birth is required",
        });
      } else if (!isAtLeast18YearsOld(data.dateOfBirth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateOfBirth"],
          message: "Client must be at least 18 years old",
        });
      }
      if (!data.nationalId || data.nationalId.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationalId"],
          message: "CIN is required",
        });
      } else if (!/^[A-Z0-9]{8}$/.test(data.nationalId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationalId"],
          message: "CIN must be exactly 8 alphanumeric characters",
        });
      }
      if (!data.taxIdentifier || data.taxIdentifier.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxIdentifier"],
          message: "Tax identifier is required",
        });
      }
      if (!data.gender) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gender"],
          message: "Gender is required",
        });
      }
      if (!data.situationFamiliale) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["situationFamiliale"],
          message: "Marital status is required",
        });
      }
      if (!data.nationality || data.nationality.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["nationality"],
          message: "Nationality is required",
        });
      }
      if (!data.monthlyIncome || data.monthlyIncome.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["monthlyIncome"],
          message: "Monthly income is required",
        });
      }
    }

    // Validate LEGAL specific fields
    if (data.clientType === "LEGAL") {
      if (!data.companyName || data.companyName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["companyName"],
          message: "Company name is required",
        });
      }
      if (!data.sigle || data.sigle.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sigle"],
          message: "Sigle is required",
        });
      }
      if (!data.registrationNumber || data.registrationNumber.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["registrationNumber"],
          message: "Registration number is required",
        });
      }
      if (
        !data.principalInterlocutor ||
        data.principalInterlocutor.trim() === ""
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["principalInterlocutor"],
          message: "Principal interlocutor is required",
        });
      }
    }

    // Validate common fields
    if (!data.addressStreet || data.addressStreet.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addressStreet"],
        message: "Street is required",
      });
    }
    if (!data.addressCity || data.addressCity.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addressCity"],
        message: "City is required",
      });
    }
    if (!data.addressPostal || data.addressPostal.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addressPostal"],
        message: "Postal code is required",
      });
    }
    if (!data.addressCountry || data.addressCountry.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["addressCountry"],
        message: "Country is required",
      });
    }
    if (!data.relationAvecClient) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relationAvecClient"],
        message: "Relation is required",
      });
    }
    if (
      data.relationAvecClient === "OTHER" &&
      (!data.relationAvecClientOther || data.relationAvecClientOther.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relationAvecClientOther"],
        message: "Please specify the relation",
      });
    }

    // Validate reference fields (always required)
    if (!data.segmentId || data.segmentId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["segmentId"],
        message: "Segment is required",
      });
    }
    if (!data.accountTypeId || data.accountTypeId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountTypeId"],
        message: "Account type is required",
      });
    }
    if (!data.secteurActiviteId || data.secteurActiviteId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["secteurActiviteId"],
        message: "Business sector is required",
      });
    }
    if (!data.sousActiviteId || data.sousActiviteId.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sousActiviteId"],
        message: "Business activity is required",
      });
    }
    if (
      data.accountTypeId === "4" &&
      (!data.accountTypeCustomName || data.accountTypeCustomName.trim() === "")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["accountTypeCustomName"],
        message: "Please specify the custom account type name",
      });
    }
  });

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  defaultValues?: Client;
  isLoading: boolean;
  isEdit?: boolean;
}

// ── Reusable select wrapper ──────────────────────────────────────────────────
const SelectField = ({
  label,
  id,
  error,
  children,
  disabled = false,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) => (
  <div className="mb-6">
    <label
      htmlFor={id}
      className={`block text-label mb-2 transition-colors ${
        disabled ? "text-surface-400 dark:text-surface-500" : "text-surface-600 dark:text-surface-400"
      }`}
    >
      {label}
    </label>
    <select
      id={id}
      disabled={disabled}
      className={`block w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200 focus-ring ${
        disabled
          ? "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-400 dark:text-surface-500 cursor-not-allowed"
          : "border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400"
      }`}
      {...rest}
    >
      {children}
    </select>
    {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
  </div>
);

// ── Section header component ─────────────────────────────────────────────────
const SectionTitle = ({ title, icon }: { title: string; icon: string }) => (
  <div className="flex items-center gap-2 pt-4 pb-2 border-b border-surface-200 dark:border-surface-700 mb-4">
    <span className="text-lg">{icon}</span>
    <h3 className="text-sm font-semibold text-surface-800 dark:text-surface-200">{title}</h3>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ClientForm = ({
  onSubmit,
  defaultValues,
  isLoading,
  isEdit = false,
}: ClientFormProps) => {
  const { t } = useTranslation('clients');
  const { user } = useAuth();

  // ── Reference data state ──────────────────────────────────────────────────
  const [segments, setSegments] = useState<ReferenceItem[]>([]);
  const [accountTypes, setAccountTypes] = useState<ReferenceItem[]>([]);
  const [secteurActivites, setSecteurActivites] = useState<ReferenceItem[]>([]);
  const [sousActivites, setSousActivites] = useState<ReferenceItem[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSchema) as any,
    defaultValues: defaultValues
      ? {
          clientType: defaultValues.clientType,
          status: defaultValues.status,
          firstName: defaultValues.firstName || "",
          lastName: defaultValues.lastName || "",
          dateOfBirth: defaultValues.dateOfBirth?.split("T")[0] || "",
          nationalId: defaultValues.nationalId || "",
          taxIdentifier: defaultValues.taxIdentifier || "",
          gender: defaultValues.gender ?? "",
          situationFamiliale: defaultValues.situationFamiliale ?? "",
          nationality: defaultValues.nationality || "",
          monthlyIncome: defaultValues.monthlyIncome?.toString() || "",
          companyName: defaultValues.companyName || "",
          sigle: defaultValues.sigle || "",
          registrationNumber: defaultValues.registrationNumber || "",
          principalInterlocutor: defaultValues.principalInterlocutor || "",
          email: defaultValues.email || "",
          primaryPhone: defaultValues.primaryPhone || "",
          secondaryPhone: defaultValues.secondaryPhone || "",
          addressStreet: defaultValues.addressStreet || "",
          addressCity: defaultValues.addressCity || "",
          addressPostal: defaultValues.addressPostal || "",
          addressCountry: defaultValues.addressCountry || "",
          relationAvecClient: defaultValues.relationAvecClient ?? "",
          relationAvecClientOther: defaultValues.relationAvecClientOther || "",
          accountNumber: defaultValues.accountNumber || "",
          accountTypeCustomName: defaultValues.accountTypeCustomName || "",
          scoring: defaultValues.scoring || "",
          cycle: defaultValues.cycle || "",
          cbsId: defaultValues.cbsId || "",
          segmentId: defaultValues.segmentId?.toString() || "",
          accountTypeId: defaultValues.accountTypeId?.toString() || "",
          secteurActiviteId: defaultValues.secteurActiviteId?.toString() || "",
          sousActiviteId: defaultValues.sousActiviteId?.toString() || "",
        }
      : {
          clientType: "PHYSICAL",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          nationalId: "",
          taxIdentifier: "",
          gender: "",
          situationFamiliale: "",
          nationality: "",
          monthlyIncome: "",
          companyName: "",
          sigle: "",
          registrationNumber: "",
          principalInterlocutor: "",
          email: "",
          primaryPhone: "",
          secondaryPhone: "",
          addressStreet: "",
          addressCity: "",
          addressPostal: "",
          addressCountry: "",
          relationAvecClient: "",
          relationAvecClientOther: "",
          accountNumber: "",
          accountTypeCustomName: "",
          scoring: "",
          cycle: "",
          cbsId: "",
          segmentId: "",
          accountTypeId: "",
          secteurActiviteId: "",
          sousActiviteId: "",
        },
  });

  // ── Fetch reference data ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoadingRef(true);
        const [seg, acc, sec, sous] = await Promise.all([
          referenceService.getSegments().catch(err => {
            console.error("Segments error:", err);
            return [];
          }),
          referenceService.getAccountTypes().catch(err => {
            console.error("Account types error:", err);
            return [];
          }),
          referenceService.getSecteurActivites().catch(err => {
            console.error("Secteur activites error:", err);
            return [];
          }),
          referenceService.getSousActivites().catch(err => {
            console.error("Sous activites error:", err);
            return [];
          }),
        ]);

        setSegments(seg || []);
        setAccountTypes(acc || []);
        setSecteurActivites(sec || []);
        setSousActivites(sous || []);
      } catch (error) {
        console.error("Error loading reference data:", error);
        // Set empty arrays to avoid rendering errors
        setSegments([]);
        setAccountTypes([]);
        setSecteurActivites([]);
        setSousActivites([]);
      } finally {
        setLoadingRef(false);
      }
    };
    fetchReferenceData();
  }, []);

  // ── Filter sous-activités by selected secteur ──────────────────────────────
  const selectedSecteurId = watch("secteurActiviteId");
  const selectedAccountTypeId = watch("accountTypeId");
  const selectedRelation = watch("relationAvecClient");
  useEffect(() => {
    if (selectedSecteurId && selectedSecteurId.trim()) {
      const fetchFiltered = async () => {
        try {
          const result = await referenceService.getSousActivitesBySecteur(
            parseInt(selectedSecteurId)
          );
          setSousActivites(result || []);
        } catch (error) {
          console.error("Error loading sous-activités:", error);
          setSousActivites([]);
        }
      };
      fetchFiltered();
    } else {
      setSousActivites([]);
      setValue("sousActiviteId", "");
    }
  }, [selectedSecteurId, setValue]);

  useEffect(() => {
    if (selectedAccountTypeId !== "4") {
      setValue("accountTypeCustomName", "");
    }
  }, [selectedAccountTypeId, setValue]);

  useEffect(() => {
    if (selectedRelation !== "OTHER") {
      setValue("relationAvecClientOther", "");
    }
  }, [selectedRelation, setValue]);

  const clientType = watch("clientType");
  const isPhysical = clientType === "PHYSICAL";

  // Wrap onSubmit to auto-inject agenceId from the logged-in manager
  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({ ...data, agenceId: user?.agenceId || "" });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-1"
    >
      {/* ── Type & Status ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label={t('form.clientType')}
          id="clientType"
          error={errors.clientType?.message}
          {...register("clientType")}
        >
          <option value="PHYSICAL">{t('form.physicalPerson')}</option>
          <option value="LEGAL">{t('form.legalEntity')}</option>
        </SelectField>

        {isEdit && (
          <SelectField
            label={t('form.status')}
            id="status"
            error={errors.status?.message}
            {...register("status")}
          >
            <option value="">{t('form.keepCurrent')}</option>
            <option value="PROSPECT">{t('form.prospect')}</option>
            <option value="ACTIVE">{t('form.active')}</option>
          </SelectField>
        )}
      </div>

      {/* ── Physical Person Fields ────────────────────────────────── */}
      {isPhysical && (
        <>
          <SectionTitle title={t('sections.identity')} icon="🪪" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label={t('form.firstName')}
              {...register("firstName")}
              error={errors.firstName?.message}
              placeholder={t('placeholders.firstName')}
            />
            <Input
              label={t('form.lastName')}
              {...register("lastName")}
              error={errors.lastName?.message}
              placeholder={t('placeholders.lastName')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label={t('form.dateOfBirth')}
              type="date"
              {...register("dateOfBirth")}
              error={errors.dateOfBirth?.message}
            />
            <SelectField
              label={t('form.gender')}
              id="gender"
              error={errors.gender?.message}
              {...register("gender")}
            >
              <option value="">{t('form.selectGender')}</option>
              <option value="MALE">{t('form.male')}</option>
              <option value="FEMALE">{t('form.female')}</option>
              <option value="OTHER">{t('form.other')}</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label={t('form.nationalId')}
              {...register("nationalId")}
              error={errors.nationalId?.message}
              placeholder={t('placeholders.cin')}
            />
            <Input
              label={t('form.taxIdentifier')}
              {...register("taxIdentifier")}
              error={errors.taxIdentifier?.message}
              placeholder={t('placeholders.taxId')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <SelectField
              label={t('form.maritalStatus')}
              id="situationFamiliale"
              error={errors.situationFamiliale?.message}
              {...register("situationFamiliale")}
            >
              <option value="">{t('form.selectStatus')}</option>
              <option value="SINGLE">{t('form.single')}</option>
              <option value="MARRIED">{t('form.married')}</option>
              <option value="DIVORCED">{t('form.divorced')}</option>
              <option value="SEPARATED">{t('form.separated')}</option>
              <option value="WIDOWER">{t('form.widower')}</option>
              <option value="OTHER">{t('form.other')}</option>
            </SelectField>
            <Input
              label={t('form.nationality')}
              {...register("nationality")}
              error={errors.nationality?.message}
              placeholder={t('placeholders.nationality')}
            />
          </div>
          <Input
            label={t('form.monthlyIncome')}
            type="number"
            min="0"
            step="0.01"
            {...register("monthlyIncome")}
            error={errors.monthlyIncome?.message}
            placeholder="2000.00"
          />
        </>
      )}

      {/* ── Legal Entity Fields ───────────────────────────────────── */}
      {!isPhysical && (
        <>
          <SectionTitle title={t('sections.company')} icon="🏢" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label={t('form.companyName')}
              {...register("companyName")}
              error={errors.companyName?.message}
              placeholder={t('placeholders.companyName')}
            />
            <Input
              label={t('form.sigle')}
              {...register("sigle")}
              error={errors.sigle?.message}
              placeholder={t('placeholders.abbreviation')}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label={t('form.registrationNumber')}
              {...register("registrationNumber")}
              error={errors.registrationNumber?.message}
              placeholder={t('placeholders.rc')}
            />
            <Input
              label={t('form.principalInterlocutor')}
              {...register("principalInterlocutor")}
              error={errors.principalInterlocutor?.message}
              placeholder={t('placeholders.contactName')}
            />
          </div>
        </>
      )}

      {/* ── Contact ───────────────────────────────────────────────── */}
      <SectionTitle title={t('sections.contact')} icon="📞" />
      <Input
        label={t('form.email')}
        type="email"
        {...register("email")}
        error={errors.email?.message}
        placeholder={t('placeholders.email')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label={t('form.primaryPhone')}
          {...register("primaryPhone")}
          error={errors.primaryPhone?.message}
          placeholder={t('placeholders.primaryPhone')}
        />
        <Input
          label={t('form.secondaryPhone')}
          {...register("secondaryPhone")}
          error={errors.secondaryPhone?.message}
          placeholder={t('placeholders.secondaryPhone')}
        />
      </div>

      {/* ── Address ───────────────────────────────────────────────── */}
      <SectionTitle title={t('sections.address')} icon="📍" />
      <Input
        label={t('form.street')}
        {...register("addressStreet")}
        error={errors.addressStreet?.message}
        placeholder={t('placeholders.street')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Input
          label={t('form.city')}
          {...register("addressCity")}
          error={errors.addressCity?.message}
          placeholder={t('placeholders.city')}
        />
        <Input
          label={t('form.postalCode')}
          {...register("addressPostal")}
          error={errors.addressPostal?.message}
          placeholder={t('placeholders.postalCode')}
        />
        <Input
          label={t('form.country')}
          {...register("addressCountry")}
          error={errors.addressCountry?.message}
          placeholder={t('placeholders.country')}
        />
      </div>
      <SectionTitle title={t('sections.businessClassification')} icon="📊" />
      {/* ── Business Classification ───────────────────────────────── */}
      <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-900/10 p-5 sm:p-6 transition-colors">
        

        {loadingRef ? (
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded-xl mb-3"></div>
              <div className="h-10 bg-surface-200 dark:bg-surface-700 rounded-xl"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Segment */}
              <div>
                <label htmlFor="segmentId" className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  {t('form.clientSegment')}
                </label>
                <select
                  id="segmentId"
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-3 text-sm text-surface-900 dark:text-surface-100 hover:border-surface-400 dark:hover:border-surface-500 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 transition-all"
                  {...register("segmentId")}
                >
                  <option value="">{t('form.chooseSegment')}</option>
                  {segments.length > 0 ? (
                    segments.map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.libelle ? seg.libelle.charAt(0).toUpperCase() + seg.libelle.slice(1) : `Segment ${seg.id}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>{t('form.noSegments')}</option>
                  )}
                </select>
                {errors.segmentId && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.segmentId.message}</p>}
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="accountTypeId" className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  {t('form.accountType')}
                </label>
                <select
                  id="accountTypeId"
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-3 text-sm text-surface-900 dark:text-surface-100 hover:border-surface-400 dark:hover:border-surface-500 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 transition-all"
                  {...register("accountTypeId")}
                >
                  <option value="">{t('form.chooseAccountType')}</option>
                  {accountTypes.length > 0 ? (
                    accountTypes.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.libelle ? acc.libelle.charAt(0).toUpperCase() + acc.libelle.slice(1) : `Type ${acc.id}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>{t('form.noAccountTypes')}</option>
                  )}
                </select>
                {errors.accountTypeId && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.accountTypeId.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('form.accountNumber')}
                {...register("accountNumber")}
                error={errors.accountNumber?.message}
                placeholder={t('placeholders.accountNumber')}
                maxLength={20}
              />
              {selectedAccountTypeId === "4" ? (
                <Input
                  label={t('form.specifyAccountType')}
                  {...register("accountTypeCustomName")}
                  error={errors.accountTypeCustomName?.message}
                  placeholder={t('placeholders.customAccountType')}
                />
              ) : (
                <div />
              )}
            </div>

            <div className="h-px bg-brand-200 dark:bg-brand-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Business Sector */}
              <div>
                <label htmlFor="secteurActiviteId" className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  {t('form.businessSector')}
                </label>
                <select
                  id="secteurActiviteId"
                  className="w-full rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 px-4 py-3 text-sm text-surface-900 dark:text-surface-100 hover:border-surface-400 dark:hover:border-surface-500 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50 transition-all"
                  {...register("secteurActiviteId")}
                >
                  <option value="">{t('form.chooseSector')}</option>
                  {secteurActivites.length > 0 ? (
                    secteurActivites.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.libelle ? sec.libelle.charAt(0).toUpperCase() + sec.libelle.slice(1) : `Sector ${sec.id}`}
                      </option>
                    ))
                  ) : (
                    <option disabled>{t('form.noSectors')}</option>
                  )}
                </select>
                {errors.secteurActiviteId && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.secteurActiviteId.message}</p>}
              </div>

              {/* Business Activity */}
              <div>
                <label htmlFor="sousActiviteId" className="block text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">
                  {t('form.businessActivity')}
                </label>
                <select
                  id="sousActiviteId"
                  disabled={!selectedSecteurId || selectedSecteurId.trim() === ""}
                  className={`w-full rounded-lg border px-4 py-3 text-sm transition-all ${
                    !selectedSecteurId || selectedSecteurId.trim() === ""
                      ? "border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-400 dark:text-surface-500 cursor-not-allowed"
                      : "border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 hover:border-surface-400 dark:hover:border-surface-500 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/50"
                  }`}
                  {...register("sousActiviteId")}
                >
                  <option value="">
                    {selectedSecteurId && selectedSecteurId.trim()
                      ? t('form.chooseActivity')
                      : t('form.selectSectorFirst')}
                  </option>
                  {selectedSecteurId && selectedSecteurId.trim() && sousActivites.length > 0 ? (
                    sousActivites.map((sous) => (
                      <option key={sous.id} value={sous.id}>
                        {sous.libelle ? sous.libelle.charAt(0).toUpperCase() + sous.libelle.slice(1) : `Activity ${sous.id}`}
                      </option>
                    ))
                  ) : selectedSecteurId && selectedSecteurId.trim() ? (
                    <option disabled>{t('form.noActivities')}</option>
                  ) : null}
                </select>
                {errors.sousActiviteId && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{errors.sousActiviteId.message}</p>}
                {!errors.sousActiviteId && (
                  <p className="mt-1 text-xs text-surface-500">
                    {!selectedSecteurId || selectedSecteurId.trim() === ""
                      ? t('form.selectSectorMessage')
                      : t('form.selectActivityMessage')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Banking Info ──────────────────────────────────────────── */}
      <SectionTitle title={t('sections.bankingInfo')} icon="🏦" />

      {/* Agence is auto-assigned from the logged-in manager */}
      {user?.agenceId && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-4 py-2.5 transition-colors">
          <span className="text-base">🏢</span>
          <span className="text-sm text-surface-600 dark:text-surface-400">
            {t('hints.agenceAssigned')}
          </span>
          <span className="text-sm font-semibold text-brand-700">
            {user.agenceId}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
  <SelectField
    label={t('form.relationWithClient')}
    id="relationAvecClient"
    error={errors.relationAvecClient?.message}
    {...register("relationAvecClient")}
  >
    <option value="">{t('form.selectRelation')}</option>
    <option value="CLIENT">{t('form.client')}</option>
    <option value="SUPPLIER">{t('form.supplier')}</option>
    <option value="NEIGHBOUR">{t('form.neighbour')}</option>
    <option value="OTHER">{t('form.other')}</option>
  </SelectField>

  {/* Show input only if OTHER is selected */}
  {selectedRelation === "OTHER" && (
    <Input
      label={t('form.specifyRelation')}
      {...register("relationAvecClientOther")}
      error={errors.relationAvecClientOther?.message}
      placeholder={t('placeholders.relationNote')}
    />
  )}
</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Input
          label={t('form.cbsId')}
          {...register("cbsId")}
          error={errors.cbsId?.message}
          placeholder={t('placeholders.cbsId')}
        />
        <Input
          label={t('form.scoring')}
          {...register("scoring")}
          error={errors.scoring?.message}
          placeholder={t('placeholders.score')}
        />
        <div className="mb-4">
          <label className="block text-sm font-medium text-surface-600 mb-1.5">
            {t('form.cycle')}
          </label>
          <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-4 py-2.5 text-sm text-surface-600 dark:text-surface-400">
            {t('hints.cycleManaged')}
          </div>
        </div>
      </div>

      {/* ── Submit ────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? t('buttons.update') : t('buttons.create')}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
