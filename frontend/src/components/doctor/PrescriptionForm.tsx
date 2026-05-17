"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { extractErrorMessage } from "@/services/api";
import { prescriptionService } from "@/services/prescription.service";
import type { PrescriptionRoute } from "@/types/api";

const ROUTES: PrescriptionRoute[] = ["ORAL", "INJECTION", "TOPICAL", "INHALED", "IV", "IM", "SC"];

const schema = z.object({
  medicationName: z.string().min(1, "Required").max(255),
  dosage: z.string().min(1, "Required").max(100),
  frequency: z.string().min(1, "Required").max(100),
  durationDays: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  route: z.enum(["ORAL", "INJECTION", "TOPICAL", "INHALED", "IV", "IM", "SC"]).optional(),
  refillsAllowed: z.coerce.number().int().min(0).max(12).optional(),
  startDate: z.string().min(1, "Required"),
  instructions: z.string().max(4000).optional(),
});

type FormData = z.infer<typeof schema>;

interface PrescriptionFormProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  patientAllergies?: string | null;
}

export function PrescriptionForm({
  open,
  onClose,
  patientId,
  patientName,
  patientAllergies,
}: PrescriptionFormProps) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      route: "ORAL",
      refillsAllowed: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      prescriptionService.issue({
        patientId,
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        durationDays: data.durationDays,
        quantity: data.quantity,
        route: data.route,
        instructions: data.instructions || undefined,
        startDate: data.startDate,
        refillsAllowed: data.refillsAllowed ?? 0,
      }),
    onSuccess: () => {
      toast.success("Prescription issued");
      qc.invalidateQueries({ queryKey: ["patient", patientId, "prescriptions"] });
      handleClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const hasAllergies =
    !!patientAllergies && patientAllergies.toLowerCase() !== "none known" && patientAllergies !== "—";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Issue prescription"
      description={`Patient: ${patientName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            loading={mutation.isPending}
          >
            Issue prescription
          </Button>
        </>
      }
    >
      {hasAllergies && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Patient allergies on file</p>
            <p className="text-amber-700">{patientAllergies}</p>
          </div>
        </div>
      )}

      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <div className="md:col-span-2">
          <Input
            label="Medication"
            placeholder="e.g. Amlodipine"
            {...register("medicationName")}
            error={errors.medicationName?.message}
          />
        </div>
        <Input
          label="Dosage"
          placeholder="5 mg"
          {...register("dosage")}
          error={errors.dosage?.message}
        />
        <Input
          label="Frequency"
          placeholder="Once daily"
          {...register("frequency")}
          error={errors.frequency?.message}
        />
        <Input
          label="Duration (days)"
          type="number"
          {...register("durationDays")}
          error={errors.durationDays?.message}
        />
        <Input
          label="Quantity"
          type="number"
          {...register("quantity")}
          error={errors.quantity?.message}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Route</label>
          <select
            {...register("route")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            {ROUTES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Refills allowed"
          type="number"
          min={0}
          max={12}
          {...register("refillsAllowed")}
          error={errors.refillsAllowed?.message}
        />

        <Input
          label="Start date"
          type="date"
          {...register("startDate")}
          error={errors.startDate?.message}
        />

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Special instructions
          </label>
          <textarea
            {...register("instructions")}
            rows={3}
            placeholder="Take with food. Avoid grapefruit. Complete full course."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
      </form>
    </Modal>
  );
}
