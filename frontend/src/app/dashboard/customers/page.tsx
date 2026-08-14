"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, UserCircle2, Pencil, Trash2, AlertTriangle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";

type Customer = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  document_id?: string | null;
  address?: string | null;
  notes?: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");

  const [search, setSearch] = useState("");

  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const isDeleteOpen = !!toDelete;

  async function refresh() {
    setApiError("");
    const data = await apiFetch<Customer[]>("/api/customers/");
    setCustomers(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } catch (e: any) {
        setApiError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [
        c.full_name,
        c.email ?? "",
        c.phone ?? "",
        c.document_id ?? "",
        c.address ?? "",
      ].join(" ").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setApiError("");
    try {
      await apiFetch(`/api/customers/${toDelete.id}`, { method: "DELETE" });
      setToDelete(null);
      await refresh();
    } catch (e: any) {
      setApiError(e?.message ?? String(e));
    }
  };

  const handleDeleteOpenChange = (open: boolean) => {
    if (!open) setToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Clientes
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Administra la base de clientes del taller.
          </p>
          {apiError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{apiError}</p>
          )}
        </div>

        <Button asChild className="mt-2 md:mt-0 gap-2" disabled={loading}>
          <Link href="/dashboard/customers/new">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <UserCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <span>{loading ? "Cargando..." : `${customers.length} clientes`}</span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72 rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
            placeholder="Buscar por nombre, email, teléfono..."
            disabled={loading}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="border-b px-4 py-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Listado de clientes
          </h3>
        </div>

        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Contacto</th>
                <th className="px-4 py-2 font-medium">Documento</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Cargando clientes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No se encontraron clientes.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr
                    key={c.id}
                    className={`border-t text-xs border-slate-100 dark:border-slate-800 ${
                      idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/70 dark:bg-slate-900/80"
                    }`}
                  >
                    <td className="px-4 py-2">
                      <div className="font-semibold text-slate-900 dark:text-slate-50">{c.full_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">ID: {c.id}</div>
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex flex-col gap-0.5">
                        <div className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span className="truncate max-w-[240px]">{c.email ?? "—"}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{c.phone ?? "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {c.document_id ?? "—"}
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                        >
                          <Link href={`/dashboard/customers/${encodeURIComponent(c.id)}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToDelete(c)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar cliente</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar a{" "}
              <span className="font-semibold">{toDelete?.full_name}</span>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Si el cliente tiene vehículos asociados, la base puede impedir el borrado (FK RESTRICT).
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} className="border-slate-300 dark:border-slate-700">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
