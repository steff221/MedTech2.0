"use client";

import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { CompleteProfilePrompt } from "@/components/patient/CompleteProfilePrompt";
import { useAuth } from "@/hooks/useAuth";
import { usePatientProfile } from "@/hooks/usePatient";

export default function ProfilePage() {
  const { user } = useAuth();
  const profile = usePatientProfile();

  if (profile.isLoading) return <Skeleton className="h-64" />;
  if (profile.data === null) return <CompleteProfilePrompt />;
  if (!profile.data || !user) return <EmptyState title="Profile not available" />;

  const rows: Array<[string, string | null]> = [
    ["Name", `${user.firstName} ${user.lastName}`],
    ["Email", user.email],
    ["Phone", user.phoneNumber ?? "—"],
    ["Date of birth", profile.data.dateOfBirth ?? "—"],
    ["Gender", profile.data.gender ?? "—"],
    ["Blood type", profile.data.bloodType ?? "—"],
    ["City", profile.data.city ?? "—"],
    ["Address", profile.data.address ?? "—"],
    ["Allergies", profile.data.allergies ?? "—"],
    ["Chronic conditions", profile.data.chronicConditions ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your personal and medical information.</p>
      </div>

      <Card>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
