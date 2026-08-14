"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  FileText,
  Wrench,
  CalendarDays,
  Clock,
  CarFront,
  User,
  Phone,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
  Package,
  Printer,
} from "lucide-react";

type OrderStatus =
  | "Abierta"
  | "En proceso"
  | "Finalizada"
  | "En espera de repuestos";

type OrderPriority = "Baja" | "Media" | "Alta";

type ExistingPhoto = {
  id: string;
  file_name: string;
  file_url: string;
};

type WorkOrder = {
  id: string;
  code: string;
  plate: string;
  vehicle: string;
  customer: string;
  phone?: string;
  createdAt: string;
  promisedAt?: string;
  status: OrderStatus;
  priority: OrderPriority;
  total?: number;
  description?: string;
  quoteId?: string;
  quoteCode?: string;
  images: ExistingPhoto[];
};

type OrderApiResponse = {
  id: string;
  code: string;
  plate: string;
  vehicle: string;
  customer: string;
  phone?: string | null;
  created_at: string;
  promised_at?: string | null;
  status: OrderStatus;
  priority: OrderPriority;
  total?: number | string | null;
  description?: string | null;
  quote_id?: string | null;
  quote_code?: string | null;
  images?: ExistingPhoto[];
};

type OrderTimelineEvent = {
  id: string;
  label: string;
  date: string;
  description?: string;
  type: "info" | "success" | "warning";
};

type InventoryItemRef = {
  id: string;
  code: string;
  name: string;
  stock: number;
  unitPrice: number;
};

type OrderPartLine = {
  id: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

// Placeholder hasta conectar módulos reales
const TIMELINE_PLACEHOLDER: OrderTimelineEvent[] = [];
const INVENTORY_PLACEHOLDER: InventoryItemRef[] = [];
const ORDER_PARTS_PLACEHOLDER: OrderPartLine[] = [];

function formatDate(dateString?: string | null) {
  if (!dateString) return undefined;

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("es-CL");
}

function mapOrderFromApi(order: OrderApiResponse): WorkOrder {
  return {
    id: order.id,
    code: order.code,
    plate: order.plate,
    vehicle: order.vehicle,
    customer: order.customer,
    phone: order.phone ?? undefined,
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
    description: order.description ?? undefined,
    quoteId: order.quote_id ?? undefined,
    quoteCode: order.quote_code ?? undefined,
    images: order.images ?? [],
  };
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });
};

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

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeline = TIMELINE_PLACEHOLDER;
  const parts = ORDER_PARTS_PLACEHOLDER;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/orders/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 404) {
          setOrder(null);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "No se pudo cargar la orden");
        }

        const data: OrderApiResponse = await response.json();
        setOrder(mapOrderFromApi(data));
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar la orden de trabajo."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const findInventoryItem = (inventoryId: string) =>
    INVENTORY_PLACEHOLDER.find((i) => i.id === inventoryId);

  const partsTotal = parts.reduce((acc, line) => {
    return acc + line.quantity * line.unitPrice;
  }, 0);

  const handlePrintPdf = async () => {
    if (!order) return;

    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 15;
    const marginY = 18;
    let y = marginY;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 20) {
        doc.addPage();
        y = marginY;
      }
    };

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Díaz & Díaz", marginX, 13);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Taller mecánico automotriz", marginX, 19);

    const today = new Date().toLocaleDateString("es-CL");
    doc.text(`OT ${order.code}`, pageWidth - marginX, 11, {
      align: "right",
    });
    doc.text(`Fecha impresión: ${today}`, pageWidth - marginX, 17, {
      align: "right",
    });

    doc.setTextColor(0, 0, 0);
    y = 36;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Datos del cliente y vehículo", marginX, y);
    y += 4;

    const boxClientHeight = 24;
    ensureSpace(boxClientHeight + 4);

    doc.setDrawColor(209, 213, 219);
    doc.rect(marginX, y, pageWidth - marginX * 2, boxClientHeight, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let innerY = y + 7;
    const innerX = marginX + 4;

    doc.text(`Cliente: ${order.customer}`, innerX, innerY);
    innerY += 5;
    doc.text(`Teléfono: ${order.phone ?? "—"}`, innerX, innerY);
    innerY += 5;
    doc.text(`Vehículo: ${order.vehicle}`, innerX, innerY);
    innerY += 5;
    doc.text(`Patente: ${order.plate}`, innerX, innerY);

    y += boxClientHeight + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Información de la orden", marginX, y);
    y += 4;

    const boxOrderHeight = 20;
    ensureSpace(boxOrderHeight + 4);

    doc.setDrawColor(209, 213, 219);
    doc.rect(marginX, y, pageWidth - marginX * 2, boxOrderHeight, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    innerY = y + 7;

    doc.text(`Creación: ${order.createdAt}`, innerX, innerY);
    innerY += 5;
    doc.text(`Entrega estimada: ${order.promisedAt ?? "—"}`, innerX, innerY);
    innerY += 5;
    doc.text(
      `Estado: ${order.status}   ·   Prioridad: ${order.priority}`,
      innerX,
      innerY
    );

    y += boxOrderHeight + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Descripción del trabajo", marginX, y);
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const descText = order.description || "";
    const descLines = doc.splitTextToSize(
      descText,
      pageWidth - marginX * 2 - 4
    );
    const descHeight = descLines.length * 5 + 6;

    ensureSpace(descHeight + 4);

    doc.setDrawColor(229, 231, 235);
    doc.rect(marginX, y, pageWidth - marginX * 2, descHeight, "S");
    doc.text(descLines, marginX + 2, y + 7);
    y += descHeight + 10;

    if (parts.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Repuestos utilizados", marginX, y);
      y += 4;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      ensureSpace(14);

      const tableWidth = pageWidth - marginX * 2;
      const colCodeX = marginX;
      const colDescX = marginX + 24;
      const colQtyX = pageWidth - marginX - 40;
      const colUnitX = pageWidth - marginX - 22;
      const colSubX = pageWidth - marginX;

      doc.setDrawColor(148, 163, 184);
      doc.line(marginX, y, marginX + tableWidth, y);
      y += 5;

      doc.setFont("helvetica", "bold");
      doc.text("Cód.", colCodeX, y);
      doc.text("Descripción", colDescX, y);
      doc.text("Cant.", colQtyX, y, { align: "right" });
      doc.text("P. unit.", colUnitX, y, { align: "right" });
      doc.text("Subtotal", colSubX, y, { align: "right" });

      y += 3;
      doc.line(marginX, y, marginX + tableWidth, y);
      y += 4;
      doc.setFont("helvetica", "normal");

      parts.forEach((line) => {
        ensureSpace(6);
        const item = findInventoryItem(line.inventoryId);
        const lineTotal = line.quantity * line.unitPrice;

        doc.text(item?.code ?? "-", colCodeX, y);
        doc.text(item?.name ?? "Repuesto", colDescX, y);
        doc.text(String(line.quantity), colQtyX, y, { align: "right" });
        doc.text(formatCurrency(line.unitPrice), colUnitX, y, {
          align: "right",
        });
        doc.text(formatCurrency(lineTotal), colSubX, y, { align: "right" });

        y += 5;
      });

      doc.setDrawColor(148, 163, 184);
      doc.line(marginX, y, marginX + tableWidth, y);
      y += 8;
    }

    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Resumen de montos", marginX, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    if (parts.length > 0) {
      doc.text(`Total repuestos: ${formatCurrency(partsTotal)}`, marginX, y);
      y += 5;
    }

    if (order.total !== undefined) {
      doc.text(`Total estimado orden: ${formatCurrency(order.total)}`, marginX, y);
      y += 5;
    }

    y += 10;
    ensureSpace(40);

    const lineY = y + 12;
    const signatureWidth = 60;

    doc.setDrawColor(148, 163, 184);
    doc.line(marginX, lineY, marginX + signatureWidth, lineY);
    doc.setFontSize(10);
    doc.text("Firma cliente", marginX, lineY + 5);

    const rightX = pageWidth - marginX - signatureWidth;
    doc.line(rightX, lineY, rightX + signatureWidth, lineY);
    doc.text("Firma taller", rightX, lineY + 5);

    doc.save(`OT-${order.code}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Cargando orden...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Error al cargar la orden
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Orden no encontrada
          </h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No pudimos encontrar la orden de trabajo con identificador {id}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {order.code}
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getPriorityClasses(
                  order.priority
                )}`}
              >
                Prioridad {order.priority}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {order.vehicle} · Patente {order.plate}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.quoteId && order.quoteCode && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
            >
              <Link href={`/dashboard/quotes/${order.quoteId}/edit`}>
                <FileText className="h-4 w-4" />
                Ver presupuesto {order.quoteCode}
              </Link>
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintPdf}
            className="gap-2 border-slate-300 dark:border-slate-600"
          >
            <Printer className="h-4 w-4" />
            Imprimir OT (PDF)
          </Button>

          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href={`/dashboard/orders/${order.id}/edit`}>
              <Pencil className="h-4 w-4" />
              Editar orden
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                <CarFront className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Datos del vehículo
              </h3>
            </div>

            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Vehículo
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {order.vehicle}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Patente
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {order.plate}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <User className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Datos del cliente
              </h3>
            </div>

            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Nombre
                </dt>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {order.customer}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Teléfono
                </dt>
                <dd className="inline-flex items-center gap-1 text-slate-900 dark:text-slate-50">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {order.phone ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <Wrench className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Descripción del trabajo
              </h3>
            </div>

            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              {order.description ?? "—"}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  <Package className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Repuestos utilizados
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                (pendiente de conexión)
              </span>
            </div>

            {parts.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta orden aún no tiene repuestos asociados. Cuando conectes el
                módulo de inventario, se mostrarán aquí.
              </p>
            ) : (
              <>
                <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80">
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        <th className="px-3 py-2 font-medium">Código</th>
                        <th className="px-3 py-2 font-medium">Descripción</th>
                        <th className="px-3 py-2 font-medium text-right">Cant.</th>
                        <th className="px-3 py-2 font-medium text-right">P. unitario</th>
                        <th className="px-3 py-2 font-medium text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map((line) => {
                        const item = findInventoryItem(line.inventoryId);
                        const lineTotal = line.quantity * line.unitPrice;

                        return (
                          <tr
                            key={line.id}
                            className="border-t border-slate-100 dark:border-slate-800"
                          >
                            <td className="px-3 py-2 font-medium text-slate-900 dark:text-slate-50">
                              {item?.code ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                              {item?.name ?? "Repuesto eliminado del inventario"}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100">
                              {line.quantity}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100">
                              {formatCurrency(line.unitPrice)}
                            </td>
                            <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100">
                              {formatCurrency(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    Total referencial de repuestos usados.
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">
                    Total repuestos: {formatCurrency(partsTotal)}
                  </span>
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Fotografías del vehículo al ingreso
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {order.images.length} imagen{order.images.length === 1 ? "" : "es"}
              </span>
            </div>

            {order.images.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta orden no tiene imágenes asociadas.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {order.images.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    title={photo.file_name}
                  >
                    <img
                      src={photo.file_url}
                      alt={photo.file_name}
                      className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="border-t border-slate-200 px-2 py-1.5 text-[11px] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      <span className="block truncate">{photo.file_name}</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4 md:col-span-1">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
              Resumen de la orden
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <span>Fecha de creación</span>
                </div>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {order.createdAt}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Entrega estimada</span>
                </div>
                <dd className="font-medium text-slate-900 dark:text-slate-50">
                  {order.promisedAt ?? "—"}
                </dd>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 dark:border-slate-700">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Total estimado
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {formatCurrency(order.total)}
                </span>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Presupuesto asociado
              </h3>
            </div>

            {order.quoteId && order.quoteCode ? (
              <div className="space-y-2 text-sm">
                <p className="text-slate-700 dark:text-slate-200">
                  Esta orden fue generada a partir del presupuesto{" "}
                  <span className="font-semibold">{order.quoteCode}</span>.
                </p>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                >
                  <Link href={`/dashboard/quotes/${order.quoteId}/edit`}>
                    <FileText className="h-4 w-4" />
                    Ver presupuesto {order.quoteCode}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <AlertCircle className="mt-[2px] h-4 w-4" />
                <p>
                  Esta orden no tiene un presupuesto asociado. Puedes crear o
                  vincular uno desde el módulo de presupuestos.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Historial de la orden
              </h3>
            </div>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aún no hay eventos registrados para esta orden.
              </p>
            ) : (
              <ol className="space-y-3 text-sm">
                {timeline.map((event, idx) => (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          event.type === "success"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                            : event.type === "warning"
                            ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                            : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx < timeline.length - 1 && (
                        <div className="mt-1 h-full w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-50">
                          {event.label}
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {event.date}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {order.status === "Finalizada" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                Esta orden está marcada como finalizada. Más adelante podrás
                conectarla con el módulo de facturación.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
