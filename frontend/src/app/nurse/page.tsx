"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User } from "lucide-react";
import { Skeleton } from "@/components/common/Skeleton";
import { doctorService } from "@/services/doctor.service";
import { patientService } from "@/services/patient.service";
import Link from "next/link";

export default function NurseDashboard() {
  const [search, setSearch] = useState("");

  const doctors = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorService.search(),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Портал — Медицинска сестра</h1>
        <p className="mt-1 text-sm text-slate-500">
          Пребарај пациенти и прегледај информации.
        </p>
      </div>

      {/* Patient search */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Пребарај пациент</h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Внеси ime или презиме…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Пребарувањето по пациент е достапно преку лекарскиот систем. Контактирај го одговорниот лекар за детали.
        </p>
      </section>

      {/* Doctors on duty */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-800">Лекари на дежурство</h2>
        {doctors.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {doctors.data?.content.slice(0, 10).map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    д-р {doc.firstName} {doc.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{doc.specialization}</p>
                </div>
                <span className="text-xs text-slate-400">{doc.officeNumber ?? "—"}</span>
              </div>
            ))}
            {doctors.data?.content.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Нема достапни лекари.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
