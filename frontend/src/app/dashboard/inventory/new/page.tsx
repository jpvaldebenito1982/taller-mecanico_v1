"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Package,
  Boxes,
  AlertCircle,
  ScanLine,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type InventoryCreatePayload = {
  code: string;
  barcode?: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  location?: string;
  unit_cost: number;
  unit_price: number;
  supplier?: string;
};

export default function NewInventoryItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const barcodeFromQuery = searchParams.get("barcode") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);

      const payload: InventoryCreatePayload = {
        code: String(formData.get("code") || "").trim(),
        barcode: String(formData.get("barcode") || "").trim() || undefined,
        name: String(formData.get("name") || "").trim(),
        category: String(formData.get("category") || "").trim(),
        stock: Number(formData.get("stock") || 0),
        min_stock: Number(formData.get("minStock") || 0),
        location: String(formData.get("location") || "").trim() || undefined,
        unit_cost: Number(formData.get("unitCost") || 0),
        unit_price: Number(formData.get("unitPrice") || 0),
        supplier: String(formData.get("supplier") || "").trim() || undefined,
      };

      const response = await fetch(`${API_URL}/api/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "No se pudo registrar el repuesto.";

        try {
          const data = await response.json();
          if (data?.detail) {
            message =
              typeof data.detail === "string"
                ? data.detail
                : "No se pudo registrar el repuesto.";
          }
        } catch {
          //
        }

        throw new Error(message);
      }

      router.push("/dashboard/inventory");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al registrar el repuesto."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Registrar nuevo repuesto
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Agrega un repuesto al inventario del taller Díaz & Díaz.
            </p>
          </div>
        </div>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/dashboard/inventory/scan">
            <ScanLine className="h-4 w-4" />
            Escanear con cámara
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Package className="h-4 w-4 text-slate-500" />
              Código interno
            </label>
            <input
              name="code"
              required
              placeholder="REP-0005"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Usa un código consistente para identificar rápidamente el
              repuesto.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Código de barras (opcional)
            </label>
            <input
              name="barcode"
              defaultValue={barcodeFromQuery}
              placeholder="7801234567890"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Puedes escribirlo, escanearlo con lector USB o cargarlo desde la
              cámara del celular.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Nombre del repuesto
            </label>
            <input
              name="name"
              required
              placeholder="Bujía iridium NGK"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Boxes className="h-4 w-4 text-slate-500" />
              Categoría
            </label>
            <select
              name="category"
              defaultValue="Frenos"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Frenos">Frenos</option>
              <option value="Motor">Motor</option>
              <option value="Suspensión">Suspensión</option>
              <option value="Embrague">Embrague</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Proveedor (opcional)
            </label>
            <input
              name="supplier"
              placeholder="Repuestos Chile Ltda."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Stock actual
            </label>
            <input
              name="stock"
              type="number"
              min={0}
              defaultValue={0}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Stock mínimo recomendado
            </label>
            <input
              name="minStock"
              type="number"
              min={0}
              defaultValue={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Se usará para alertar cuando el stock esté bajo.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Costo unitario (CLP)
            </label>
            <input
              name="unitCost"
              type="number"
              min={0}
              step="100"
              defaultValue={0}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Precio de venta (CLP)
            </label>
            <input
              name="unitPrice"
              type="number"
              min={0}
              step="100"
              defaultValue={0}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Ubicación en bodega (opcional)
            </label>
            <input
              name="location"
              placeholder="Estante A2, nivel medio"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <AlertCircle className="h-3 w-3" />
          <span>
            Más adelante podremos conectar este inventario con el consumo en
            órdenes de trabajo y la reposición automática.
          </span>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-slate-300 dark:border-slate-700"
          >
            <Link href="/dashboard/inventory">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Guardando repuesto..." : "Guardar repuesto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
