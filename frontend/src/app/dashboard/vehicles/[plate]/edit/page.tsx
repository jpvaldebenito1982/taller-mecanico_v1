"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Customer = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
};

type VehicleApi = {
  id: string;
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
};

type VehicleUpdate = {
  customer_id?: string;
  plate?: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  mileage_km?: number | null;
  notes?: string | null;
};

function normalizeVehicleToForm(v: VehicleApi): VehicleUpdate {
  return {
    customer_id: v.customer_id ?? "",
    plate: v.plate ?? "",
    brand: v.brand ?? "",
    model: v.model ?? "",
    year: v.year ?? null,
    color: v.color ?? "",
    mileage_km: v.mileage_km ?? null,
    notes: v.notes ?? "",
  };
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();

  const rawParam = String(params?.plate ?? params?.id ?? "");
  const vehicleParam = decodeURIComponent(rawParam);

  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [apiError, setApiError] = useState("");

  const [vehicle, setVehicle] = useState<VehicleApi | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<VehicleUpdate>({
    customer_id: "",
    plate: "",
    brand: "",
    model: "",
    year: null,
    color: "",
    mileage_km: null,
    notes: "",
  });

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setLoading(true);
        setApiError("");

        let foundVehicle: VehicleApi | null = null;

        try {
          foundVehicle = await apiFetch<VehicleApi>(
            `/api/vehicles/${encodeURIComponent(vehicleParam)}`
          );
        } catch {
          foundVehicle = null;
        }

        if (!foundVehicle) {
          try {
            const list = await apiFetch<VehicleApi[]>(
              `/api/vehicles?plate=${encodeURIComponent(vehicleParam)}`
            );
            foundVehicle = list?.[0] ?? null;
          } catch {
            foundVehicle = null;
          }
        }

        if (!foundVehicle) {
          setVehicle(null);
          return;
        }

        setVehicle(foundVehicle);
        setForm(normalizeVehicleToForm(foundVehicle));
      } catch (e: any) {
        setApiError(e?.message ?? "No se pudo cargar el vehículo.");
      } finally {
        setLoading(false);
      }
    };

    if (vehicleParam) {
      loadVehicle();
    } else {
      setLoading(false);
      setVehicle(null);
      setApiError("No se recibió un identificador de vehículo válido.");
    }
  }, [vehicleParam]);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoadingCustomers(true);
        const data = await apiFetch<Customer[]>("/api/customers");
        setCustomers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setApiError((prev) => prev || e?.message || "No se pudieron cargar los clientes.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === form.customer_id) ?? null;
  }, [customers, form.customer_id]);

  const handleChange = <K extends keyof VehicleUpdate>(
    key: K,
    value: VehicleUpdate[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");

    try {
      if (!vehicle) throw new Error("Vehículo no encontrado.");
      if (!form.customer_id) throw new Error("Debes seleccionar un cliente.");
      if (!form.plate?.trim()) throw new Error("Debes ingresar la patente.");

      const payload: VehicleUpdate = {
        customer_id: form.customer_id,
        plate: form.plate.trim().toUpperCase(),
        brand: form.brand?.trim() || null,
        model: form.model?.trim() || null,
        year: form.year ?? null,
        color: form.color?.trim() || null,
        mileage_km: form.mileage_km ?? null,
        notes: form.notes?.trim() || null,
      };

      await apiFetch<VehicleApi>(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      router.push("/dashboard/vehicles");
    } catch (e: any) {
      setApiError(e?.message ?? String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Cargando vehículo...
          </h2>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/vehicles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Vehículo no encontrado
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No pudimos encontrar el vehículo con identificador o patente{" "}
          <span className="font-semibold">{vehicleParam}</span>.
        </p>
        {apiError && (
          <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Editar vehículo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Modifica los datos del vehículo con patente{" "}
            <span className="font-semibold">{vehicle.plate}</span>.
          </p>
          {apiError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {apiError}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Cliente
            </label>
            <select
              value={form.customer_id || ""}
              onChange={(e) => handleChange("customer_id", e.target.value)}
              disabled={loadingCustomers || isSubmitting}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="">Selecciona un cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedCustomer.phone ? `📞 ${selectedCustomer.phone}` : "📞 —"}
                {selectedCustomer.email ? ` • ✉️ ${selectedCustomer.email}` : ""}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Patente
            </label>
            <input
              required
              value={form.plate ?? ""}
              onChange={(e) => handleChange("plate", e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Año
            </label>
            <input
              type="number"
              min={1970}
              max={2100}
              value={form.year ?? ""}
              onChange={(e) =>
                handleChange("year", e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Marca
            </label>
            <input
              value={form.brand ?? ""}
              onChange={(e) => handleChange("brand", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Modelo
            </label>
            <input
              value={form.model ?? ""}
              onChange={(e) => handleChange("model", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Color
            </label>
            <input
              value={form.color ?? ""}
              onChange={(e) => handleChange("color", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Kilometraje (km)
            </label>
            <input
              type="number"
              min={0}
              value={form.mileage_km ?? ""}
              onChange={(e) =>
                handleChange(
                  "mileage_km",
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Información relevante del vehículo (estado general, reparaciones importantes, etc.)."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-slate-300 dark:border-slate-700"
          >
            <Link href="/dashboard/vehicles">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || loadingCustomers}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}