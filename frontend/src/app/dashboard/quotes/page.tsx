"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  FileText,
  AlertTriangle,
  Pencil,
  Trash2,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type QuoteStatus =
  | "Borrador"
  | "Enviado"
  | "Aceptado"
  | "Rechazado"
  | "Vencido";

type Quote = {
  id: string;
  code: string;
  customer: string;
  vehicle: string;
  plate: string;
  createdAt: string;
  validUntil: string;
  status: QuoteStatus;
  total: number;
};

type QuoteApiResponse = {
  id: string;
  code: string;
  customer: string;
  vehicle: string;
  plate: string;
  created_at: string;
  valid_until: string;
  status: QuoteStatus;
  total: number | string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function formatDate(dateString?: string | null) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("es-CL");
}

function mapQuoteFromApi(quote: QuoteApiResponse): Quote {
  return {
    id: quote.id,
    code: quote.code,
    customer: quote.customer,
    vehicle: quote.vehicle,
    plate: quote.plate,
    createdAt: formatDate(quote.created_at),
    validUntil: formatDate(quote.valid_until),
    status: quote.status,
    total:
      typeof quote.total === "number"
        ? quote.total
        : quote.total != null
        ? Number(quote.total)
        : 0,
  };
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"Todos" | QuoteStatus>("Todos");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const isDeleteOpen = !!quoteToDelete;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "Todos") params.set("status", statusFilter);

      const queryString = params.toString();
      const url = `${API_URL}/api/quotes${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudieron cargar los presupuestos");
      }

      const data: QuoteApiResponse[] = await response.json();
      setQuotes(data.map(mapQuoteFromApi));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los presupuestos.");
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const totalQuotesLabel = useMemo(() => quotes.length, [quotes]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const getStatusClasses = (status: QuoteStatus) => {
    switch (status) {
      case "Borrador":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
      case "Enviado":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
      case "Aceptado":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
      case "Rechazado":
        return "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300";
      case "Vencido":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    }
  };

  const handleConfirmDelete = async () => {
    if (!quoteToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/quotes/${quoteToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo eliminar el presupuesto");
      }

      setQuotes((prev) => prev.filter((q) => q.id !== quoteToDelete.id));
      setQuoteToDelete(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el presupuesto.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !deleting) setQuoteToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Presupuestos
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Administra los presupuestos enviados a los clientes de Díaz & Díaz.
          </p>
        </div>

        <Button asChild className="mt-2 md:mt-0">
          <Link href="/dashboard/quotes/new" className="inline-flex gap-2">
            <Plus className="h-4 w-4" />
            Nuevo presupuesto
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <span>
            {loading
              ? "Cargando presupuestos..."
              : `${totalQuotesLabel} presupuestos registrados`}
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Estado:
            </span>
            <select
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="Todos">Todos</option>
              <option value="Borrador">Borrador</option>
              <option value="Enviado">Enviado</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 md:w-72"
              placeholder="Buscar por N° presupuesto, cliente, vehículo..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Listado de presupuestos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                <th className="px-4 py-2 font-medium">N°</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Vehículo / Patente</th>
                <th className="px-4 py-2 font-medium">Fecha</th>
                <th className="px-4 py-2 font-medium">Válido hasta</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    Cargando presupuestos...
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No se encontraron presupuestos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                quotes.map((q, idx) => (
                  <tr
                    key={q.id}
                    className={`border-t border-slate-100 text-xs dark:border-slate-800 ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/70 dark:bg-slate-900/80"
                    }`}
                  >
                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-50">
                      {q.code}
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {q.customer}
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      <div className="flex flex-col">
                        <span>{q.vehicle}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Patente: {q.plate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {q.createdAt}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {q.validUntil}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusClasses(
                          q.status
                        )}`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                        >
                          <Link
                            href={`/dashboard/orders/new?quoteId=${encodeURIComponent(
                              q.id
                            )}&quoteCode=${encodeURIComponent(
                              q.code
                            )}&customer=${encodeURIComponent(
                              q.customer
                            )}&vehicle=${encodeURIComponent(
                              q.vehicle
                            )}&plate=${encodeURIComponent(q.plate)}`}
                          >
                            <Wrench className="h-4 w-4" />
                            <span className="sr-only">
                              Crear orden desde presupuesto
                            </span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-50"
                        >
                          <Link href={`/dashboard/quotes/${q.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setQuoteToDelete(q)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
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

      <Dialog open={isDeleteOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar presupuesto</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar el presupuesto{" "}
              <span className="font-semibold">
                {quoteToDelete?.code} · {quoteToDelete?.customer}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Si este presupuesto ya fue aceptado o facturado, asegúrate de tener
            el respaldo en el módulo correspondiente antes de eliminarlo.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setQuoteToDelete(null)}
              className="border-slate-300 dark:border-slate-700"
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="gap-2"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}