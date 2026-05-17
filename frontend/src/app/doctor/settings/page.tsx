"use client";

import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorProfile } from "@/hooks/useDoctor";

export default function DoctorSettingsPage() {
  const { user } = useAuth();
  const profile = useDoctorProfile();

  const rows: Array<[string, string | number | null]> = [
    ["Име и презиме", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`],
    ["E-пошта", user?.email ?? "—"],
    ["Лиценцен бр.", profile.data?.licenseNumber ?? "—"],
    ["Специјалност", profile.data?.specialization ?? "—"],
    ["Квалификација", profile.data?.qualification ?? "—"],
    ["Искуство (години)", profile.data?.experienceYears ?? "—"],
    ["Болница", profile.data?.hospitalName ?? "—"],
    ["Град", profile.data?.hospitalCity ?? "—"],
  ];

  return (
    <>
      <PageBanner
        title="Дополнителна дејност"
        breadcrumb={[{ label: "Дополнителна дејност" }]}
      />

      <div className="mx-auto max-w-4xl px-6 py-6">
        {profile.isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card>
            <h2 className="text-lg font-bold text-slate-900">Клинички профил</h2>
            <p className="mt-1 text-sm text-slate-500">
              Овие податоци се прикажуваат на јавниот портал и во распоредот.
            </p>
            <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>
    </>
  );
}
