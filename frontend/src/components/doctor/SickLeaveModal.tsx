"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Mkb10Autocomplete } from "@/components/doctor/Mkb10Autocomplete";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

const schema = z.object({
  fromDate: z.string().min(1, "Задолжително"),
  toDate: z.string().min(1, "Задолжително"),
  reason: z.string().min(1, "Задолжително").max(300),
  notes: z.string().max(500).optional(),
  mkb10Code: z.string().optional(),
  mkb10Label: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface SickLeaveModalProps {
  open: boolean;
  onClose: () => void;
  patientName: string;
  patientDob?: string | null;
}

export function SickLeaveModal({ open, onClose, patientName, patientDob }: SickLeaveModalProps) {
  const { user } = useAuth();
  const t = useT();
  const today = format(new Date(), "yyyy-MM-dd");

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fromDate: today, toDate: today },
  });

  const fromDate = watch("fromDate");
  const toDate = watch("toDate");

  const handleClose = () => {
    reset();
    onClose();
  };

  const calcDays = () => {
    if (!fromDate || !toDate) return 1;
    const diff = Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / 86400000) + 1;
    return diff > 0 ? diff : 1;
  };

  const esc = (s: string | null | undefined) =>
    (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const onSubmit = (data: FormData) => {
    const doctorName = user ? `д-р ${user.firstName} ${user.lastName}` : "Доктор";
    const fromFmt = data.fromDate.split("-").reverse().join(".");
    const toFmt = data.toDate.split("-").reverse().join(".");
    const days = calcDays();
    const mkb10Code = (control._formValues as Record<string, string>).mkb10Code ?? "";

    const win = window.open("", "_blank", "width=820,height=700");
    if (!win) {
      toast.error(t.sickLeave.popupBlocked);
      return;
    }

    win.document.write(`<!DOCTYPE html><html><head><title>Болничко — ${esc(patientName)}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 48px; color: #1e293b; max-width: 700px; margin: auto; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 32px; }
  .brand { font-size: 20px; font-weight: bold; color: #10b981; } .brand-sub { font-size: 11px; color: #64748b; }
  .date-stamp { font-size: 12px; color: #64748b; text-align: right; }
  h1 { text-align: center; font-size: 18px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 32px; color: #0f172a; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .full { grid-column: 1/-1; }
  .lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
  .val { font-size: 14px; font-weight: 500; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; min-height: 28px; }
  .days-chip { display: inline-block; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; font-weight: bold; padding: 3px 12px; border-radius: 999px; font-size: 13px; margin-left: 8px; }
  .sigs { display: flex; justify-content: space-between; margin-top: 56px; }
  .sig { width: 200px; } .sig-line { border-bottom: 1px solid #334155; margin-bottom: 6px; margin-top: 36px; }
  .sig-lbl { font-size: 10px; color: #94a3b8; }
  .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 24px; } }
</style></head><body>
<div class="top">
  <div><div class="brand">MedTech</div><div class="brand-sub">Здравствен информациски систем</div></div>
  <div class="date-stamp">Датум на издавање: ${format(new Date(), "d.M.yyyy")}</div>
</div>
<h1>Потврда за привремена спреченост за работа</h1>
<div class="grid">
  <div><div class="lbl">Пациент</div><div class="val">${esc(patientName)}</div></div>
  <div><div class="lbl">Датум на раѓање</div><div class="val">${patientDob ? patientDob.split("-").reverse().join(".") : "—"}</div></div>
  <div><div class="lbl">Период на боледување</div><div class="val">${fromFmt} — ${toFmt} <span class="days-chip">${days} ${days === 1 ? "ден" : "дена"}</span></div></div>
  <div><div class="lbl">Лекар</div><div class="val">${esc(doctorName)}</div></div>
  <div class="full"><div class="lbl">Дијагноза / причина${mkb10Code ? ` (${esc(mkb10Code)})` : ""}</div><div class="val">${esc(data.reason)}</div></div>
  ${data.notes ? `<div class="full"><div class="lbl">Напомена за работодавач</div><div class="val">${esc(data.notes)}</div></div>` : ""}
</div>
<div class="sigs">
  <div class="sig"><div class="sig-line"></div><div class="sig-lbl">Потпис на пациентот</div></div>
  <div class="sig"><div class="sig-line"></div><div class="sig-lbl">Потпис и печат на доктор</div></div>
</div>
<div class="footer">
  <span>Издадено преку MedTech платформата</span>
  <span>Потврда за боледување · ${esc(patientName)}</span>
</div>
<script>window.onload = () => { window.print(); window.close(); }</script>
</body></html>`);
    win.document.close();
    toast.success(t.sickLeave.successToast);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t.sickLeave.title}
      description={`${t.doctorReferrals.newPatientLabel}: ${patientName}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>
            {t.sickLeave.generateBtn}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          label={t.sickLeave.fromDateLabel}
          type="date"
          {...register("fromDate")}
          error={errors.fromDate?.message}
        />
        <Input
          label={t.sickLeave.toDateLabel}
          type="date"
          {...register("toDate")}
          error={errors.toDate?.message}
        />

        {fromDate && toDate && new Date(toDate) >= new Date(fromDate) && (
          <div className="col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {t.sickLeave.durationLabel} <strong>{calcDays()} {calcDays() === 1 ? t.sickLeave.dayWord : t.sickLeave.daysWord}</strong>
          </div>
        )}

        <div className="col-span-2">
          <Controller
            name="mkb10Code"
            control={control}
            render={({ field }) => (
              <Mkb10Autocomplete
                label={t.sickLeave.mkb10Label}
                value={
                  field.value
                    ? { code: field.value, label: (control._formValues as Record<string, string>).mkb10Label ?? "" }
                    : null
                }
                onChange={(v) => {
                  field.onChange(v?.code ?? "");
                  (control._formValues as Record<string, string>).mkb10Label = v?.label ?? "";
                }}
              />
            )}
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t.sickLeave.reasonLabel}
          </label>
          <textarea
            {...register("reason")}
            rows={2}
            placeholder="пр. Акутна инфекција на горни дишни патишта, болки во грбот…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
          {errors.reason && <p className="mt-1 text-xs text-rose-600">{errors.reason.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t.sickLeave.notesLabel}
          </label>
          <textarea
            {...register("notes")}
            rows={2}
            placeholder="пр. Не смее да врши физичка работа…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      </form>
    </Modal>
  );
}
