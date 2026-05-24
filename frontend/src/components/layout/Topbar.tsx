"use client";

import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";
import { initials } from "@/utils/format";
import { notificationService } from "@/services/notification.service";

export function Topbar() {
  const { user, logout } = useAuth();
  const t = useT();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: notificationService.unreadCount,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-sm text-slate-500">
        {user ? (
          <>
            {t.common.signedInAs}{" "}
            <span className="font-medium text-slate-900">{user.email}</span>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <Link href="/notifications" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <LanguageToggle />
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
          {t.common.signOut}
        </button>
      </div>
    </header>
  );
}
