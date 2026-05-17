"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/utils/format";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">
        {user ? (
          <>
            Signed in as <span className="font-medium text-slate-900">{user.email}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(user.firstName, user.lastName)}
          </div>
        )}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </header>
  );
}
