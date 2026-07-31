// Страница (Next.js): почетен дел за медицинска сестра.
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Calendar,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Phone,
  Printer,
  Search,
  Thermometer,
  User,
  Weight,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/common/Skeleton";
import { doctorService } from "@/services/doctor.service";
import { patientService } from "@/services/patient.service";
import { appointmentService } from "@/services/appointment.service";
import { hospitalService } from "@/services/hospital.service";
import { useT } from "@/hooks/useT";
import type { PatientResponse, AppointmentResponse } from "@/types/api";
import { format, parseISO } from "date-fns";

type Tab = "patients" | "today" | "doctors" | "vitals";

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED:   "bg-blue-50 text-blue-700",
  COMPLETED:   "bg-emerald-50 text-emerald-700",
  CANCELLED:   "bg-red-50 text-red-700",
  NO_SHOW:     "bg-amber-50 text-amber-700",
  RESCHEDULED: "bg-purple-50 text-purple-700",
};

// ── Vitals entry panel ────────────────────────────────────────────────────────
function VitalsTab() {
  const t = useT();
  const n = t.nurse;
  const [search, setSearch]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);
  const [form, setForm] = useState({ bloodPressure: "", heartRate: "", temperature: "", weight: "", height: "", notes: "" });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const patients = useQuery({
    queryKey: ["nurse-vitals-patients", debouncedSearch],
    queryFn: () => patientService.search(debouncedSearch, 0, 10),
  });

  function printVitals() {
    if (!selectedPatient) return;
    const now = format(new Date(), "dd.MM.yyyy HH:mm");
    const win = window.open("", "_blank", "width=700,height=600");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/><title>Витали · ${selectedPatient.firstName} ${selectedPatient.lastName}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;max-width:600px;margin:0 auto}
        h1{font-size:20px;margin-bottom:4px}
        .sub{color:#64748b;font-size:13px;margin-bottom:28px}
        table{width:100%;border-collapse:collapse}
        th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;padding:8px 12px;border-bottom:2px solid #e2e8f0}
        td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px}
        .label{font-weight:600;color:#334155;width:160px}
        .footer{margin-top:32px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between}
        @media print{body{padding:20px}}
      </style>
    </head><body>
      <h1>Лист на витали</h1>
      <p class="sub">Пациент: <strong>${selectedPatient.firstName} ${selectedPatient.lastName}</strong> &nbsp;·&nbsp; ${now}</p>
      <table>
        <thead><tr><th>Параметар</th><th>Вредност</th><th>Референтни вредности</th></tr></thead>
        <tbody>
          ${form.bloodPressure ? `<tr><td class="label">${n.bloodPressure}</td><td>${form.bloodPressure} mmHg</td><td>90/60 – 120/80 mmHg</td></tr>` : ""}
          ${form.heartRate ? `<tr><td class="label">${n.pulse}</td><td>${form.heartRate} bpm</td><td>60 – 100 bpm</td></tr>` : ""}
          ${form.temperature ? `<tr><td class="label">${n.temperature}</td><td>${form.temperature} °C</td><td>36.1 – 37.2 °C</td></tr>` : ""}
          ${form.weight ? `<tr><td class="label">${n.weight}</td><td>${form.weight} kg</td><td>—</td></tr>` : ""}
          ${form.height ? `<tr><td class="label">${n.height}</td><td>${form.height} cm</td><td>—</td></tr>` : ""}
          ${form.notes ? `<tr><td class="label">${n.notes}</td><td colspan="2">${form.notes}</td></tr>` : ""}
        </tbody>
      </table>
      <div class="footer">
        <span>Медицинска сестра: ________________________</span>
        <span>МедТех 2.0 &nbsp;·&nbsp; ${now}</span>
      </div>
      <script>window.onload=()=>{window.print();window.close()}</script>
    </body></html>`);
    win.document.close();
  }

  function inputField(label: string, key: keyof typeof form, placeholder: string, icon: React.ReactNode, unit?: string) {
    return (
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
            <input
              type={key === "bloodPressure" || key === "notes" ? "text" : "number"}
              step="any"
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>
          {unit && <span className="w-10 text-xs text-slate-400">{unit}</span>}
        </div>
      </div>
    );
  }

  const hasAnyValue = Object.values(form).some((v) => v.trim() !== "");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Patient picker */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
          <User className="h-4 w-4 text-emerald-500" /> {n.selectPatient}
        </h2>
        {selectedPatient ? (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName}</p>
              <p className="text-xs text-slate-500">{selectedPatient.email}</p>
            </div>
            <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={n.searchPlaceholder}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <div className="divide-y divide-slate-100">
              {patients.isLoading && [0, 1, 2].map(i => <Skeleton key={i} className="mb-2 h-12" />)}
              {!patients.isLoading && patients.data?.content.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">{n.noPatientsFound}</p>
              )}
              {patients.data?.content.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{p.firstName} {p.lastName}</p>
                    <p className="truncate text-xs text-slate-500">{p.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Vitals form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-800">
          <Activity className="h-4 w-4 text-emerald-500" /> {n.enterVitals}
        </h2>
        <p className="mb-4 text-xs text-slate-400">{n.vitalsSubtitle}</p>
        {!selectedPatient ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            {n.selectPatientFirst}
          </div>
        ) : (
          <div className="space-y-3">
            {inputField(n.bloodPressure, "bloodPressure", "120/80", <Heart className="h-3.5 w-3.5" />, "mmHg")}
            {inputField(n.pulse, "heartRate", "72", <Activity className="h-3.5 w-3.5" />, "bpm")}
            {inputField(n.temperature, "temperature", "36.6", <Thermometer className="h-3.5 w-3.5" />, "°C")}
            {inputField(n.weight, "weight", "70", <Weight className="h-3.5 w-3.5" />, "kg")}
            {inputField(n.height, "height", "175", <User className="h-3.5 w-3.5" />, "cm")}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">{n.notes}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={n.notesPlaceholder}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
            <button
              type="button"
              disabled={!hasAnyValue}
              onClick={printVitals}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              <Printer className="h-4 w-4" /> {n.printVitalsBtn}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PatientPanel({ patient, onClose }: { patient: PatientResponse; onClose: () => void }) {
  const t = useT();
  const n = t.nurse;

  const STATUS_LABEL: Record<string, string> = {
    SCHEDULED:   n.statusScheduled,
    COMPLETED:   n.statusCompleted,
    CANCELLED:   n.statusCancelled,
    NO_SHOW:     n.statusNoShow,
    RESCHEDULED: n.statusRescheduled,
  };

  const appts = useQuery({
    queryKey: ["patient-appts", patient.id],
    queryFn: () => patientService.appointments(patient.id, 0, 5),
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</p>
            <p className="text-xs text-slate-500">{patient.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {patient.dateOfBirth && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">{n.dateOfBirth}</p>
              <p className="mt-0.5 font-medium text-slate-800">{format(parseISO(patient.dateOfBirth), "dd.MM.yyyy")}</p>
            </div>
          )}
          {patient.bloodType && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5">
                <Heart className="h-3 w-3 text-red-400" />
                <p className="text-xs text-slate-400">{n.bloodType}</p>
              </div>
              <p className="mt-0.5 font-medium text-slate-800">
                {patient.bloodType.replace("_POS", "+").replace("_NEG", "−")}
              </p>
            </div>
          )}
          {patient.phoneNumber && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-slate-400" />
                <p className="text-xs text-slate-400">{n.phone}</p>
              </div>
              <p className="mt-0.5 font-medium text-slate-800">{patient.phoneNumber}</p>
            </div>
          )}
          {patient.city && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-slate-400" />
                <p className="text-xs text-slate-400">{n.city}</p>
              </div>
              <p className="mt-0.5 font-medium text-slate-800">{patient.city}</p>
            </div>
          )}
        </div>

        {(patient.allergies || patient.chronicConditions) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">{n.clinicalNotes}</p>
            </div>
            {patient.allergies && (
              <div>
                <p className="text-xs text-amber-600 font-medium">{n.allergies}</p>
                <p className="text-sm text-amber-800">{patient.allergies}</p>
              </div>
            )}
            {patient.chronicConditions && (
              <div>
                <p className="text-xs text-amber-600 font-medium">{n.chronicConditions}</p>
                <p className="text-sm text-amber-800">{patient.chronicConditions}</p>
              </div>
            )}
          </div>
        )}

        {patient.insuranceProvider && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-xs text-slate-400">{n.insurance}</p>
            <p className="mt-0.5 font-medium text-slate-800">
              {patient.insuranceProvider}
              {patient.insuranceNumber && <span className="ml-2 text-slate-500">#{patient.insuranceNumber}</span>}
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{n.recentAppointments}</p>
          {appts.isLoading ? (
            <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : appts.data?.content.length === 0 ? (
            <p className="text-sm text-slate-400">{n.noAppointments}</p>
          ) : (
            <div className="space-y-2">
              {appts.data?.content.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.doctorName}</p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(a.appointmentDate), "dd.MM.yyyy")} · {a.appointmentTime}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {patient.emergencyContact && (
          <div className="rounded-lg bg-red-50 p-3 text-sm">
            <p className="text-xs font-medium text-red-500">{n.emergencyContact}</p>
            <p className="mt-0.5 font-medium text-slate-800">{patient.emergencyContact}</p>
            {patient.emergencyPhone && <p className="text-slate-600">{patient.emergencyPhone}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentRow({ a, statusLabel }: { a: AppointmentResponse; statusLabel: Record<string, string> }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-14 text-right">
        <p className="text-sm font-semibold tabular-nums text-slate-800">{a.appointmentTime}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{a.patientName}</p>
        <p className="truncate text-xs text-slate-500">
          {a.doctorName}{a.doctorSpecialization ? ` · ${a.doctorSpecialization}` : ""}
        </p>
      </div>
      {a.hospitalName && <p className="hidden text-xs text-slate-400 md:block">{a.hospitalName}</p>}
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}>
        {statusLabel[a.status] ?? a.status}
      </span>
    </div>
  );
}

export default function NurseDashboard() {
  const t = useT();
  const n = t.nurse;

  const STATUS_LABEL: Record<string, string> = {
    SCHEDULED:   n.statusScheduled,
    COMPLETED:   n.statusCompleted,
    CANCELLED:   n.statusCancelled,
    NO_SHOW:     n.statusNoShow,
    RESCHEDULED: n.statusRescheduled,
  };

  const [tab, setTab]                         = useState<Tab>("patients");
  const [search, setSearch]                   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | undefined>(undefined);
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const hospitals  = useQuery({ queryKey: ["hospitals-active"],  queryFn: () => hospitalService.listActive() });
  const patients   = useQuery({
    queryKey: ["nurse-patients", debouncedSearch, selectedHospitalId],
    queryFn:  () => patientService.search(debouncedSearch, 0, 20, selectedHospitalId),
  });
  const todayAppts = useQuery({
    queryKey: ["appointments-today"],
    queryFn:  () => appointmentService.today(),
    refetchInterval: 60_000,
  });
  const doctors = useQuery({ queryKey: ["doctors"], queryFn: () => doctorService.search() });

  const tabs: { id: Tab; label: string }[] = [
    { id: "patients", label: n.tabPatients },
    { id: "today",    label: n.tabToday    },
    { id: "doctors",  label: n.tabDoctors  },
    { id: "vitals",   label: n.tabVitals   },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{n.portalTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">{n.portalSubtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === tb.id
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {/* Patients tab */}
      {tab === "patients" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">{n.searchPatientTitle}</h2>
            <select
              value={selectedHospitalId ?? ""}
              onChange={(e) => setSelectedHospitalId(e.target.value ? Number(e.target.value) : undefined)}
              className="mb-3 w-full rounded-lg border border-slate-200 py-2.5 px-3 text-sm text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            >
              <option value="">{n.allHospitals}</option>
              {hospitals.data?.map((h) => (
                <option key={h.id} value={h.id}>{h.name}, {h.city}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={n.searchNamePlaceholder}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {patients.isLoading && (
                <div className="space-y-3 pt-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
              )}
              {patients.data?.content.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50 transition-colors rounded-lg px-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{p.firstName} {p.lastName}</p>
                    <p className="truncate text-xs text-slate-500">{p.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
              {!patients.isLoading && patients.data?.content.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  {n.noPatientsFound}
                </p>
              )}
            </div>
          </div>

          <div className="min-h-[400px]">
            {selectedPatient ? (
              <PatientPanel patient={selectedPatient} onClose={() => setSelectedPatient(null)} />
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
                <div className="text-center">
                  <User className="mx-auto h-10 w-10 text-slate-200" />
                  <p className="mt-2 text-sm text-slate-400">{n.selectPatientDetail}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today tab */}
      {tab === "today" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
            <Calendar className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-slate-800">
              {n.todayTitle}, {format(new Date(), "dd.MM.yyyy")}
            </h2>
            {todayAppts.data && (
              <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {todayAppts.data.length} {n.total}
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100 px-6">
            {todayAppts.isLoading && (
              <div className="space-y-3 py-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            )}
            {todayAppts.data?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12">
                <Clock className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">{n.noAppointmentsToday}</p>
              </div>
            )}
            {todayAppts.data?.map((a) => (
              <AppointmentRow key={a.id} a={a} statusLabel={STATUS_LABEL} />
            ))}
          </div>
        </div>
      )}

      {/* Vitals tab */}
      {tab === "vitals" && <VitalsTab />}

      {/* Doctors tab */}
      {tab === "doctors" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">{n.doctorsOnDuty}</h2>
          {doctors.isLoading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {doctors.data?.content.slice(0, 20).map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      д-р {doc.firstName} {doc.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {doc.specialization}{doc.hospitalName ? ` · ${doc.hospitalName}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">{doc.officeNumber ?? "—"}</span>
                </div>
              ))}
              {doctors.data?.content.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">{n.noDoctors}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
