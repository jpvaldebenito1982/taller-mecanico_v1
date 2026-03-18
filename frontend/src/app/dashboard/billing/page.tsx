"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Receipt,
  AlertTriangle,
  Pencil,
  Trash2,
  FileText,
  Loader2,
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

type InvoiceStatus = "Pendiente" | "Pagada" | "Anulada";

type Invoice = {
  id: string;
  number: string;
  date: string;
  customer: string;
  orderId?: string;
  orderCode?: string;
  total: number;
  paymentMethod: string;
  status: InvoiceStatus;
};

type BillingApiItem = {
  id: string;
  number: string;
  date: string;
  customer: string;
  order_id?: string | null;
  order_code?: string | null;
  total: number | string;
  payment_method: string;
  status: InvoiceStatus;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

const formatDate = (value: string) => {
  if (!value) return "-";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("es-CL");
};

const getStatusClasses = (status: InvoiceStatus) => {
  switch (status) {
    case "Pendiente":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    case "Pagada":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
    case "Anulada":
      return "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300";
  }
};

const normalizeInvoice = (item: BillingApiItem): Invoice => ({
  id: String(item.id),
  number: item.number ?? "-",
  date: formatDate(item.date),
  customer: item.customer ?? "Sin cliente",
  orderId: item.order_id ?? undefined,
  orderCode: item.order_code ?? undefined,
  total: Number(item.total ?? 0),
  paymentMethod: item.payment_method ?? "-",
  status: item.status ?? "Pendiente",
});

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"Todas" | InvoiceStatus>("Todas");

  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const isDeleteOpen = !!invoiceToDelete;

  const fetchBilling = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/billing`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudo obtener la facturación.");
      }

      const data: BillingApiItem[] = await response.json();
      setInvoices(Array.isArray(data) ? data.map(normalizeInvoice) : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los documentos.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        search.trim().length === 0 ||
        [inv.number, inv.customer, inv.orderCode]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "Todas" ? true : inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `${API_URL}/api/billing/${invoiceToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar el documento.");
      }

      setInvoices((prev) => prev.filter((i) => i.id !== invoiceToDelete.id));
      setInvoiceToDelete(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el documento.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !deleteLoading) {
      setInvoiceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Facturación
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Registra y controla las facturas y boletas emitidas por el taller
            Díaz & Díaz.
          </p>
        </div>

        <Button asChild className="mt-2 md:mt-0">
          <Link href="/dashboard/billing/new" className="inline-flex gap-2">
            <Plus className="h-4 w-4" />
            Nueva factura/boleta
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <span>{invoices.length} documentos registrados</span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-xs border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Estado:
            </span>
            <select
              className="bg-transparent text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "Todas" | InvoiceStatus)
              }
            >
              <option value="Todas">Todas</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Pagada">Pagada</option>
              <option value="Anulada">Anulada</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Buscar por N° documento, cliente u orden..."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="border-b px-4 py-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Documentos emitidos
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando documentos...
          </div>
        ) : error ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              onClick={fetchBilling}
              className="mt-4 border-slate-300 dark:border-slate-700"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80">
                <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                  <th className="px-4 py-2 font-medium">N° Documento</th>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Cliente</th>
                  <th className="px-4 py-2 font-medium">Orden asociada</th>
                  <th className="px-4 py-2 font-medium">Método de pago</th>
                  <th className="px-4 py-2 font-medium">Total</th>
                  <th className="px-4 py-2 font-medium">Estado</th>
                  <th className="px-4 py-2 font-medium text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                    >
                      No se encontraron documentos con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr
                      key={inv.id}
                      className={`border-t text-xs border-slate-100 dark:border-slate-800 ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50/70 dark:bg-slate-900/80"
                      }`}
                    >
                      <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-50">
                        {inv.number}
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                        {inv.date}
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                        {inv.customer}
                      </td>
                      <td className="px-4 py-2">
                        {inv.orderId && inv.orderCode ? (
                          <Link
                            href={`/dashboard/orders/${inv.orderId}`}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
                          >
                            <FileText className="h-3 w-3" />
                            {inv.orderCode}
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Sin orden
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                        {inv.paymentMethod}
                      </td>
                      <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusClasses(
                            inv.status
                          )}`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                          >
                            <Link href={`/dashboard/billing/${inv.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setInvoiceToDelete(inv)}
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
        )}
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar documento</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar el documento{" "}
              <span className="font-semibold">
                {invoiceToDelete?.number} · {invoiceToDelete?.customer}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Ten en cuenta que esto no afecta automáticamente el estado de la
            orden asociada. Más adelante podemos conectar esta acción con la
            reversa de pagos.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setInvoiceToDelete(null)}
              disabled={deleteLoading}
              className="border-slate-300 dark:border-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="gap-2"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}