"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, CarFront, Pencil, Trash2, AlertTriangle } from "lucide-react";
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

type Vehicle = {
  id: string; // UUID
  customer_id: string;

  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;

  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  mileage_km?: number | null;
  notes?: string | null;

  // por ahora no existe en backend:
  lastService?: string | null;
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string>("");

  const [search, setSearch] = useState("");

  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const isDeleteOpen = !!vehicleToDelete;

  async function refreshVehicles() {
    setApiError("");
    const data = await apiFetch<Vehicle[]>("/api/vehicles/");
    setVehicles(data);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshVehicles();
      } catch (e: any) {
        setApiError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const haystack = [
        v.plate,
        v.brand ?? "",
        v.model ?? "",
        v.customer_name ?? "",
        v.customer_phone ?? "",
        v.customer_email ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return search.trim().length === 0 || haystack.includes(search.toLowerCase());
    });
  }, [vehicles, search]);

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    setApiError("");

    try {
      await apiFetch<{ ok: boolean }>(`/api/vehicles/${vehicleToDelete.id}`, {
        method: "DELETE",
      });
      setVehicleToDelete(null);
      await refreshVehicles();
    } catch (e: any) {
      setApiError(e?.message ?? String(e));
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) setVehicleToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Vehículos
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Gestiona los vehículos asociados a tus clientes de Díaz &amp; Díaz.
          </p>
          {apiError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{apiError}</p>
          )}
        </div>

        <Button asChild className="mt-2 md:mt-0">
          <Link href="/dashboard/vehicles/new" className="inline-flex gap-2">
            <Plus className="h-4 w-4" />
            Registrar vehículo
          </Link>
        </Button>
      </div>

      {/* Búsqueda */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <CarFront className="h-4 w-4 text-blue-600 dark:text-blue-300" />
          <span>
            {loading ? "Cargando..." : `${vehicles.length} vehículos registrados`}
          </span>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-72 rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
              placeholder="Buscar por patente, marca, modelo o cliente..."
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border bg-white shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="border-b px-4 py-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Listado de vehículos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr className="text-left text-xs text-slate-500 dark:text-slate-300">
                <th className="px-4 py-2 font-medium">Patente</th>
                <th className="px-4 py-2 font-medium">Marca / Modelo</th>
                <th className="px-4 py-2 font-medium">Año</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Contacto</th>
                <th className="px-4 py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    Cargando vehículos...
                  </td>
                </tr>
              ) : filteredVehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400"
                  >
                    No se encontraron vehículos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v, idx) => (
                  <tr
                    key={v.id}
                    className={`border-t text-xs border-slate-100 dark:border-slate-800 ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/70 dark:bg-slate-900/80"
                    }`}
                  >
                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-slate-50">
                      {v.plate}
                      <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                        ID: {v.id}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {(v.brand ?? "—") + " " + (v.model ?? "")}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {v.color ? `Color: ${v.color}` : " "}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      {v.year ?? "—"}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {v.mileage_km != null ? `${v.mileage_km.toLocaleString()} km` : " "}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-slate-800 dark:text-slate-100">
                      {v.customer_name || "—"}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Customer ID: {v.customer_id}
                      </div>
                    </td>

                    <td className="px-4 py-2 text-slate-700 dark:text-slate-200">
                      <div className="flex flex-col gap-0.5">
                        <span>{v.customer_phone ?? "—"}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {v.customer_email ?? " "}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-50 dark:hover:bg-slate-700"
                        >
                          <Link href={`/dashboard/vehicles/${encodeURIComponent(v.id)}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setVehicleToDelete(v)}
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

      {/* Modal de confirmación de eliminado */}
      <Dialog open={isDeleteOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar vehículo</DialogTitle>
            </div>

            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar el vehículo{" "}
              <span className="font-semibold">
                {vehicleToDelete?.plate} · {vehicleToDelete?.brand ?? "—"} {vehicleToDelete?.model ?? ""}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Las órdenes de trabajo históricas seguirán asociadas a este vehículo, pero ya no aparecerá en el listado principal.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setVehicleToDelete(null)}
              className="border-slate-300 dark:border-slate-700"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}