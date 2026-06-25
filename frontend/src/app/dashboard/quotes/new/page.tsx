"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  Trash2,
  DollarSign,
  Search,
  CheckCircle2,
  Info,
  UserRound,
  Wrench,
  Package,
} from "lucide-react";
import Link from "next/link";

type QuoteStatus =
  | "Borrador"
  | "Enviado"
  | "Aceptado"
  | "Rechazado"
  | "Vencido";

type QuoteMode = "registered" | "occasional";

type QuoteItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
};

type CustomerOption = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
};

type VehicleOption = {
  id: string;
  plate: string;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  customer_id?: string | null;
  customer_name?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

function todayDateInputValue() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildVehicleLabel(vehicle: VehicleOption) {
  return [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ");
}

export default function NewQuotePage() {
  const router = useRouter();

  const [mode, setMode] = useState<QuoteMode>("registered");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);

  const [laborItems, setLaborItems] = useState<QuoteItem[]>([
    { id: 1, description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [partItems, setPartItems] = useState<QuoteItem[]>([
    { id: 1, description: "", quantity: 1, unitPrice: 0 },
  ]);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [customerInput, setCustomerInput] = useState("");
  const [plateInput, setPlateInput] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [plate, setPlate] = useState("");

  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showVehicleResults, setShowVehicleResults] = useState(false);

  const customerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vehicleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const customerBoxRef = useRef<HTMLDivElement | null>(null);
  const vehicleBoxRef = useRef<HTMLDivElement | null>(null);

  const [freeCustomerName, setFreeCustomerName] = useState("");
  const [freeCustomerPhone, setFreeCustomerPhone] = useState("");
  const [freeCustomerEmail, setFreeCustomerEmail] = useState("");
  const [freeVehicleText, setFreeVehicleText] = useState("");
  const [freePlate, setFreePlate] = useState("");

  const [createdAt, setCreatedAt] = useState(todayDateInputValue());
  const [validUntil, setValidUntil] = useState(addDays(todayDateInputValue(), 7));
  const [status, setStatus] = useState<Exclude<QuoteStatus, "Vencido">>("Borrador");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (customerBoxRef.current && !customerBoxRef.current.contains(target)) {
        setShowCustomerResults(false);
      }

      if (vehicleBoxRef.current && !vehicleBoxRef.current.contains(target)) {
        setShowVehicleResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mode !== "registered") return;

    if (customerTimeoutRef.current) clearTimeout(customerTimeoutRef.current);

    if (!customerInput.trim()) {
      setCustomerOptions([]);
      return;
    }

    customerTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingCustomers(true);

        const response = await fetch(
          `${API_URL}/api/customers?search=${encodeURIComponent(
            customerInput.trim()
          )}`,
          { method: "GET", cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("No se pudieron buscar clientes");
        }

        const data: CustomerOption[] = await response.json();
        setCustomerOptions(data);
        setShowCustomerResults(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCustomers(false);
      }
    }, 300);

    return () => {
      if (customerTimeoutRef.current) clearTimeout(customerTimeoutRef.current);
    };
  }, [customerInput, mode]);

  useEffect(() => {
    if (mode !== "registered") return;

    if (vehicleTimeoutRef.current) clearTimeout(vehicleTimeoutRef.current);

    if (!plateInput.trim() || customerId) return;

    vehicleTimeoutRef.current = setTimeout(async () => {
      try {
        setLoadingVehicles(true);

        const response = await fetch(
          `${API_URL}/api/vehicles?search=${encodeURIComponent(
            plateInput.trim()
          )}`,
          { method: "GET", cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("No se pudieron buscar vehículos");
        }

        const data: VehicleOption[] = await response.json();
        setVehicleOptions(data);
        setShowVehicleResults(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingVehicles(false);
      }
    }, 300);

    return () => {
      if (vehicleTimeoutRef.current) clearTimeout(vehicleTimeoutRef.current);
    };
  }, [plateInput, customerId, mode]);

  const resetVehicleSelection = () => {
    setVehicleId("");
    setPlate("");
    setPlateInput("");
    setVehicleName("");
    setVehicleOptions([]);
    setShowVehicleResults(false);
  };

  const resetRegisteredSelection = () => {
    setCustomerId("");
    setVehicleId("");
    setCustomerInput("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    resetVehicleSelection();
  };

  const resetOccasionalFields = () => {
    setFreeCustomerName("");
    setFreeCustomerPhone("");
    setFreeCustomerEmail("");
    setFreeVehicleText("");
    setFreePlate("");
  };

  const handleChangeMode = (nextMode: QuoteMode) => {
    setMode(nextMode);
    setError(null);
    setHelperMessage(null);

    if (nextMode === "registered") {
      resetOccasionalFields();
    } else {
      resetRegisteredSelection();
      setCustomerOptions([]);
      setVehicleOptions([]);
      setShowCustomerResults(false);
      setShowVehicleResults(false);
    }
  };

  const loadVehiclesByCustomer = async (selectedCustomerId: string) => {
    try {
      setLoadingVehicles(true);
      setHelperMessage(null);

      const response = await fetch(
        `${API_URL}/api/vehicles?customer_id=${encodeURIComponent(
          selectedCustomerId
        )}`,
        { method: "GET", cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los vehículos del cliente");
      }

      const data: VehicleOption[] = await response.json();
      setVehicleOptions(data);

      if (data.length === 1) {
        const onlyVehicle = data[0];
        setVehicleId(onlyVehicle.id);
        setPlate(onlyVehicle.plate);
        setPlateInput(onlyVehicle.plate);
        setVehicleName(buildVehicleLabel(onlyVehicle));
        setShowVehicleResults(false);
        setHelperMessage(
          "Se seleccionó automáticamente el único vehículo registrado para este cliente."
        );
      } else if (data.length > 1) {
        setVehicleId("");
        setPlate("");
        setPlateInput("");
        setVehicleName("");
        setShowVehicleResults(true);
        setHelperMessage(
          "Este cliente tiene varios vehículos. Selecciona una patente para continuar."
        );
      } else {
        resetVehicleSelection();
        setHelperMessage(
          "Este cliente no tiene vehículos registrados. Debes registrar uno antes de crear el presupuesto."
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const handleSelectCustomer = async (customer: CustomerOption) => {
    setCustomerId(customer.id);
    setCustomerName(customer.full_name);
    setCustomerInput(customer.full_name);
    setCustomerEmail(customer.email ?? "");
    setCustomerPhone(customer.phone ?? "");
    setShowCustomerResults(false);

    resetVehicleSelection();
    await loadVehiclesByCustomer(customer.id);
  };

  const handleSelectVehicle = (vehicle: VehicleOption) => {
    setVehicleId(vehicle.id);
    setPlate(vehicle.plate);
    setPlateInput(vehicle.plate);
    setVehicleName(buildVehicleLabel(vehicle));
    setShowVehicleResults(false);
    setHelperMessage(null);

    if (!customerId && vehicle.customer_id) {
      setCustomerId(vehicle.customer_id);
    }

    if (!customerName && vehicle.customer_name) {
      setCustomerName(vehicle.customer_name);
      setCustomerInput(vehicle.customer_name);
    }
  };

  const addItem = (
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>
  ) => {
    setter((prev) => [
      ...prev,
      {
        id: prev.length ? prev[prev.length - 1].id + 1 : 1,
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (
    id: number,
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>
  ) => {
    setter((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (
    id: number,
    field: keyof Omit<QuoteItem, "id">,
    value: string,
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>
  ) => {
    setter((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (field === "description") {
          return { ...item, description: value };
        }
        const numeric = Number(value.replace(",", ".")) || 0;
        return { ...item, [field]: numeric };
      })
    );
  };

  const calcSubtotal = (items: QuoteItem[]) =>
    items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  const totals = useMemo(() => {
    const laborSubtotal = calcSubtotal(laborItems);
    const partsSubtotal = calcSubtotal(partItems);
    const subtotal = laborSubtotal + partsSubtotal;
    const taxRate = 0.19;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return {
      laborSubtotal,
      partsSubtotal,
      subtotal,
      tax,
      total,
    };
  }, [laborItems, partItems]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const validLaborItems = laborItems
        .filter((i) => i.description.trim() !== "")
        .map((item) => ({
          type: "labor",
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }));

      const validPartItems = partItems
        .filter((i) => i.description.trim() !== "")
        .map((item) => ({
          type: "part",
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.quantity * item.unitPrice,
        }));

      const validItems = [...validLaborItems, ...validPartItems];

      let payload: Record<string, unknown>;

      if (mode === "registered") {
        if (!customerId) {
          throw new Error("Debes seleccionar un cliente existente.");
        }

        if (!vehicleId) {
          throw new Error("Debes seleccionar un vehículo existente.");
        }

        payload = {
          customer_id: customerId,
          vehicle_id: vehicleId,
          created_at: createdAt,
          valid_until: validUntil,
          status,
          total: totals.total,
          notes: notes.trim() || null,
          labor_items: validLaborItems,
          part_items: validPartItems,
          items: validItems,
        };
      } else {
        if (!freeCustomerName.trim()) {
          throw new Error("Debes ingresar el nombre del cliente ocasional.");
        }

        if (!freeVehicleText.trim()) {
          throw new Error("Debes ingresar la descripción del vehículo.");
        }

        payload = {
          customer_name: freeCustomerName.trim(),
          customer_phone: freeCustomerPhone.trim() || null,
          customer_email: freeCustomerEmail.trim() || null,
          vehicle_text: freeVehicleText.trim(),
          plate: freePlate.trim().toUpperCase() || null,
          created_at: createdAt,
          valid_until: validUntil,
          status,
          total: totals.total,
          notes: notes.trim() || null,
          labor_items: validLaborItems,
          part_items: validPartItems,
          items: validItems,
        };
      }

      const response = await fetch(`${API_URL}/api/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo guardar el presupuesto");
      }

      router.push("/dashboard/quotes");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el presupuesto."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemsTable = (
    title: string,
    icon: React.ReactNode,
    items: QuoteItem[],
    setter: React.Dispatch<React.SetStateAction<QuoteItem[]>>,
    emptyLabel: string,
    placeholder: string
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h3>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2 border-slate-300 dark:border-slate-700"
          onClick={() => addItem(setter)}
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800/80">
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <th className="px-3 py-2 font-medium">Descripción</th>
              <th className="w-20 px-3 py-2 text-right font-medium">Cant.</th>
              <th className="w-32 px-3 py-2 text-right font-medium">
                Precio unitario
              </th>
              <th className="w-32 px-3 py-2 text-right font-medium">Total</th>
              <th className="w-12 px-3 py-2 text-right font-medium" />
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
                        updateItem(item.id, "description", e.target.value, setter)
                      }
                      placeholder={placeholder}
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 md:text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value, setter)
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 md:text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    <input
                      type="number"
                      min={0}
                      step="100"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateItem(item.id, "unitPrice", e.target.value, setter)
                      }
                      className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 md:text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right align-middle text-slate-800 dark:text-slate-100">
                    {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right align-middle">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id, setter)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
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
        {emptyLabel}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/quotes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Nuevo presupuesto
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Crea un nuevo presupuesto para enviar al cliente desde Díaz & Díaz.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {helperMessage && !error && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-500/10 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4" />
            <span>{helperMessage}</span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Tipo de presupuesto
          </h3>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleChangeMode("registered")}
              className={`rounded-xl border p-4 text-left transition ${
                mode === "registered"
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  Cliente registrado
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Usa un cliente y vehículo ya existentes en el sistema.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleChangeMode("occasional")}
              className={`rounded-xl border p-4 text-left transition ${
                mode === "occasional"
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                <span className="font-medium text-slate-900 dark:text-slate-50">
                  Cliente ocasional
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Cotiza para una persona que aún no existe como cliente.
              </p>
            </button>
          </div>
        </div>

        {mode === "registered" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div ref={customerBoxRef} className="relative space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Cliente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Busca un cliente por nombre"
                  value={customerInput}
                  onChange={(e) => {
                    setCustomerInput(e.target.value);
                    setCustomerId("");
                    setCustomerName("");
                    setCustomerEmail("");
                    setCustomerPhone("");
                    resetVehicleSelection();
                    setHelperMessage(null);
                  }}
                  onFocus={() => setShowCustomerResults(true)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              {customerId && (
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cliente seleccionado
                </div>
              )}

              {showCustomerResults && customerInput.trim() && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {loadingCustomers ? (
                    <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                      Buscando clientes...
                    </div>
                  ) : customerOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                      No se encontraron clientes.
                    </div>
                  ) : (
                    customerOptions.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleSelectCustomer(customer)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {customer.full_name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {customer.phone || customer.email || "Sin datos extra"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Email del cliente
              </label>
              <input
                value={customerEmail}
                readOnly
                placeholder="Se completa automáticamente"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
            </div>

            <div ref={vehicleBoxRef} className="relative space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Patente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder={
                    customerId
                      ? "Selecciona una patente del cliente"
                      : "Busca una patente"
                  }
                  value={plateInput}
                  onChange={(e) => {
                    setPlateInput(e.target.value);
                    setVehicleId("");
                    setPlate(e.target.value);
                    setVehicleName("");
                    setHelperMessage(null);
                  }}
                  onFocus={() =>
                    vehicleOptions.length > 0 && setShowVehicleResults(true)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              {vehicleId && (
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Vehículo seleccionado
                </div>
              )}

              {showVehicleResults && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {loadingVehicles ? (
                    <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                      Buscando vehículos...
                    </div>
                  ) : vehicleOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
                      No se encontraron vehículos.
                    </div>
                  ) : (
                    vehicleOptions.map((vehicle) => (
                      <button
                        key={vehicle.id}
                        type="button"
                        onClick={() => handleSelectVehicle(vehicle)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {vehicle.plate}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {buildVehicleLabel(vehicle) || "Vehículo sin descripción"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Vehículo (marca y modelo)
              </label>
              <input
                value={vehicleName}
                readOnly
                placeholder="Se completa automáticamente"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Nombre del cliente
              </label>
              <input
                value={freeCustomerName}
                onChange={(e) => setFreeCustomerName(e.target.value)}
                placeholder="Pedro Soto"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Teléfono
              </label>
              <input
                value={freeCustomerPhone}
                onChange={(e) => setFreeCustomerPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Email
              </label>
              <input
                type="email"
                value={freeCustomerEmail}
                onChange={(e) => setFreeCustomerEmail(e.target.value)}
                placeholder="cliente@correo.cl"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Patente
              </label>
              <input
                value={freePlate}
                onChange={(e) => setFreePlate(e.target.value.toUpperCase())}
                placeholder="ABCD12"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Vehículo
              </label>
              <input
                value={freeVehicleText}
                onChange={(e) => setFreeVehicleText(e.target.value)}
                placeholder="Toyota Yaris 2017"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Fecha de emisión
            </label>
            <input
              type="date"
              required
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Válido hasta
            </label>
            <input
              type="date"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Estado inicial
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as Exclude<QuoteStatus, "Vencido">)
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Borrador">Borrador</option>
              <option value="Enviado">Enviado</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Notas
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones generales del presupuesto."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>
        </div>

        {renderItemsTable(
          "Mano de obra",
          <Wrench className="h-4 w-4" />,
          laborItems,
          setLaborItems,
          "Registra aquí servicios, diagnósticos y trabajos realizados.",
          "Ej: cambio de pastillas, diagnóstico scanner, mantención"
        )}

        {renderItemsTable(
          "Repuestos e insumos",
          <Package className="h-4 w-4" />,
          partItems,
          setPartItems,
          "Registra aquí repuestos, materiales e insumos utilizados.",
          "Ej: filtro de aceite, pastillas de freno, líquido DOT4"
        )}

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <FileText className="h-3 w-3" />
            <span>
              El total se calcula automáticamente con mano de obra, repuestos e IVA.
            </span>
          </div>

          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">
                Mano de obra
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {formatCurrency(totals.laborSubtotal)}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300">
                Repuestos e insumos
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {formatCurrency(totals.partsSubtotal)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-300">
                Subtotal
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {formatCurrency(totals.subtotal)}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                IVA (19%)
              </span>
              <span className="text-slate-700 dark:text-slate-200">
                {formatCurrency(totals.tax)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
              <span className="flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-50">
                <DollarSign className="h-4 w-4" />
                Total presupuesto
              </span>
              <span className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

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
            {isSubmitting ? "Guardando presupuesto..." : "Guardar presupuesto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
