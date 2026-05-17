"use client";

import { LayoutDashboard } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export default function DoctorOverviewPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="text-sm text-slate-500">Daily totals, no-shows, and recent activity.</p>
      </div>
      <EmptyState icon={LayoutDashboard} title="Coming next" description="Stats and charts." />
    </div>
  );
}
