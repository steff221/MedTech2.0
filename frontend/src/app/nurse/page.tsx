"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  User,
  Calendar,
  Clock,
  ChevronRight,
  X,
  Phone,
  MapPin,
  Heart,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/common/Skeleton";
import { doctorService } from "@/services/doctor.service";
import { patientService } from "@/services/patient.service";
import { appointmentService } from "@/services/appointment.service";
import type { PatientResponse, AppointmentResponse } from "@/types/api";
import { format, parseISO } from "date-fns";

type Tab = "patients" | "today" | "doctors";

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  NO_SHOW: "bg-amber-50 text-amber-700",
  RESCHEDULED: "bg-purple-50 text-purple-700",
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Закажан",
  COMPLETED: "Завршен",
  CANCELLED: "Откажан",
  NO_SHOW: "Не се јавил",
  RESCHEDULED: "Преместен",
};

function PatientPanel({
  patient,
  onClose,
}: {
  patient: PatientResponse;
  onClose: () => void;
}) {
  const appts = useQuery({
    queryKey: ["patient-appts", patient.id],
    queryFn: () => patientService.appointments(patient.id, 0, 5),
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {patient.firstName} {patient.lastName}
            </p>
            <p className="text-xs text-slate-500">{patient.email}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Demographics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {patient.dateOfBirth && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">Датум на раѓање</p>
              <p className="mt-0.5 font-medium text-slate-800">
                {format(parseISO(patient.dateOfBirth), "dd.MM.yyyy")}
              </p>
            </div>
          )}
          {patient.bloodType && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5">
                <Heart className="h-3 w-3 text-red-400" />
                <p className="text-xs text-slate-400">Крвна група</p>
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
                <p className="text-xs text-slate-400">Телефон</p>
              </div>
              <p className="mt-0.5 font-medium text-slate-800">
                {patient.phoneNumber}
              </p>
            </div>
          )}
          {patient.city && (
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-slate-400" />
                <p className="text-xs text-slate-400">Град</p>
              </div>
              <p className="mt-0.5 font-medium text-slate-800">{patient.city}</p>
            </div>
          )}
        </div>

        {/* Alerts */}
        {(patient.allergies || patient.chronicConditions) && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">
                Клинички напомени
              </p>
            </div>
            {patient.allergies && (
              <div>
                <p className="text-xs text-amber-600 font-medium">Алергии</p>
                <p className="text-sm text-amber-800">{patient.allergies}</p>
              </div>
            )}
            {patient.chronicConditions && (
              <div>
                <p className="text-xs text-amber-600 font-medium">
                  Хронични состојби
                </p>
                <p className="text-sm text-amber-800">
                  {patient.chronicConditions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Insurance */}
        {patient.insuranceProvider && (
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="text-xs text-slate-400">Осигурување</p>
            <p className="mt-0.5 font-medium text-slate-800">
              {patient.insuranceProvider}
              {patient.insuranceNumber && (
                <span className="ml-2 text-slate-500">
                  #{patient.insuranceNumber}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Recent appointments */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Последни термини
          </p>
          {appts.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : appts.data?.content.length === 0 ? (
            <p className="text-sm text-slate-400">Нема термини.</p>
          ) : (
            <div className="space-y-2">
              {appts.data?.content.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {a.doctorName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(a.appointmentDate), "dd.MM.yyyy")} •{" "}
                      {a.appointmentTime}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency contact */}
        {patient.emergencyContact && (
          <div className="rounded-lg bg-red-50 p-3 text-sm">
            <p className="text-xs font-medium text-red-500">
              Контакт во итен случај
            </p>
            <p className="mt-0.5 font-medium text-slate-800">
              {patient.emergencyContact}
            </p>
            {patient.emergencyPhone && (
              <p className="text-slate-600">{patient.emergencyPhone}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AppointmentRow({ a }: { a: AppointmentResponse }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-14 text-right">
        <p className="text-sm font-semibold tabular-nums text-slate-800">
          {a.appointmentTime}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">
          {a.patientName}
        </p>
        <p className="truncate text-xs text-slate-500">
          {a.doctorName}
          {a.doctorSpecialization ? ` · ${a.doctorSpecialization}` : ""}
        </p>
      </div>
      {a.hospitalName && (
        <p className="hidden text-xs text-slate-400 md:block">{a.hospitalName}</p>
      )}
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[a.status] ?? "bg-slate-100 text-slate-600"}`}
      >
        {STATUS_LABEL[a.status] ?? a.status}
      </span>
    </div>
  );
}

export default function NurseDashboard() {
  const [tab, setTab] = useState<Tab>("patients");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPatient, setSelectedPatient] =
    useState<PatientResponse | null>(null);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((handleSearchChange as any)._t);
    (handleSearchChange as any)._t = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const patients = useQuery({
    queryKey: ["nurse-patients", debouncedSearch],
    queryFn: () => patientService.search(debouncedSearch, 0, 20),
    enabled: debouncedSearch.length >= 2,
  });

  const todayAppts = useQuery({
    queryKey: ["appointments-today"],
    queryFn: () => appointmentService.today(),
    refetchInterval: 60_000,
  });

  const doctors = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorService.search(),
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: "patients", label: "Пациенти" },
    { id: "today", label: "Денес" },
    { id: "doctors", label: "Лекари" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Портал — Медицинска сестра
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Пребарај пациенти, прегледај денешни термини и лекари на дежурство.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Patients tab */}
      {tab === "patients" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Search panel */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-800">
              Пребарај пациент
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Внеси ime, презиме или e-mail…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {debouncedSearch.length < 2 && (
                <p className="py-6 text-center text-sm text-slate-400">
                  Внеси барем 2 карактери за пребарување.
                </p>
              )}
              {patients.isLoading && (
                <div className="space-y-3 pt-2">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
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
                    <p className="truncate text-sm font-medium text-slate-800">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500">{p.email}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
              {patients.data?.content.length === 0 &&
                debouncedSearch.length >= 2 && (
                  <p className="py-6 text-center text-sm text-slate-400">
                    Нема резултати за „{debouncedSearch}".
                  </p>
                )}
            </div>
          </div>

          {/* Patient detail */}
          <div className="min-h-[400px]">
            {selectedPatient ? (
              <PatientPanel
                patient={selectedPatient}
                onClose={() => setSelectedPatient(null)}
              />
            ) : (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
                <div className="text-center">
                  <User className="mx-auto h-10 w-10 text-slate-200" />
                  <p className="mt-2 text-sm text-slate-400">
                    Избери пациент за детали
                  </p>
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
              Денешни термини —{" "}
              {format(new Date(), "dd.MM.yyyy")}
            </h2>
            {todayAppts.data && (
              <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {todayAppts.data.length} вкупно
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100 px-6">
            {todayAppts.isLoading && (
              <div className="space-y-3 py-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            )}
            {todayAppts.data?.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12">
                <Clock className="h-8 w-8 text-slate-200" />
                <p className="text-sm text-slate-400">
                  Нема закажани термини денес.
                </p>
              </div>
            )}
            {todayAppts.data?.map((a) => (
              <AppointmentRow key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}

      {/* Doctors tab */}
      {tab === "doctors" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Лекари на дежурство
          </h2>
          {doctors.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
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
                      {doc.specialization}
                      {doc.hospitalName ? ` · ${doc.hospitalName}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {doc.officeNumber ?? "—"}
                  </span>
                </div>
              ))}
              {doctors.data?.content.length === 0 && (
                <p className="py-4 text-center text-sm text-slate-400">
                  Нема достапни лекари.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
