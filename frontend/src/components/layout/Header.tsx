"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sidebarItems } from "@/app/dashboard/sidebar-items";
import { cn } from "@/lib/utils";
import { Bell, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const name = session?.user?.name ?? "Usuario";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm border-slate-200 dark:bg-slate-900/90 dark:border-slate-800 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="left-0 top-0 flex h-dvh max-w-[18rem] translate-x-0 translate-y-0 flex-col rounded-none border-y-0 border-l-0 p-0 sm:max-w-[18rem]">
            <DialogHeader className="border-b border-slate-200 p-4 text-left dark:border-slate-800">
              <DialogTitle className="text-xl">Taller Mec&aacute;nico</DialogTitle>
            </DialogHeader>
            <nav className="flex flex-col gap-1 p-3">
              {sidebarItems.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors",
                      active
                        ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesi&oacute;n
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50 sm:text-lg">
          Panel de control
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Toggle claro/oscuro */}
        <ThemeToggle />

        <button
          className="hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 sm:inline-flex"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start sm:flex">
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
