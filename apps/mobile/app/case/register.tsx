import { FuguDivider } from "@/components/Fugu";
import { PlacesAutocomplete } from "@/components/PlacesAutocomplete";
import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { FormField, Input, SegmentedControl } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { DEMO_CHW_ID, patientTypeLabel } from "@/lib/config";
import {
  formatAge,
  upsertCase,
  type AgeUnit,
  type MaternalStatus,
  type PatientSex,
} from "@/lib/db";
import type { PatientType } from "@nyaaba/content";
import { colors } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import cuid from "cuid";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

const STEPS = ["Identity", "Contact", "Visit", "Confirm"] as const;
type Step = 1 | 2 | 3 | 4;

type FormState = {
  patientName: string;
  patientSex: PatientSex | null;
  ageValue: string;
  ageUnit: AgeUnit;
  community: string;
  phone: string;
  caregiverName: string;
  caregiverPhone: string;
  maternalStatus: MaternalStatus | null;
  gestationalWeeks: string;
  notes: string;
  consent: boolean;
};

type Errors = Partial<Record<keyof FormState, string>>;

function isPatientType(value: string | undefined): value is PatientType {
  return value === "MATERNAL" || value === "NEWBORN" || value === "UNDER5";
}

function initialForm(type: PatientType): FormState {
  return {
    patientName: "",
    patientSex: type === "MATERNAL" ? "FEMALE" : null,
    ageValue: "",
    ageUnit:
      type === "NEWBORN" ? "DAYS" : type === "UNDER5" ? "MONTHS" : "YEARS",
    community: "",
    phone: "",
    caregiverName: "",
    caregiverPhone: "",
    maternalStatus: null,
    gestationalWeeks: "",
    notes: "",
    consent: false,
  };
}

function validateIdentity(type: PatientType, form: FormState): Errors {
  const errors: Errors = {};
  if (form.patientName.trim().length < 2) {
    errors.patientName = "Enter the patient’s full name";
  }
  if (!form.patientSex) errors.patientSex = "Select sex";

  const age = Number(form.ageValue);
  if (!form.ageValue.trim() || Number.isNaN(age) || age < 0) {
    errors.ageValue = "Enter a valid age";
  } else if (type === "NEWBORN" && age > 31) {
    errors.ageValue = "Newborn age should be 0–31 days";
  } else if (type === "UNDER5" && form.ageUnit === "MONTHS" && age > 60) {
    errors.ageValue = "Use years for children over 60 months";
  } else if (
    type === "UNDER5" &&
    form.ageUnit === "YEARS" &&
    (age < 1 || age > 5)
  ) {
    errors.ageValue = "Under-5 age should be 1–5 years";
  } else if (type === "MATERNAL" && (age < 12 || age > 55)) {
    errors.ageValue = "Enter a plausible age in years";
  }
  return errors;
}

function validateContact(type: PatientType, form: FormState): Errors {
  const errors: Errors = {};
  if (!form.community.trim()) {
    errors.community = "Enter community or village";
  }
  if (type !== "MATERNAL" && !form.caregiverName.trim()) {
    errors.caregiverName = "Enter mother or caregiver name";
  }
  return errors;
}

function validateVisit(type: PatientType, form: FormState): Errors {
  const errors: Errors = {};
  if (type === "MATERNAL" && !form.maternalStatus) {
    errors.maternalStatus = "Select pregnant or postpartum";
  }
  if (type === "MATERNAL" && form.maternalStatus === "PREGNANT") {
    const weeks = Number(form.gestationalWeeks);
    if (
      form.gestationalWeeks.trim() &&
      (Number.isNaN(weeks) || weeks < 1 || weeks > 42)
    ) {
      errors.gestationalWeeks = "Gestational age should be 1–42 weeks";
    }
  }
  if (!form.consent) {
    errors.consent = "Confirm verbal consent before continuing";
  }
  return errors;
}

export default function PatientRegistrationScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();
  const patientType = isPatientType(type) ? type : null;
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(() =>
    initialForm(patientType ?? "MATERNAL")
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const ageUnitOptions = useMemo(() => {
    if (patientType === "NEWBORN") {
      return [{ value: "DAYS" as const, label: "Days" }];
    }
    if (patientType === "UNDER5") {
      return [
        { value: "MONTHS" as const, label: "Months" },
        { value: "YEARS" as const, label: "Years" },
      ];
    }
    return [{ value: "YEARS" as const, label: "Years" }];
  }, [patientType]);

  if (!patientType) {
    return (
      <View className="flex-1 bg-shea">
        <TopAppBar title="Register patient" onBack={() => router.back()} />
        <View className="gap-4 p-mobile">
          <Text className="font-headline text-2xl text-indigo-ink">
            Visit type missing
          </Text>
          <Text className="text-muted-foreground">
            Select a visit type before registering the patient.
          </Text>
          <Button onPress={() => router.replace("/case/new")}>
            <Text>Choose visit type</Text>
          </Button>
        </View>
      </View>
    );
  }
  const visitType: PatientType = patientType;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function next() {
    const nextErrors =
      step === 1
        ? validateIdentity(visitType, form)
        : step === 2
          ? validateContact(visitType, form)
          : validateVisit(visitType, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0 && step < 4) {
      setStep((step + 1) as Step);
    }
  }

  function back() {
    if (step === 1) router.back();
    else setStep((step - 1) as Step);
  }

  async function startAssessment() {
    const allErrors = {
      ...validateIdentity(visitType, form),
      ...validateContact(visitType, form),
      ...validateVisit(visitType, form),
    };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = cuid();
      await upsertCase({
        id,
        chwId: DEMO_CHW_ID,
        patientType: visitType,
        patientName: form.patientName.trim(),
        patientSex: form.patientSex,
        ageValue: Number(form.ageValue),
        ageUnit: form.ageUnit,
        community: form.community.trim(),
        phone: form.phone.trim() || null,
        caregiverName: form.caregiverName.trim() || null,
        caregiverPhone: form.caregiverPhone.trim() || null,
        maternalStatus: form.maternalStatus,
        gestationalWeeks: form.gestationalWeeks.trim()
          ? Number(form.gestationalWeeks)
          : null,
        notes: form.notes.trim() || null,
        consentAt: now,
        status: "IN_PROGRESS",
        createdAt: now,
        updatedAt: now,
        syncedAt: null,
        riskTier: null,
      });
      router.replace(`/case/${id}/checklist`);
    } catch (error) {
      Alert.alert(
        "Could not save patient",
        error instanceof Error ? error.message : "Please try again."
      );
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title="Register patient" onBack={back} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-12"
        >
          <View className="p-mobile pt-6">
            <StepIndicator step={step} />
            <Text className="font-utility text-[11px] uppercase tracking-wider text-clay">
              {patientTypeLabel(visitType)} visit
            </Text>

            {step === 1 ? (
              <IdentityStep
                patientType={visitType}
                form={form}
                errors={errors}
                ageUnitOptions={ageUnitOptions}
                update={update}
              />
            ) : null}
            {step === 2 ? (
              <ContactStep
                patientType={visitType}
                form={form}
                errors={errors}
                update={update}
              />
            ) : null}
            {step === 3 ? (
              <VisitStep
                patientType={visitType}
                form={form}
                errors={errors}
                update={update}
              />
            ) : null}
            {step === 4 ? (
              <ConfirmStep patientType={visitType} form={form} />
            ) : null}

            <View className="mt-section gap-3">
              {step < 4 ? (
                <Button onPress={next}>
                  <Text>Continue</Text>
                </Button>
              ) : (
                <Button disabled={saving} onPress={startAssessment}>
                  <Text>{saving ? "Saving…" : "Start assessment"}</Text>
                </Button>
              )}
              {step > 1 ? (
                <Button variant="outline" disabled={saving} onPress={back}>
                  <Text>Back</Text>
                </Button>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type StepProps = {
  patientType: PatientType;
  form: FormState;
  errors: Errors;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

function StepHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="mb-6 mt-2">
      <Text className="mb-1 font-display text-[28px] text-indigo-ink">
        {title}
      </Text>
      <Text className="mb-4 font-body leading-6 text-muted-foreground">
        {description}
      </Text>
      <FuguDivider />
    </View>
  );
}

function IdentityStep({
  patientType,
  form,
  errors,
  ageUnitOptions,
  update,
}: StepProps & {
  ageUnitOptions: { value: AgeUnit; label: string }[];
}) {
  return (
    <View className="gap-5">
      <StepHeading
        title="Patient identity"
        description="Record who the patient is and their age."
      />
      <FormField label="Full name" required error={errors.patientName}>
        <Input
          value={form.patientName}
          onChangeText={(value) => update("patientName", value)}
          placeholder="As used in the community"
          autoCapitalize="words"
          invalid={Boolean(errors.patientName)}
        />
      </FormField>
      {patientType !== "MATERNAL" ? (
        <FormField label="Sex" required error={errors.patientSex}>
          <SegmentedControl
            options={[
              { value: "FEMALE", label: "Female" },
              { value: "MALE", label: "Male" },
            ]}
            value={form.patientSex}
            onChange={(value) => update("patientSex", value)}
            invalid={Boolean(errors.patientSex)}
          />
        </FormField>
      ) : null}
      <FormField
        label={patientType === "NEWBORN" ? "Age (days)" : "Age"}
        required
        error={errors.ageValue}
        hint={
          patientType === "NEWBORN"
            ? "Count completed days since birth"
            : undefined
        }
      >
        <View className="flex-row gap-3">
          <Input
            className="flex-1"
            value={form.ageValue}
            onChangeText={(value) =>
              update("ageValue", value.replace(/[^0-9]/g, ""))
            }
            placeholder="0"
            keyboardType="number-pad"
            invalid={Boolean(errors.ageValue)}
          />
          {ageUnitOptions.length > 1 ? (
            <View className="w-[44%]">
              <SegmentedControl
                options={ageUnitOptions}
                value={form.ageUnit}
                onChange={(value) => update("ageUnit", value)}
              />
            </View>
          ) : null}
        </View>
      </FormField>
    </View>
  );
}

function ContactStep({ patientType, form, errors, update }: StepProps) {
  return (
    <View className="gap-5">
      <StepHeading
        title="Household & contact"
        description="Add details the CHW can use for follow-up."
      />
      <FormField
        label="Community / village"
        required
        error={errors.community}
        hint="Search Northern Ghana towns and villages"
      >
        <PlacesAutocomplete
          value={form.community}
          onChangeText={(value) => update("community", value)}
          placeholder="e.g. Zuo, Sakasaka, Bolgatanga"
          invalid={Boolean(errors.community)}
        />
      </FormField>
      {patientType === "MATERNAL" ? (
        <FormField label="Phone number" hint="Optional — used for follow-up">
          <Input
            value={form.phone}
            onChangeText={(value) => update("phone", value)}
            placeholder="+233…"
            keyboardType="phone-pad"
          />
        </FormField>
      ) : (
        <>
          <FormField
            label="Mother / caregiver name"
            required
            error={errors.caregiverName}
          >
            <Input
              value={form.caregiverName}
              onChangeText={(value) => update("caregiverName", value)}
              placeholder="Primary caregiver"
              autoCapitalize="words"
              invalid={Boolean(errors.caregiverName)}
            />
          </FormField>
          <FormField
            label="Caregiver phone"
            hint="Optional — used for referral follow-up"
          >
            <Input
              value={form.caregiverPhone}
              onChangeText={(value) => update("caregiverPhone", value)}
              placeholder="+233…"
              keyboardType="phone-pad"
            />
          </FormField>
        </>
      )}
    </View>
  );
}

function VisitStep({ patientType, form, errors, update }: StepProps) {
  return (
    <View className="gap-5">
      <StepHeading
        title="Visit context"
        description="Add clinical context and confirm consent."
      />
      {patientType === "MATERNAL" ? (
        <FormField
          label="Visit status"
          required
          error={errors.maternalStatus}
        >
          <SegmentedControl
            options={[
              { value: "PREGNANT", label: "Pregnant" },
              { value: "POSTPARTUM", label: "Postpartum" },
            ]}
            value={form.maternalStatus}
            onChange={(value) => update("maternalStatus", value)}
            invalid={Boolean(errors.maternalStatus)}
          />
        </FormField>
      ) : null}
      {patientType === "MATERNAL" &&
      form.maternalStatus === "PREGNANT" ? (
        <FormField
          label="Gestational age (weeks)"
          error={errors.gestationalWeeks}
          hint="Optional if unknown — estimate is fine"
        >
          <Input
            value={form.gestationalWeeks}
            onChangeText={(value) =>
              update("gestationalWeeks", value.replace(/[^0-9]/g, ""))
            }
            placeholder="e.g. 28"
            keyboardType="number-pad"
            invalid={Boolean(errors.gestationalWeeks)}
          />
        </FormField>
      ) : null}
      <FormField label="Visit notes" hint="Optional">
        <Input
          value={form.notes}
          onChangeText={(value) => update("notes", value)}
          placeholder="Symptoms reported, household context…"
          multiline
          className="h-28 py-3"
          textAlignVertical="top"
        />
      </FormField>
      <Pressable
        className="flex-row items-start gap-3 border-2 border-indigo-ink/20 bg-muted p-4"
        onPress={() => update("consent", !form.consent)}
      >
        <View
          className={`mt-0.5 size-6 items-center justify-center border-2 border-indigo-ink ${
            form.consent ? "bg-indigo-ink" : "bg-shea"
          }`}
        >
          {form.consent ? (
            <MaterialIcons name="check" size={16} color={colors.shea} />
          ) : null}
        </View>
        <View className="flex-1">
          <Text className="font-body-bold text-sm text-indigo-ink">
            Verbal consent obtained
          </Text>
          <Text className="mt-1 font-body text-sm leading-5 text-muted-foreground">
            Patient or caregiver agreed to this visit record and assessment.
          </Text>
          {errors.consent ? (
            <Text className="mt-2 text-sm text-ember">{errors.consent}</Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function ConfirmStep({
  patientType,
  form,
}: {
  patientType: PatientType;
  form: FormState;
}) {
  return (
    <View className="gap-5">
      <StepHeading
        title="Confirm patient"
        description="Check the record before starting the assessment."
      />
      <View className="border-2 border-indigo-ink">
        <SummaryRow label="Visit type" value={patientTypeLabel(patientType)} />
        <SummaryRow label="Patient" value={form.patientName.trim()} />
        <SummaryRow
          label="Sex"
          value={form.patientSex === "FEMALE" ? "Female" : "Male"}
        />
        <SummaryRow
          label="Age"
          value={formatAge(Number(form.ageValue), form.ageUnit) ?? "—"}
        />
        <SummaryRow label="Community" value={form.community.trim()} />
        {form.maternalStatus ? (
          <SummaryRow
            label="Status"
            value={
              form.maternalStatus === "PREGNANT"
                ? `Pregnant${
                    form.gestationalWeeks
                      ? ` · ${form.gestationalWeeks} weeks`
                      : ""
                  }`
                : "Postpartum"
            }
          />
        ) : null}
        {form.caregiverName ? (
          <SummaryRow label="Caregiver" value={form.caregiverName.trim()} />
        ) : null}
        <SummaryRow label="Consent" value="Verbal · recorded" last />
      </View>
    </View>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <View className="mb-6 flex-row gap-2">
      {STEPS.map((label, index) => {
        const number = (index + 1) as Step;
        return (
          <View key={label} className="flex-1">
            <View
              className={`mb-2 h-1 ${
                number <= step ? "bg-clay" : "bg-indigo-ink/15"
              }`}
            />
            <Text
              className={`font-utility text-[9px] uppercase tracking-wider ${
                number === step ? "text-clay" : "text-muted-foreground"
              }`}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row gap-4 px-4 py-3.5 ${
        last ? "" : "border-b border-indigo-ink/10"
      }`}
    >
      <Text className="w-24 font-utility text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <Text className="flex-1 text-indigo-ink">{value}</Text>
    </View>
  );
}
