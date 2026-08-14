"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  Trash2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
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
  customerEmail?: string;
  vehicle: string;
  plate: string;
  createdAt: string; // idealmente YYYY-MM-DD
  validUntil: string; // idealmente YYYY-MM-DD
  status: QuoteStatus;
};

type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

// MOCK solo para que la UI funcione. Luego se reemplaza por fetch a tu API.
const MOCK_QUOTES: Quote[] = [
  {
    id: "1",
    code: "P-00045",
    customer: "Juan Pérez",
    customerEmail: "juan.perez@example.com",
    vehicle: "Toyota Corolla 2018",
    plate: "AB-CD-12",
    createdAt: "2025-11-20",
    validUntil: "2025-11-27",
    status: "Aceptado",
  },
  {
    id: "2",
    code: "P-00046",
    customer: "María López",
    customerEmail: "maria.lopez@example.com",
    vehicle: "Hyundai Accent 2015",
    plate: "XX-YY-34",
    createdAt: "2025-11-22",
    validUntil: "2025-11-29",
    status: "Enviado",
  },
];

const MOCK_ITEMS_BY_QUOTE: Record<string, QuoteItem[]> = {
  "1": [
    {
      id: 1,
      description: "Cambio de pastillas de freno (delanteras)",
      quantity: 1,
      unitPrice: 65000,
    },
    {
      id: 2,
      description: "Rectificación de discos",
      quantity: 1,
      unitPrice: 45000,
    },
    {
      id: 3,
      description: "Mano de obra frenos",
      quantity: 1,
      unitPrice: 75000,
    },
  ],
  "2": [
    {
      id: 1,
      description: "Cambio aceite motor + filtro",
      quantity: 1,
      unitPrice: 55000,
    },
  ],
};

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const existingQuote = MOCK_QUOTES.find((q) => q.id === id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [items, setItems] = useState<QuoteItem[]>(
    MOCK_ITEMS_BY_QUOTE[id] ?? [
      { id: 1, description: "", quantity: 1, unitPrice: 0 },
    ]
  );

  if (!existingQuote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Presupuesto no encontrado
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No pudimos encontrar el presupuesto con identificador {id}.
        </p>
      </div>
    );
  }

  const [formState, setFormState] = useState({
    customer: existingQuote.customer,
    customerEmail: existingQuote.customerEmail ?? "",
    vehicle: existingQuote.vehicle,
    plate: existingQuote.plate,
    createdAt: existingQuote.createdAt,
    validUntil: existingQuote.validUntil,
    status: existingQuote.status as QuoteStatus,
  });

  const handleFormChange = (
    field: keyof typeof formState,
    value: string
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateItem = (
    itemId: number,
    field: keyof Omit<QuoteItem, "id">,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (field === "description") {
          return { ...item, description: value };
        }
        const numeric = Number(value.replace(",", ".")) || 0;
        return { ...item, [field]: numeric };
      })
    );
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPrice,
      0
    );
    const taxRate = 0.19;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formState,
      id: existingQuote.id,
      code: existingQuote.code,
      items: items.filter((i) => i.description.trim() !== ""),
      totals,
    };

    console.log("Actualizar presupuesto:", payload);

    // TODO: PATCH/PUT real a tu API FastAPI:
    // await fetch(`http://tu-api/quotes/${id}`, { method: "PUT", body: JSON.stringify(payload) });

    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/dashboard/quotes");
    }, 800);
  };

  const handleConfirmDelete = () => {
    console.log("Eliminar presupuesto:", existingQuote.id);

    // TODO: DELETE real a tu API FastAPI:
    // await fetch(`http://tu-api/quotes/${id}`, { method: "DELETE" });

    setIsDeleteOpen(false);
    router.push("/dashboard/quotes");
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/quotes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Editar presupuesto
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Modifica los datos del presupuesto{" "}
              <span className="font-semibold">{existingQuote.code}</span>.
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
          Eliminar presupuesto
        </Button>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800"
      >
        {/* Datos de cliente y vehículo */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Cliente
            </label>
            <input
              name="customer"
              required
              value={formState.customer}
              onChange={(e) =>
                handleFormChange("customer", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Email del cliente (opcional)
            </label>
            <input
              name="customerEmail"
              type="email"
              value={formState.customerEmail}
              onChange={(e) =>
                handleFormChange("customerEmail", e.target.value)
              }
              placeholder="cliente@correo.cl"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Vehículo (marca y modelo)
            </label>
            <input
              name="vehicle"
              required
              value={formState.vehicle}
              onChange={(e) =>
                handleFormChange("vehicle", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Patente
            </label>
            <input
              name="plate"
              required
              value={formState.plate}
              onChange={(e) =>
                handleFormChange("plate", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {/* Fechas y estado */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Fecha de emisión
            </label>
            <input
              name="createdAt"
              type="date"
              required
              value={formState.createdAt}
              onChange={(e) =>
                handleFormChange("createdAt", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Válido hasta
            </label>
            <input
              name="validUntil"
              type="date"
              required
              value={formState.validUntil}
              onChange={(e) =>
                handleFormChange("validUntil", e.target.value)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Estado
            </label>
            <select
              name="status"
              value={formState.status}
              onChange={(e) =>
                handleFormChange("status", e.target.value as QuoteStatus)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Borrador">Borrador</option>
              <option value="Enviado">Enviado</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="Vencido">Vencido</option>
            </select>
          </div>
        </div>

        {/* Ítems del presupuesto */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Detalle de ítems
            </h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 border-slate-300 dark:border-slate-700"
              onClick={addItem}
            >
              <Plus className="h-4 w-4" />
              Agregar ítem
            </Button>
          </div>

          <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
            <table className="min-w-full text-xs md:text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  <th className="px-3 py-2 font-medium">Descripción</th>
                  <th className="px-3 py-2 font-medium w-20 text-right">
                    Cant.
                  </th>
                  <th className="px-3 py-2 font-medium w-32 text-right">
                    Precio unitario
                  </th>
                  <th className="px-3 py-2 font-medium w-32 text-right">
                    Total
                  </th>
                  <th className="px-3 py-2 font-medium w-12 text-right" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPrice;
                  return (
                    <tr
                      key={item.id}
                      className={`border-t border-slate-200 dark:border-slate-800 ${
                        idx % 2 === 0
                          ? "bg-white/80 dark:bg-slate-900/80"
                          : "bg-slate-50/80 dark:bg-slate-900/60"
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Repuesto o servicio"
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs md:text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs md:text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        <input
                          type="number"
                          min={0}
                          step="100"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(
                              item.id,
                              "unitPrice",
                              e.target.value
                            )
                          }
                          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs md:text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100 align-middle">
                        {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ajusta los ítems y montos según lo acordado con el cliente. Los
            cambios no afectan presupuestos ya facturados (cuando conectemos con
            facturación).
          </p>
        </div>

        {/* Resumen de totales */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <FileText className="h-3 w-3" />
            <span>
              El total se recalcula automáticamente según los ítems
              actualizados (IVA 19% incluido).
            </span>
          </div>

          <div className="w-full max-w-sm rounded-xl border bg-slate-50 px-4 py-3 text-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">
                Subtotal
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-500 dark:text-slate-400">
                IVA (19%)
              </span>
              <span className="text-slate-700 dark:text-slate-200">
                {formatCurrency(totals.tax)}
              </span>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                Total presupuesto
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-slate-300 dark:border-slate-700"
          >
            <Link href="/dashboard/quotes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      {/* Modal de eliminación */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
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
                {existingQuote.code} · {existingQuote.customer}
              </span>
              . Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Asegúrate de que este presupuesto no esté asociado a una factura o
            trabajo ya realizado antes de eliminarlo.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
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
