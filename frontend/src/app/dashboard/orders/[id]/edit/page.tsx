"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Wrench,
  CarFront,
  User,
  Phone,
  CalendarDays,
  Clock,
  FileText,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  Camera,
  X,
} from "lucide-react";
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

type ExistingPhoto = {
  id: string;
  file_name: string;
  file_url: string;
};

type NewPhoto = {
  file: File;
  url: string;
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

type InventoryApiItem = {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
  category: string;
  stock: number;
  min_stock: number;
  location?: string | null;
  unit_cost: number;
  unit_price: number;
  supplier?: string | null;
};

type InventoryItemRef = {
  id: string;
  code: string;
  name: string;
  stock: number;
  unitPrice: number;
};

type OrderPartApiResponse = {
  id: string;
  order_id: string;
  inventory_item_id: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
  inventory_code: string;
  inventory_name: string;
  inventory_stock: number;
  line_total: number | string;
};

type OrderPartLine = {
  id: string;
  inventoryId: string;
  quantity: number;
  unitPrice: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const getStatusLabel = (status: OrderStatus) => status;
const getPriorityLabel = (priority: OrderPriority) => priority;

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

function mapOrderFromApi(order: OrderApiResponse): WorkOrder {
  return {
    id: order.id,
    code: order.code,
    plate: order.plate,
    vehicle: order.vehicle,
    customer: order.customer,
    phone: order.phone ?? undefined,
    createdAt: order.created_at,
    promisedAt: order.promised_at ?? undefined,
    status: order.status,
    priority: order.priority,
    total:
      typeof order.total === "number"
        ? order.total
        : order.total != null
        ? Number(order.total)
        : undefined,
    description: order.description ?? "",
    quoteId: order.quote_id ?? undefined,
    quoteCode: order.quote_code ?? undefined,
    images: order.images ?? [],
  };
}

function mapInventoryFromApi(item: InventoryApiItem): InventoryItemRef {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    stock: item.stock,
    unitPrice: Number(item.unit_price),
  };
}

function mapOrderPartFromApi(part: OrderPartApiResponse): OrderPartLine {
  return {
    id: part.id,
    inventoryId: part.inventory_item_id,
    quantity: part.quantity,
    unitPrice: Number(part.unit_price),
  };
}

export default function EditOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [existing, setExisting] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [inventoryItems, setInventoryItems] = useState<InventoryItemRef[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [parts, setParts] = useState<OrderPartLine[]>([]);
  const [partsLoading, setPartsLoading] = useState(true);
  const [partsError, setPartsError] = useState<string | null>(null);
  const [partActionLoading, setPartActionLoading] = useState(false);

  const [form, setForm] = useState({
    plate: "",
    vehicle: "",
    customer: "",
    phone: "",
    createdAt: "",
    promisedAt: "",
    status: "Abierta" as OrderStatus,
    priority: "Media" as OrderPriority,
    description: "",
    quoteCode: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isAddPartOpen, setIsAddPartOpen] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string>("");
  const [partQuantity, setPartQuantity] = useState<string>("1");

  useEffect(() => {
    return () => {
      newPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, [newPhotos]);

  const fetchParts = async (orderId: string) => {
    try {
      setPartsLoading(true);
      setPartsError(null);

      const response = await fetch(`${API_URL}/api/orders/${orderId}/parts`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudieron cargar los repuestos de la orden");
      }

      const data: OrderPartApiResponse[] = await response.json();
      setParts(data.map(mapOrderPartFromApi));
    } catch (err) {
      console.error(err);
      setPartsError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los repuestos de la orden."
      );
      setParts([]);
    } finally {
      setPartsLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setLoadingError(null);

        const response = await fetch(`${API_URL}/api/orders/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 404) {
          setExisting(null);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "No se pudo cargar la orden");
        }

        const data: OrderApiResponse = await response.json();
        const mapped = mapOrderFromApi(data);

        setExisting(mapped);
        setExistingPhotos(mapped.images ?? []);
        setDeletedPhotoIds([]);
        setNewPhotos([]);

        setForm({
          plate: mapped.plate,
          vehicle: mapped.vehicle,
          customer: mapped.customer,
          phone: mapped.phone ?? "",
          createdAt: mapped.createdAt,
          promisedAt: mapped.promisedAt ?? "",
          status: mapped.status,
          priority: mapped.priority,
          description: mapped.description ?? "",
          quoteCode: mapped.quoteCode ?? "",
        });

        await fetchParts(mapped.id);
      } catch (err) {
        console.error(err);
        setLoadingError(
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

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setInventoryLoading(true);
        setInventoryError(null);

        const response = await fetch(`${API_URL}/api/inventory`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "No se pudo cargar el inventario");
        }

        const data: InventoryApiItem[] = await response.json();
        setInventoryItems(data.map(mapInventoryFromApi));
      } catch (err) {
        console.error(err);
        setInventoryError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el inventario."
        );
        setInventoryItems([]);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const availableInventoryItems = useMemo(() => inventoryItems, [inventoryItems]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxPhotos = 8;
    const mapped = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setNewPhotos((prev) => {
      const combined = [...prev, ...mapped];
      return combined.slice(0, maxPhotos);
    });

    e.target.value = "";
  };

  const handleRemoveNewPhoto = (index: number) => {
    setNewPhotos((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return updated;
    });
  };

  const handleRemoveExistingPhoto = (photoId: string) => {
    setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
    setDeletedPhotoIds((prev) =>
      prev.includes(photoId) ? prev : [...prev, photoId]
    );
  };

  const findInventoryItem = (inventoryId: string) =>
    availableInventoryItems.find((i) => i.id === inventoryId);

  const partsTotal = parts.reduce(
    (acc, line) => acc + line.quantity * line.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!existing) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("created_at", form.createdAt);
      formData.append("promised_at", form.promisedAt || "");
      formData.append("status", form.status);
      formData.append("priority", form.priority);
      formData.append("description", form.description);

      deletedPhotoIds.forEach((photoId) => {
        formData.append("deleted_image_ids", photoId);
      });

      newPhotos.forEach((photo) => {
        formData.append("images", photo.file);
      });

      const response = await fetch(`${API_URL}/api/orders/${existing.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo actualizar la orden");
      }

      router.push(`/dashboard/orders/${existing.id}`);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la orden."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPart = async () => {
    if (!existing || !selectedInventoryId) return;

    const item = findInventoryItem(selectedInventoryId);
    if (!item) return;

    const qty = Math.max(1, Number(partQuantity) || 1);

    try {
      setPartActionLoading(true);

      const response = await fetch(`${API_URL}/api/orders/${existing.id}/parts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventory_item_id: item.id,
          quantity: qty,
          unit_price: item.unitPrice,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo agregar el repuesto");
      }

      await Promise.all([fetchParts(existing.id), (async () => {
        const inventoryResponse = await fetch(`${API_URL}/api/inventory`, {
          method: "GET",
          cache: "no-store",
        });
        if (inventoryResponse.ok) {
          const inventoryData: InventoryApiItem[] = await inventoryResponse.json();
          setInventoryItems(inventoryData.map(mapInventoryFromApi));
        }
      })()]);

      setIsAddPartOpen(false);
      setSelectedInventoryId("");
      setPartQuantity("1");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo agregar el repuesto."
      );
    } finally {
      setPartActionLoading(false);
    }
  };

  const handleRemovePart = async (lineId: string) => {
    if (!existing) return;

    try {
      setPartActionLoading(true);

      const response = await fetch(
        `${API_URL}/api/orders/${existing.id}/parts/${lineId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo eliminar el repuesto");
      }

      await Promise.all([fetchParts(existing.id), (async () => {
        const inventoryResponse = await fetch(`${API_URL}/api/inventory`, {
          method: "GET",
          cache: "no-store",
        });
        if (inventoryResponse.ok) {
          const inventoryData: InventoryApiItem[] = await inventoryResponse.json();
          setInventoryItems(inventoryData.map(mapInventoryFromApi));
        }
      })()]);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo eliminar el repuesto."
      );
    } finally {
      setPartActionLoading(false);
    }
  };

  const handleUpdatePartQuantity = async (lineId: string, value: string) => {
    if (!existing) return;

    const line = parts.find((p) => p.id === lineId);
    if (!line) return;

    const qty = Math.max(1, Number(value) || 1);

    try {
      setPartActionLoading(true);

      const response = await fetch(
        `${API_URL}/api/orders/${existing.id}/parts/${lineId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: qty,
            unit_price: line.unitPrice,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "No se pudo actualizar la cantidad");
      }

      await Promise.all([fetchParts(existing.id), (async () => {
        const inventoryResponse = await fetch(`${API_URL}/api/inventory`, {
          method: "GET",
          cache: "no-store",
        });
        if (inventoryResponse.ok) {
          const inventoryData: InventoryApiItem[] = await inventoryResponse.json();
          setInventoryItems(inventoryData.map(mapInventoryFromApi));
        }
      })()]);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la cantidad."
      );
    } finally {
      setPartActionLoading(false);
    }
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

  if (loadingError) {
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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {loadingError}
        </p>
      </div>
    );
  }

  if (!existing) {
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/orders/${existing.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Editar orden de trabajo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Modifica los datos de la orden{" "}
            <span className="font-semibold">{existing.code}</span>.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <CarFront className="h-4 w-4 text-slate-500" />
              Vehículo (marca y modelo)
            </label>
            <input
              value={form.vehicle}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Patente
            </label>
            <input
              value={form.plate}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <User className="h-4 w-4 text-slate-500" />
              Cliente
            </label>
            <input
              value={form.customer}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Phone className="h-4 w-4 text-slate-500" />
              Teléfono de contacto
            </label>
            <input
              value={form.phone}
              disabled
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              Fecha de creación
            </label>
            <input
              type="date"
              value={form.createdAt}
              onChange={(e) => handleChange("createdAt", e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Clock className="h-4 w-4 text-slate-500" />
              Fecha estimada de entrega
            </label>
            <input
              type="date"
              value={form.promisedAt}
              onChange={(e) => handleChange("promisedAt", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Estado
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                handleChange("status", e.target.value as OrderStatus)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Abierta">{getStatusLabel("Abierta")}</option>
              <option value="En proceso">{getStatusLabel("En proceso")}</option>
              <option value="En espera de repuestos">
                {getStatusLabel("En espera de repuestos")}
              </option>
              <option value="Finalizada">{getStatusLabel("Finalizada")}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Prioridad
            </label>
            <select
              value={form.priority}
              onChange={(e) =>
                handleChange("priority", e.target.value as OrderPriority)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Baja">{getPriorityLabel("Baja")}</option>
              <option value="Media">{getPriorityLabel("Media")}</option>
              <option value="Alta">{getPriorityLabel("Alta")}</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              Presupuesto asociado
            </label>
            <div className="grid gap-2 sm:grid-cols-[1.5fr,auto]">
              <input
                value={form.quoteCode}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
              {existing.quoteId && existing.quoteCode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                >
                  <Link href={`/dashboard/quotes/${existing.quoteId}/edit`}>
                    Ver {existing.quoteCode}
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Fotografías del vehículo
            </label>

            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">Evidencia fotográfica</span>
                    <span>Puedes ver las fotos guardadas y agregar nuevas.</span>
                  </div>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotosChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Agregar imágenes
                  </Button>
                </div>
              </div>

              {existingPhotos.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Imágenes guardadas
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {existingPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <img
                          src={photo.file_url}
                          alt={photo.file_name}
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingPhoto(photo.id)}
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                          aria-label="Eliminar foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {newPhotos.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Nuevas imágenes por guardar
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {newPhotos.map((photo, index) => (
                      <div
                        key={photo.url}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <img
                          src={photo.url}
                          alt={`Nueva foto ${index + 1}`}
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewPhoto(index)}
                          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                          aria-label="Eliminar foto"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingPhotos.length === 0 && newPhotos.length === 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Esta orden aún no tiene imágenes asociadas.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-300" />
              Descripción del trabajo
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              placeholder="Describe el problema y los trabajos a realizar."
            />
          </div>
        </div>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <Package className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Repuestos utilizados en esta orden
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Los repuestos y el stock ahora se manejan desde backend.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2 border-slate-300 dark:border-slate-700"
              onClick={() => setIsAddPartOpen(true)}
              disabled={partActionLoading}
            >
              <Plus className="h-4 w-4" />
              Agregar repuesto
            </Button>
          </div>

          {partsLoading ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cargando repuestos de la orden...
            </p>
          ) : partsError ? (
            <p className="text-[11px] text-red-600 dark:text-red-400">
              {partsError}
            </p>
          ) : parts.length === 0 ? (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Aún no has agregado repuestos a esta orden.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <table className="min-w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80">
                    <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      <th className="px-3 py-2 font-medium">Código</th>
                      <th className="px-3 py-2 font-medium">Repuesto</th>
                      <th className="px-3 py-2 font-medium text-right">Cant.</th>
                      <th className="px-3 py-2 font-medium text-right">
                        P. unitario
                      </th>
                      <th className="px-3 py-2 font-medium text-right">
                        Subtotal
                      </th>
                      <th className="px-3 py-2 font-medium text-right" />
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
                            <div className="flex flex-col">
                              <span>{item?.name ?? "Repuesto"}</span>
                              {item && item.stock <= 0 && (
                                <span className="text-[10px] text-red-500">
                                  Sin stock en bodega
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100">
                            <input
                              type="number"
                              min={1}
                              value={line.quantity}
                              disabled={partActionLoading}
                              onChange={(e) =>
                                handleUpdatePartQuantity(line.id, e.target.value)
                              }
                              className="w-16 rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:disabled:bg-slate-800"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100">
                            {formatCurrency(line.unitPrice)}
                          </td>
                          <td className="px-3 py-2 text-right text-slate-800 dark:text-slate-100">
                            {formatCurrency(lineTotal)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={partActionLoading}
                              onClick={() => handleRemovePart(line.id)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Cambiar cantidades o eliminar líneas ajusta el stock automáticamente.
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">
                  Total repuestos: {formatCurrency(partsTotal)}
                </span>
              </div>
            </>
          )}
        </section>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-slate-300 dark:border-slate-700"
          >
            <Link href={`/dashboard/orders/${existing.id}`}>Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <Dialog open={isAddPartOpen} onOpenChange={setIsAddPartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar repuesto desde inventario</DialogTitle>
            <DialogDescription className="pt-1 text-sm">
              Selecciona un repuesto registrado en el inventario y la cantidad a
              utilizar en esta orden.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Repuesto
              </label>
              <select
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                disabled={inventoryLoading || !!inventoryError || partActionLoading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:disabled:bg-slate-800"
              >
                <option value="">
                  {inventoryLoading
                    ? "Cargando inventario..."
                    : inventoryError
                    ? "No se pudo cargar inventario"
                    : "Selecciona un repuesto"}
                </option>
                {availableInventoryItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.name} — Stock: {item.stock} —{" "}
                    {formatCurrency(item.unitPrice)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                value={partQuantity}
                onChange={(e) => setPartQuantity(e.target.value)}
                className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            {inventoryError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
                {inventoryError}
              </div>
            )}

            {selectedInventoryId && (
              <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-300">
                <AlertTriangle className="mt-[1px] h-4 w-4" />
                <p>
                  Agregar este repuesto a la orden descontará stock automáticamente.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddPartOpen(false)}
              className="border-slate-300 dark:border-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddPart}
              disabled={
                !selectedInventoryId ||
                inventoryLoading ||
                !!inventoryError ||
                partActionLoading
              }
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {partActionLoading ? "Agregando..." : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}