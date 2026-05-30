"use client";

import { Bell, Calendar, LayoutDashboard, Stethoscope, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useT } from "@/hooks/useT";
import { useAuth } from "@/hooks/useAuth";
import { notificationService } from "@/services/notification.service";
import { cn } from "@/utils/cn";

export function MobilePatientNav() {
  const pathname = usePathname();
  const t = useT();
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: notificationService.unreadCount,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  const items = [
    { href: "/dashboard",      icon: LayoutDashboard, label: t.nav.dashboard     },
    { href: "/appointments",   icon: Calendar,         label: t.nav.appointments  },
    { href: "/doctors",        icon: Stethoscope,      label: t.nav.findDoctor    },
    { href: "/notifications",  icon: Bell,             label: t.nav.notifications },
    { href: "/profile",        icon: User,             label: t.nav.profile       },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white lg:hidden">
      <div className="flex">
        {items.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-brand-600" : "text-slate-400 hover:text-slate-700",
              )}
            >
              <span className="relative">
                <item.icon className={cn("h-5 w-5", active && "text-brand-600")} />
                {item.href === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
