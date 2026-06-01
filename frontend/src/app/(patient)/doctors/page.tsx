"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, Building2, Calendar, Filter, MapPin, Stethoscope, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { StarRating } from "@/components/common/StarRating";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { Spinner } from "@/components/common/Spinner";
import { BookAppointmentWizard } from "@/components/patient/BookAppointmentWizard";
import { doctorService } from "@/services/doctor.service";
import { hospitalService } from "@/services/hospital.service";
import { usePatientProfile } from "@/hooks/usePatient";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { initials } from "@/utils/format";
import { PROCEDURES, parseDoctorProcedures } from "@/utils/procedures";
import type { DoctorResponse, HospitalResponse } from "@/types/api";

const HospitalsMap = dynamic(() => import("@/components/patient/HospitalsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[500px] items-center justify-center bg-slate-100">
      <Spinner className="h-6 w-6" />
    </div>
  ),
});

const SPECIALTIES = [
  "Cardiology", "Dermatology", "Family Medicine", "General Practice",
  "Internal Medicine", "Neurology", "Pediatrics", "Orthopedics",
  "Gynecology", "Psychiatry", "Urology",
];

type SortKey = "rating" | "experience" | "name";

export default function DoctorsPage() {
  const t = useT();
  const dp = t.doctorsPage;
  const [specialty, setSpecialty]             = useState<string | null>(null);
  const [procedure, setProcedure]             = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
  const [search, setSearch]                   = useState("");
  const [sort, setSort]                       = useState<SortKey>("rating");
  const [bookDoctor, setBookDoctor]           = useState<DoctorResponse | null>(null);

  const profile = usePatientProfile();

  const hospitalsQuery = useQuery({
    queryKey: ["hospitals", "active"],
    queryFn: () => hospitalService.listActive(),
  });

  const doctorsQuery = useQuery({
    queryKey: ["doctors", "all"],
    queryFn: () => doctorService.search({ size: 100 }),
  });

  const hospitals  = useMemo<HospitalResponse[]>(() => hospitalsQuery.data ?? [], [hospitalsQuery.data]);
  const allDoctors = useMemo<DoctorResponse[]>(() => doctorsQuery.data?.content ?? [], [doctorsQuery.data]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = allDoctors.filter((d) => {
      if (specialty && d.specialization !== specialty) return false;
      if (selectedHospitalId !== null && d.hospitalId !== selectedHospitalId) return false;
      if (procedure && !parseDoctorProcedures(d.subSpecialization).some(
        (p) => p.toLowerCase() === procedure.toLowerCase())) return false;
      if (q) {
        const hay = `${d.firstName} ${d.lastName} ${d.specialization} ${d.hospitalName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "rating")     return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (sort === "experience") return (b.experienceYears ?? 0) - (a.experienceYears ?? 0);
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });

    return list;
  }, [allDoctors, specialty, procedure, selectedHospitalId, search, sort]);

  const matchingHospitalIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    const ids = new Set<number>();
    allDoctors.forEach((d) => {
      if (specialty && d.specialization !== specialty) return;
      if (procedure && !parseDoctorProcedures(d.subSpecialization).some(
        (p) => p.toLowerCase() === procedure.toLowerCase())) return;
      if (q) {
        const hay = `${d.firstName} ${d.lastName} ${d.specialization} ${d.hospitalName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return;
      }
      if (d.hospitalId != null) ids.add(d.hospitalId);
    });
    return ids;
  }, [allDoctors, specialty, procedure, search]);

  const doctorCountByHospital = useMemo(() => {
    const m = new Map<number, number>();
    allDoctors.forEach((d) => {
      if (specialty && d.specialization !== specialty) return;
      if (procedure && !parseDoctorProcedures(d.subSpecialization).some(
        (p) => p.toLowerCase() === procedure.toLowerCase())) return;
      if (d.hospitalId == null) return;
      m.set(d.hospitalId, (m.get(d.hospitalId) ?? 0) + 1);
    });
    return m;
  }, [allDoctors, specialty, procedure]);

  const anyFilter = !!specialty || !!procedure || selectedHospitalId !== null || !!search;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{dp.title}</h1>
        <p className="text-sm text-slate-500">{dp.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr_340px]">

        {/* Filters */}
        <Card className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Filter className="h-4 w-4" /> {dp.filters}
            </div>
            {anyFilter && (
              <button
                type="button"
                onClick={() => { setSpecialty(null); setProcedure(null); setSelectedHospitalId(null); setSearch(""); }}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" /> {dp.clearFilters}
              </button>
            )}
          </div>

          <div className="mt-4">
            <Input
              label={t.common.search}
              placeholder={dp.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <FilterGroup icon={Stethoscope} title={dp.specialtyFilter}>
            {SPECIALTIES.map((s) => (
              <Pill key={s} active={specialty === s} onClick={() => setSpecialty(specialty === s ? null : s)}>
                {t.specialties[s] ?? s}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup icon={MapPin} title={dp.procedureFilter}>
            {PROCEDURES.slice(0, 18).map((p) => (
              <Pill key={p} active={procedure === p} onClick={() => setProcedure(procedure === p ? null : p)}>
                {p}
              </Pill>
            ))}
          </FilterGroup>

          <FilterGroup icon={Building2} title={dp.hospitalFilter}>
            {hospitalsQuery.isLoading ? (
              <Skeleton className="h-10" />
            ) : (
              hospitals.map((h) => (
                <Pill
                  key={h.id}
                  active={selectedHospitalId === h.id}
                  onClick={() => setSelectedHospitalId(selectedHospitalId === h.id ? null : h.id)}
                >
                  {h.name}
                  <span className="ml-1 text-[10px] opacity-70">· {h.city}</span>
                </Pill>
              ))
            )}
          </FilterGroup>
        </Card>

        {/* Map */}
        <Card padded={false} className="overflow-hidden">
          <div className="isolate h-[calc(100vh-180px)] min-h-[500px] w-full">
            <HospitalsMap
              hospitals={hospitals}
              matchingHospitalIds={matchingHospitalIds}
              selectedHospitalId={selectedHospitalId}
              onSelectHospital={(id) => setSelectedHospitalId(selectedHospitalId === id ? null : id)}
              doctorCountByHospital={doctorCountByHospital}
            />
          </div>
        </Card>

        {/* Results */}
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
          {/* Header + sort */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {filteredDoctors.length} {filteredDoctors.length === 1 ? dp.doctorSingular : dp.doctorPlural}
            </h2>
            <div className="flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              {(["rating", "experience", "name"] as SortKey[]).map((key) => {
                const labels: Record<SortKey, string> = {
                  rating: dp.sortRating,
                  experience: dp.sortExperience,
                  name: dp.sortName,
                };
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                      sort === key ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    {labels[key]}
                  </button>
                );
              })}
            </div>
          </div>

          {doctorsQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}
            </div>
          ) : filteredDoctors.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title={dp.noResults}
              description={dp.noResultsDesc}
            />
          ) : (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            >
              {filteredDoctors.map((d) => (
                <motion.div
                  key={d.id}
                  variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } }}
                >
                  <DoctorCard
                    doctor={d}
                    highlightProcedure={procedure}
                    canBook={!!profile.data}
                    onBook={() => setBookDoctor(d)}
                    onLocate={() => { if (d.hospitalId != null) setSelectedHospitalId(d.hospitalId); }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {profile.data && (
        <BookAppointmentWizard
          open={!!bookDoctor}
          onClose={() => setBookDoctor(null)}
          patientId={profile.data.id}
          initialDoctor={bookDoctor ?? undefined}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FilterGroup({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
        active
          ? "border-brand-500 bg-brand-500 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50",
      )}
    >
      {children}
    </button>
  );
}

function DoctorCard({
  doctor, highlightProcedure, canBook, onBook, onLocate,
}: {
  doctor: DoctorResponse;
  highlightProcedure: string | null;
  canBook: boolean;
  onBook: () => void;
  onLocate: () => void;
}) {
  const t = useT();
  const procedures = parseDoctorProcedures(doctor.subSpecialization);
  return (
    <Card hover>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {initials(doctor.firstName, doctor.lastName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">Dr. {doctor.firstName} {doctor.lastName}</p>
          <p className="text-xs font-medium text-brand-600">
            {t.specialties[doctor.specialization] ?? doctor.specialization}
          </p>
          {doctor.hospitalName && (
            <button type="button" onClick={onLocate} className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 hover:text-brand-600 transition-colors">
              <MapPin className="h-3 w-3 shrink-0" />
              {doctor.hospitalName}{doctor.hospitalCity ? ` · ${doctor.hospitalCity}` : ""}
            </button>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {doctor.ratingCount > 0 && (
              <div className="flex items-center gap-1">
                <StarRating value={Math.round(doctor.averageRating ?? 0)} readonly size="sm" />
                <span className="text-xs text-slate-500">{doctor.averageRating?.toFixed(1)} ({doctor.ratingCount})</span>
              </div>
            )}
            {doctor.consultationFee != null && (
              <span className="text-xs text-slate-400">{doctor.consultationFee} ден.</span>
            )}
          </div>
          {procedures.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {procedures.slice(0, 4).map((p) => (
                <Badge key={p} tone={highlightProcedure && p.toLowerCase() === highlightProcedure.toLowerCase() ? "info" : "neutral"}>
                  {p}
                </Badge>
              ))}
              {procedures.length > 4 && <span className="text-[10px] text-slate-400">+{procedures.length - 4}</span>}
            </div>
          )}
        </div>
      </div>
      {canBook && (
        <button
          type="button"
          onClick={onBook}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Calendar className="h-3.5 w-3.5" />
          {t.doctorsPage.bookBtn}
        </button>
      )}
    </Card>
  );
}
