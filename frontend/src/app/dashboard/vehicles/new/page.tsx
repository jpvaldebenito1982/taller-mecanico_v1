"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type VehicleCreate = {
  customer_id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  mileage_km?: number | null;
  notes?: string | null;
};

export default function NewVehiclePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [apiError, setApiError] = useState<string>("");

  const [form, setForm] = useState<VehicleCreate>({
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
    (async () => {
      try {
        setApiError("");
        const data = await apiFetch<Customer[]>("/api/customers/");
        setCustomers(data);
        // auto-seleccionar el primero (opcional)
        if (data.length > 0) {
          setForm((prev) => ({ ...prev, customer_id: data[0].id }));
        }
      } catch (e: any) {
        setApiError(e?.message ?? String(e));
      } finally {
        setLoadingCustomers(false);
      }
    })();
  }, []);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === form.customer_id) ?? null;
  }, [customers, form.customer_id]);

  const handleChange = <K extends keyof VehicleCreate>(key: K, value: VehicleCreate[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError("");

    try {
      if (!form.customer_id) {
        throw new Error("Debes seleccionar un cliente.");
      }

      const payload: VehicleCreate = {
        customer_id: form.customer_id,
        plate: form.plate.trim().toUpperCase(),
        brand: form.brand?.trim() || null,
        model: form.model?.trim() || null,
        year: form.year ?? null,
        color: form.color?.trim() || null,
        mileage_km: form.mileage_km ?? null,
        notes: form.notes?.trim() || null,
      };

      await apiFetch("/api/vehicles/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push("/dashboard/vehicles");
    } catch (e: any) {
      setApiError(e?.message ?? String(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/vehicles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Registrar vehículo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ingresa los datos del vehículo para asociarlo a un cliente.
          </p>
          {apiError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{apiError}</p>
          )}
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Cliente */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Cliente
            </label>
            <select
              value={form.customer_id}
              onChange={(e) => handleChange("customer_id", e.target.value)}
              disabled={loadingCustomers || isSubmitting}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              {customers.length === 0 ? (
                <option value="">No hay clientes registrados</option>
              ) : (
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))
              )}
            </select>
            {selectedCustomer && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedCustomer.phone ? `📞 ${selectedCustomer.phone}` : "📞 —"}{" "}
                {selectedCustomer.email ? `• ✉️ ${selectedCustomer.email}` : ""}
              </p>
            )}
          </div>

          {/* Patente */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Patente
            </label>
            <input
              required
              value={form.plate}
              onChange={(e) => handleChange("plate", e.target.value)}
              placeholder="AB-CD-12"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Año */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Año
            </label>
            <input
              type="number"
              min={1970}
              max={2100}
              value={form.year ?? ""}
              onChange={(e) => handleChange("year", e.target.value ? Number(e.target.value) : null)}
              placeholder="2018"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Marca */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Marca
            </label>
            <input
              value={form.brand ?? ""}
              onChange={(e) => handleChange("brand", e.target.value)}
              placeholder="Toyota"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Modelo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Modelo
            </label>
            <input
              value={form.model ?? ""}
              onChange={(e) => handleChange("model", e.target.value)}
              placeholder="Corolla"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Color
            </label>
            <input
              value={form.color ?? ""}
              onChange={(e) => handleChange("color", e.target.value)}
              placeholder="Blanco"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Kilometraje */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Kilometraje (km)
            </label>
            <input
              type="number"
              min={0}
              value={form.mileage_km ?? ""}
              onChange={(e) =>
                handleChange("mileage_km", e.target.value ? Number(e.target.value) : null)
              }
              placeholder="55000"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Observaciones */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Información relevante del vehículo (estado general, reparaciones importantes, etc.)."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
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

          <Button type="submit" disabled={isSubmitting || loadingCustomers || customers.length === 0} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Guardando..." : "Guardar vehículo"}
          </Button>
        </div>
      </form>
    </div>
  );
}