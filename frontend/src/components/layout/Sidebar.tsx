"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";
import { sidebarItems } from "@/app/dashboard/sidebar-items";
import { signOut } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-white shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="p-4 text-xl font-bold border-b border-slate-200 text-slate-900 dark:border-slate-800 dark:text-slate-50">
        Taller Mecánico
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {sidebarItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-500/20 dark:text-blue-200"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
