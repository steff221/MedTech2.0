// Страница (Next.js): пациенти — дел за доктор.
"use client";

import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PageBanner } from "@/components/layout/PageBanner";
import { PatientsListPanel } from "@/components/doctor/PatientsListPanel";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { Users } from "lucide-react";

export default function DoctorPatientsPage() {
  const profile = useDoctorProfile();

  return (
    <>
      <PageBanner
        title="Пациенти"
        breadcrumb={[{ label: "Пациенти" }]}
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        {profile.isLoading ? (
          <Skeleton className="h-64" />
        ) : profile.data === null ? (
          <EmptyState
            icon={Users}
            title="Прво поставете го клиничкиот профил"
            description="Завршете го онбордингот пред да го прегледате панелот со пациенти."
          />
        ) : profile.data ? (
          <PatientsListPanel doctorId={profile.data.id} />
        ) : null}
      </div>
    </>
  );
}
