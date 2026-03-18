"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "Usuario";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b bg-white/90 shadow-sm backdrop-blur-sm border-slate-200 dark:bg-slate-900/90 dark:border-slate-800">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Panel de control
      </h1>

      <div className="flex items-center gap-4">
        {/* Toggle claro/oscuro */}
        <ThemeToggle />

        <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-slate-800 dark:text-slate-100 max-w-[160px] truncate">
              {name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-red-500 hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
