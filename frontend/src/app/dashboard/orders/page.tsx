"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  AlertTriangle,
  ClipboardList,
  Pencil,
  Trash2,
  FileText,
  Eye,
  Smartphone,
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

type OrderStatus =
  | "Abierta"
  | "En proceso"
  | "Finalizada"
  | "En espera de repuestos";

type OrderPriority = "Baja" | "Media" | "Alta";

type WorkOrder = {
  id: string;
  code: string;
  plate: string;
  vehicle: string;
  customer: string;
  createdAt: string;
  promisedAt?: string;
  status: OrderStatus;
  priority: OrderPriority;
  total?: number;
  quoteId?: string;
  quoteCode?: string;
};

type OrderApiResponse = {
  id: string;
  code: string;
  plate: string;
  vehicle: string;
  customer: string;
  created_at: string;
  promised_at?: string | null;
  status: OrderStatus;
  priority: OrderPriority;
  total?: number | string | null;
  quote_id?: string | null;
  quote_code?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

function formatDate(dateString?: string | null) {
  if (!dateString) return undefined;

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("es-CL");
}

function mapOrderFromApi(order: OrderApiResponse): WorkOrder {
  return {
    id: order.id,
    code: order.code,
    plate: order.plate,
    vehicle: order.vehicle,
    customer: order.customer,
    createdAt: formatDate(order.created_at) ?? order.created_at,
    promisedAt: formatDate(order.promised_at),
    status: order.status,
    priority: order.priority,
    total:
      typeof order.total === "number"
        ? order.total
        : order.total != null
        ? Number(order.total)
        : undefined,
    quoteId: order.quote_id ?? undefined,
    quoteCode: order.quote_code ?? undefined,
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"Todas" | OrderStatus>("Todas");
  const [priorityFilter, setPriorityFilter] =
    useState<"Todas" | OrderPriority>("Todas");

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<WorkOrder | null>(null);
  const isDeleteOpen = !!orderToDelete;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "Todas") params.set("status", statusFilter);
      if (priorityFilter !== "Todas") params.set("priority", priorityFilter);

      const queryString = params.toString();
      const url = `${API_URL}/api/orders${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No se pudieron cargar las órdenes");
      }

      const data: OrderApiResponse[] = await response.json();
      setOrders(data.map(mapOrderFromApi));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las órdenes de trabajo.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusClasses = (status: OrderStatus) => {
    switch (status) {
      case "Abierta":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
      case "En proceso":
        return "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300";
      case "Finalizada":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
      case "En espera de repuestos":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    }
  };

  const getPriorityClasses = (priority: OrderPriority) => {
    switch (priority) {
      case "Alta":
        return "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300";
      case "Media":
        return "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
      case "Baja":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
    }
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return "—";

    return value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/orders/${orderToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo eliminar la orden");
      }

      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      setOrderToDelete(null);
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar la orden de trabajo.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open && !deleting) setOrderToDelete(null);
  };

  const totalOrdersLabel = useMemo(() => orders.length, [orders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Órdenes de trabajo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Controla las órdenes en curso y el historial de trabajos de Díaz &
            Díaz.
          </p>
        </div>

        <Button asChild className="mt-2 md:mt-0">
          <Link href="/dashboard/orders/new" className="inline-flex gap-2">
            <Plus className="h-4 w-4" />
            Nueva orden
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <span>
            {loading ? "Cargando órdenes..." : `${totalOrdersLabel} órdenes registradas`}
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Estado:
            </span>
            <select
              className="bg-transparent text-xs text-slate-700 focus:outline-none dark:text-slate-200"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
            >
              <option value="Todas">Todas</option>
              <option value="Abierta">Abierta</option>
              <option value="En proceso">En proceso</option>
              <option value="En espera de repuestos">
                En espera de repuestos
              </option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800">
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Prioridad:
            </span>
            <select
              className="bg-transparent text-xs text-slate-700 focus:outline-none dark:text-slate-200"
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as typeof priorityFilter)
              }
            >
              <option value="Todas">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 md:w-72"
              placeholder="Buscar por OT, patente, vehículo o cliente..."
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
            Órdenes de trabajo
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                <th className="px-4 py-2 font-medium">N° OT</th>
                <th className="px-4 py-2 font-medium">Vehículo / Patente</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Creación</th>
                <th className="px-4 py-2 font-medium">Entrega estimada</th>
                <th className="px-4 py-2 font-medium">Presupuesto</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2 font-medium">Prioridad</th>
                <th className="px-4 py-2 font-medium">Total</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    Cargando órdenes...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No se encontraron órdenes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                orders.map((o, idx) => (
                  <tr
                    key={o.id}
                    className={`border-t border-slate-100 text-xs dark:border-slate-800 ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/70 dark:bg-slate-900/80"
                    }`}
                  >
                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-50">
                      {o.code}
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      <div className="flex flex-col">
                        <span>{o.vehicle}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Patente: {o.plate}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {o.customer}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {o.createdAt}
                    </td>
                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {o.promisedAt ?? "—"}
                    </td>

                    <td className="px-4 py-2">
                      {o.quoteId && o.quoteCode ? (
                        <Link
                          href={`/dashboard/quotes/${o.quoteId}/edit`}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                        >
                          <FileText className="h-3 w-3" />
                          {o.quoteCode}
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Sin presupuesto
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusClasses(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getPriorityClasses(
                          o.priority
                        )}`}
                      >
                        {o.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                        >
                          <Link href={`/dashboard/orders/${o.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalle</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                        >
                          <Link href={`/dashboard/mechanic/orders/${o.id}`}>
                            <Smartphone className="h-4 w-4" />
                            <span className="sr-only">Modo mecanico</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                        >
                          <Link href={`/dashboard/orders/${o.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setOrderToDelete(o)}
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

      <Dialog open={isDeleteOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar orden de trabajo</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar la orden{" "}
              <span className="font-semibold">
                {orderToDelete?.code} · {orderToDelete?.vehicle}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Asegúrate de tener registrados los trabajos y facturación asociados
            antes de eliminar esta orden.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOrderToDelete(null)}
              className="border-slate-300 dark:border-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
