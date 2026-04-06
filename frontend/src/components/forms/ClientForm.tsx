import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client } from "@/types/client.types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import {
  isAtLeast18YearsOld,
  isValidCIN,
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
        "Phone must be in format +216 followed by 8 digits",
      ),
    secondaryPhone: z
      .string()
      .optional()
      .refine(
        (val) => !val || isValidTunisianPhone(val),
        "Secondary phone must be in format +216 followed by 8 digits",
      )
      .or(z.literal("")),
    addressStreet: z.string().min(1, "Street is required"),
    addressCity: z.string().min(1, "City is required"),
    addressPostal: z.string().min(1, "Postal code is required"),
    addressCountry: z.string().min(1, "Country is required"),

    // Other - always required
    // agenceId is auto-injected from manager's auth context — not in the form
    relationAvecClient: z.string().min(1, "Relation is required"),
    scoring: z.string().optional().or(z.literal("")),
    cycle: z.string().min(1, "Cycle is required"),
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
    if (!data.cycle || data.cycle.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cycle"],
        message: "Cycle is required",
      });
    }
    if (!data.relationAvecClient) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relationAvecClient"],
        message: "Relation is required",
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
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="mb-4">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-surface-600 mb-1.5"
    >
      {label}
    </label>
    <select
      id={id}
      className="block w-full rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm text-surface-800 focus-ring hover:border-surface-300 focus:border-brand-500 transition-all duration-200"
      {...rest}
    >
      {children}
    </select>
    {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
  </div>
);

// ── Section header component ─────────────────────────────────────────────────
const SectionTitle = ({ title, icon }: { title: string; icon: string }) => (
  <div className="flex items-center gap-2 pt-2 pb-1 border-b border-surface-100 mb-3">
    <span className="text-base">{icon}</span>
    <h3 className="text-sm font-semibold text-surface-700">{title}</h3>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const ClientForm = ({
  onSubmit,
  defaultValues,
  isLoading,
  isEdit = false,
}: ClientFormProps) => {
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
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
          scoring: "",
          cycle: "",
          cbsId: "",
          segmentId: "",
          accountTypeId: "",
          secteurActiviteId: "",
          sousActiviteId: "",
        },
  });

  const clientType = watch("clientType");
  const isPhysical = clientType === "PHYSICAL";

  // Wrap onSubmit to auto-inject agenceId from the logged-in manager
  const handleFormSubmit = (data: ClientFormData) => {
    onSubmit({ ...data, agenceId: user?.agenceId || "" });
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit as any)}
      className="space-y-1"
    >
      {/* ── Type & Status ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label="Client Type"
          id="clientType"
          error={errors.clientType?.message}
          {...register("clientType")}
        >
          <option value="PHYSICAL">👤 Physical Person</option>
          <option value="LEGAL">🏢 Legal Entity</option>
        </SelectField>

        {isEdit && (
          <SelectField
            label="Status"
            id="status"
            error={errors.status?.message}
            {...register("status")}
          >
            <option value="">— keep current —</option>
            <option value="PROSPECT">Prospect</option>
            <option value="ACTIVE">Active</option>
          </SelectField>
        )}
      </div>

      {/* ── Physical Person Fields ────────────────────────────────── */}
      {isPhysical && (
        <>
          <SectionTitle title="Identity" icon="🪪" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="First Name"
              {...register("firstName")}
              error={errors.firstName?.message}
              placeholder="First Name"
            />
            <Input
              label="Last Name"
              {...register("lastName")}
              error={errors.lastName?.message}
              placeholder="Last Name"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Date of Birth"
              type="date"
              {...register("dateOfBirth")}
              error={errors.dateOfBirth?.message}
            />
            <SelectField
              label="Gender"
              id="gender"
              error={errors.gender?.message}
              {...register("gender")}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </SelectField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="National ID (CIN)"
              {...register("nationalId")}
              error={errors.nationalId?.message}
              placeholder="12345678"
            />
            <Input
              label="Tax Identifier"
              {...register("taxIdentifier")}
              error={errors.taxIdentifier?.message}
              placeholder="Tax ID"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <SelectField
              label="Marital Status"
              id="situationFamiliale"
              error={errors.situationFamiliale?.message}
              {...register("situationFamiliale")}
            >
              <option value="">Select status</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="SEPARATED">Separated</option>
              <option value="WIDOWER">Widower</option>
              <option value="OTHER">Other</option>
            </SelectField>
            <Input
              label="Nationality"
              {...register("nationality")}
              error={errors.nationality?.message}
              placeholder="Tunisian"
            />
          </div>
          <Input
            label="Monthly Income (TND)"
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
          <SectionTitle title="Company Information" icon="🏢" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Company Name"
              {...register("companyName")}
              error={errors.companyName?.message}
              placeholder="Company Name"
            />
            <Input
              label="Sigle / Abbreviation"
              {...register("sigle")}
              error={errors.sigle?.message}
              placeholder="Abbreviation"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input
              label="Registration Number (RC)"
              {...register("registrationNumber")}
              error={errors.registrationNumber?.message}
              placeholder="RC"
            />
            <Input
              label="Principal Interlocutor"
              {...register("principalInterlocutor")}
              error={errors.principalInterlocutor?.message}
              placeholder="Contact Name"
            />
          </div>
        </>
      )}

      {/* ── Contact ───────────────────────────────────────────────── */}
      <SectionTitle title="Contact" icon="📞" />
      <Input
        label="Email"
        type="email"
        {...register("email")}
        error={errors.email?.message}
        placeholder="email@example.com"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="Primary Phone"
          {...register("primaryPhone")}
          error={errors.primaryPhone?.message}
          placeholder="+216 2XXXX XXXX"
        />
        <Input
          label="Secondary Phone"
          {...register("secondaryPhone")}
          error={errors.secondaryPhone?.message}
          placeholder="+216 2XXXX XXXX (optional)"
        />
      </div>

      {/* ── Address ───────────────────────────────────────────────── */}
      <SectionTitle title="Address" icon="📍" />
      <Input
        label="Street"
        {...register("addressStreet")}
        error={errors.addressStreet?.message}
        placeholder="Street Address"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Input
          label="City"
          {...register("addressCity")}
          error={errors.addressCity?.message}
          placeholder="Tunis"
        />
        <Input
          label="Postal Code"
          {...register("addressPostal")}
          error={errors.addressPostal?.message}
          placeholder="1000"
        />
        <Input
          label="Country"
          {...register("addressCountry")}
          error={errors.addressCountry?.message}
          placeholder="Tunisia"
        />
      </div>

      {/* ── Business Classification ───────────────────────────────── */}
      <SectionTitle title="Business Classification" icon="📊" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="Segment ID"
          type="number"
          {...register("segmentId")}
          error={errors.segmentId?.message}
          placeholder="Enter segment ID (1-100)"
        />
        <Input
          label="Account Type ID"
          type="number"
          {...register("accountTypeId")}
          error={errors.accountTypeId?.message}
          placeholder="Enter account type ID (1-100)"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Input
          label="Business Sector ID"
          type="number"
          {...register("secteurActiviteId")}
          error={errors.secteurActiviteId?.message}
          placeholder="Enter business sector ID"
        />
        <Input
          label="Business Activity ID"
          type="number"
          {...register("sousActiviteId")}
          error={errors.sousActiviteId?.message}
          placeholder="Enter business activity ID"
        />
      </div>

      {/* ── Banking Info ──────────────────────────────────────────── */}
      <SectionTitle title="Banking Info" icon="🏦" />

      {/* Agence is auto-assigned from the logged-in manager */}
      {user?.agenceId && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 border border-brand-100 px-4 py-2.5">
          <span className="text-base">🏢</span>
          <span className="text-sm text-surface-600">
            Agence automatically assigned from your account:
          </span>
          <span className="text-sm font-semibold text-brand-700">
            {user.agenceId}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <SelectField
          label="Relation avec client"
          id="relationAvecClient"
          error={errors.relationAvecClient?.message}
          {...register("relationAvecClient")}
        >
          <option value="">Select relation</option>
          <option value="CLIENT">Client</option>
          <option value="SUPPLIER">Fournisseur (Supplier)</option>
          <option value="NEIGHBOUR">Voisin (Neighbour)</option>
          <option value="OTHER">Other</option>
        </SelectField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
        <Input
          label="CBS ID"
          {...register("cbsId")}
          error={errors.cbsId?.message}
          placeholder="CBS ID (optional)"
        />
        <Input
          label="Scoring"
          {...register("scoring")}
          error={errors.scoring?.message}
          placeholder="Score (optional)"
        />
        <Input
          label="Cycle"
          {...register("cycle")}
          error={errors.cycle?.message}
          placeholder="Cycle"
        />
      </div>

      {/* ── Submit ────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? "Update Client" : "Create Client"}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
