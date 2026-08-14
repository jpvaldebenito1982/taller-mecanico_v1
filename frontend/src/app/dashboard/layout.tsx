// frontend/src/app/dashboard/layout.tsx
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh w-full max-w-[100vw] overflow-x-clip bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar />
      <div className="flex w-full min-w-0 max-w-full flex-1 flex-col overflow-x-clip">
        <Header />
        <main className="w-full min-w-0 max-w-full flex-1 overflow-x-clip overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950 sm:p-6">
          <div className="w-full min-w-0 max-w-full overflow-x-clip">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
