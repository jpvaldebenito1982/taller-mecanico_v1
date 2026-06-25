"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Package,
  Boxes,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type InventoryApiItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  location?: string | null;
  unit_cost: number;
  unit_price: number;
  supplier?: string | null;
};

type InventoryForm = {
  code: string;
  name: string;
  category: string;
  stock: string;
  minStock: string;
  unitCost: string;
  unitPrice: string;
  supplier: string;
  location: string;
};

const CATEGORY_OPTIONS = [
  "Frenos",
  "Motor",
  "Suspensión",
  "Embrague",
  "Eléctrico",
  "Otros",
];

export default function EditInventoryItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [existing, setExisting] = useState<InventoryApiItem | null>(null);
  const [form, setForm] = useState<InventoryForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const response = await fetch(`${API_URL}/api/inventory/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Repuesto no encontrado");
          }
          throw new Error("No se pudo cargar el repuesto");
        }

        const data: InventoryApiItem = await response.json();

        setExisting(data);
        setForm({
          code: data.code,
          name: data.name,
          category: data.category,
          stock: String(data.stock),
          minStock: String(data.min_stock),
          unitCost: String(Number(data.unit_cost)),
          unitPrice: String(Number(data.unit_price)),
          supplier: data.supplier ?? "",
          location: data.location ?? "",
        });
      } catch (err) {
        console.error(err);
        setLoadError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el repuesto."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchItem();
    }
  }, [id]);

  const handleChange = (field: keyof InventoryForm, value: string) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        stock: Number(form.stock) || 0,
        min_stock: Number(form.minStock) || 0,
        unit_cost: Number(form.unitCost) || 0,
        unit_price: Number(form.unitPrice) || 0,
        supplier: form.supplier.trim() || null,
        location: form.location.trim() || null,
      };

      const response = await fetch(`${API_URL}/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "No se pudo actualizar el repuesto.";

        try {
          const data = await response.json();
          if (data?.detail) {
            message =
              typeof data.detail === "string"
                ? data.detail
                : "No se pudo actualizar el repuesto.";
          }
        } catch {
          // no-op
        }

        throw new Error(message);
      }

      router.push("/dashboard/inventory");
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al actualizar el repuesto."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setSubmitError(null);

      const response = await fetch(`${API_URL}/api/inventory/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let message = "No se pudo eliminar el repuesto.";

        try {
          const data = await response.json();
          if (data?.detail) {
            message =
              typeof data.detail === "string"
                ? data.detail
                : "No se pudo eliminar el repuesto.";
          }
        } catch {
          // no-op
        }

        throw new Error(message);
      }

      setIsDeleteOpen(false);
      router.push("/dashboard/inventory");
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al eliminar el repuesto."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Cargando repuesto...
          </h2>
        </div>
      </div>
    );
  }

  if (loadError || !existing || !form) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Repuesto no encontrado
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {loadError ?? `No pudimos encontrar el repuesto con identificador ${id}.`}
        </p>
      </div>
    );
  }

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
              Editar repuesto
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Modifica los datos del repuesto{" "}
              <span className="font-semibold">{existing.code}</span>.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDeleteOpen(true)}
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar repuesto
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
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Nombre del repuesto
            </label>
            <input
              name="name"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
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
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Proveedor (opcional)
            </label>
            <input
              name="supplier"
              value={form.supplier}
              onChange={(e) => handleChange("supplier", e.target.value)}
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
              value={form.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
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
              value={form.minStock}
              onChange={(e) => handleChange("minStock", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
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
              value={form.unitCost}
              onChange={(e) => handleChange("unitCost", e.target.value)}
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
              value={form.unitPrice}
              onChange={(e) => handleChange("unitPrice", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-right text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Ubicación en bodega (opcional)
            </label>
            <input
              name="location"
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            {submitError}
          </div>
        )}

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
            {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <DialogTitle>Eliminar repuesto</DialogTitle>
            </div>
            <DialogDescription className="pt-2 text-sm">
              Estás a punto de eliminar el repuesto{" "}
              <span className="font-semibold">
                {existing.code} · {existing.name}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Asegúrate de que este repuesto no esté siendo usado en órdenes
            activas o pendientes de facturación antes de eliminarlo.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="border-slate-300 dark:border-slate-700"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
