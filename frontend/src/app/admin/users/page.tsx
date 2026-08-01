// Страница (Next.js): корисници — дел за администратор.
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, RefreshCw, Ban, CheckCircle2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { adminService, type InviteStaffRequest } from "@/services/admin.service";
import { hospitalService } from "@/services/hospital.service";
import { Skeleton } from "@/components/common/Skeleton";
import type { UserResponse } from "@/types/api";

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE:    "chip-ok",
    SUSPENDED: "chip-alert",
    INACTIVE:  "chip-mute",
  };
  return (
    <span className={`chip ${map[status] ?? map.INACTIVE}`}>
      {status}
    </span>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  // Roles are not states, so they all take the neutral rule; the label itself
  // is the distinguishing information.
  const map: Record<string, string> = {
    DOCTOR:                "chip-info",
    GENERAL_PRACTITIONER:  "chip-info",
    NURSE:                 "chip-info",
    ADMIN:                 "chip-alert",
  };
  return (
    <span className={`chip ${map[role] ?? "chip-mute"}`}>
      {role}
    </span>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<InviteStaffRequest>({
    email: "", firstName: "", lastName: "", role: "DOCTOR",
    phoneNumber: "", hospitalId: undefined, licenseNumber: "", specialization: "",
  });

  const hospitals = useQuery({
    queryKey: ["hospitals"],
    queryFn: () => hospitalService.listActive(),
  });

  const invite = useMutation({
    mutationFn: (body: InviteStaffRequest) => adminService.invite(body),
    onSuccess: (u) => {
      toast.success(`Покана испратена до ${u.email}`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onClose();
    },
    onError: () => toast.error("Неуспешна покана. Проверете ги податоците."),
  });

  const set = (k: keyof InviteStaffRequest, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    invite.mutate(form);
  };

  const input = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-5 text-lg font-bold text-slate-900">Покани нов член на тимот</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Име</label>
              <input className={input} value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Презиме</label>
              <input className={input} value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Е-пошта</label>
            <input className={input} type="email" value={form.email}
              onChange={(e) => set("email", e.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Телефон (опционално)</label>
            <input className={input} value={form.phoneNumber ?? ""}
              onChange={(e) => set("phoneNumber", e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Улога</label>
            <select className={input} value={form.role}
              onChange={(e) => set("role", e.target.value as "DOCTOR" | "GENERAL_PRACTITIONER" | "NURSE")}>
              <option value="DOCTOR">Специјалист / Хирург</option>
              <option value="GENERAL_PRACTITIONER">Општ лекар (ГП)</option>
              <option value="NURSE">Медицинска сестра</option>
            </select>
          </div>

          {(form.role === "DOCTOR" || form.role === "GENERAL_PRACTITIONER") && (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Болница</label>
                <select className={input}
                  value={form.hospitalId ?? ""}
                  onChange={(e) => set("hospitalId", e.target.value ? Number(e.target.value) : undefined)}
                  required>
                  <option value="">Изберете болница</option>
                  {hospitals.data?.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}, {h.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Број на лиценца</label>
                <input className={input} value={form.licenseNumber ?? ""}
                  onChange={(e) => set("licenseNumber", e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Специјализација</label>
                <input className={input} value={form.specialization ?? ""}
                  onChange={(e) => set("specialization", e.target.value)} required />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Откажи
            </button>
            <button type="submit" disabled={invite.isPending}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60">
              {invite.isPending
                ? <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> Се испраќа…</>
                : <><Mail className="h-4 w-4" /> Испрати покана</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [filterHospitalId, setFilterHospitalId] = useState<number | undefined>(undefined);

  const hospitals = useQuery({
    queryKey: ["hospitals-active"],
    queryFn: () => hospitalService.listActive(),
  });

  const users = useQuery({
    queryKey: ["admin-users", filterHospitalId],
    queryFn: () => adminService.listUsers(0, 20, filterHospitalId),
  });

  const suspend = useMutation({
    mutationFn: (id: number) => adminService.suspend(id),
    onSuccess: () => { toast.success("Сметката е суспендирана"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: () => toast.error("Неуспешна акција"),
  });

  const activate = useMutation({
    mutationFn: (id: number) => adminService.activate(id),
    onSuccess: () => { toast.success("Сметката е активирана"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: () => toast.error("Неуспешна акција"),
  });

  const resend = useMutation({
    mutationFn: (id: number) => adminService.resendInvite(id),
    onSuccess: () => toast.success("Поканата е повторно испратена"),
    onError: () => toast.error("Неуспешна акција"),
  });

  return (
    <>
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Управување со корисници</h1>
            <p className="mt-1 text-sm text-slate-500">
              Поканете доктори и медицински сестри. Суспендирајте или активирајте сметки.
            </p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <UserPlus className="h-4 w-4" />
            Покани член
          </button>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterHospitalId ?? ""}
            onChange={(e) =>
              setFilterHospitalId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="rounded-lg border border-slate-200 py-2 px-3 text-sm text-slate-700 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
          >
            <option value="">Сите болници</option>
            {hospitals.data?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}, {h.city}
              </option>
            ))}
          </select>
          {filterHospitalId && (
            <span className="chip chip-info">
              Прикажани само доктори
            </span>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {users.isLoading ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Корисник</th>
                  <th className="px-5 py-3">Улога</th>
                  <th className="px-5 py-3">Статус</th>
                  <th className="px-5 py-3">Последна најава</th>
                  <th className="px-5 py-3 text-right">Акции</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.data?.content.map((u: UserResponse) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-slate-800">{u.firstName} {u.lastName}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("mk") : "Никогаш"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        {!u.lastLogin && (
                          <button
                            onClick={() => resend.mutate(u.id)}
                            title="Повторно испрати покана"
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        )}
                        {u.status === "ACTIVE" ? (
                          <button
                            onClick={() => suspend.mutate(u.id)}
                            title="Суспендирај"
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activate.mutate(u.id)}
                            title="Активирај"
                            className="rounded p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.data?.content.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Нема корисници. Поканете го првиот доктор.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
