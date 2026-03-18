"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Receipt,
  FileText,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type BillingDocumentType = "Factura" | "Boleta" | "Recibo";
type BillingStatus = "Pagada" | "Pendiente" | "Anulada";

type BillingFormState = {
  documentType: BillingDocumentType;
  number: string;
  date: string;

  customerId: string;
  customerName: string;
  customerRut: string;
  customerGiro: string;
  customerAddress: string;
  customerComuna: string;
  customerCiudad: string;

  exento: string;
  neto: string;
  iva: string;
  total: string;

  paymentMethod: string;
  status: BillingStatus;
  observations: string;
};

type CustomerOption = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  document_id?: string | null;
  address?: string | null;
  giro?: string | null;
  comuna?: string | null;
  city?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

const parseAmount = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function NewBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId") ?? "";
  const orderCode = searchParams.get("orderCode") ?? "";
  const customerIdFromOrder = searchParams.get("customerId") ?? "";
  const customerFromOrder = searchParams.get("customer") ?? "";
  const totalFromOrder = searchParams.get("total") ?? "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [form, setForm] = useState<BillingFormState>({
    documentType: "Factura",
    number: "",
    date: new Date().toISOString().slice(0, 10),

    customerId: customerIdFromOrder,
    customerName: customerFromOrder || "",
    customerRut: "",
    customerGiro: "",
    customerAddress: "",
    customerComuna: "",
    customerCiudad: "",

    exento: totalFromOrder || "0",
    neto: "0",
    iva: "0",
    total: totalFromOrder || "0",

    paymentMethod: "Transferencia",
    status: "Pagada",
    observations: "",
  });

  const hasOrderContext = Boolean(orderId && orderCode);
  const customerLockedByOrder = Boolean(customerIdFromOrder);

  const isFactura = form.documentType === "Factura";
  const isBoleta = form.documentType === "Boleta";
  const isRecibo = form.documentType === "Recibo";

  const totalNumber = useMemo(() => parseAmount(form.total), [form.total]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setCustomersError(null);

        const response = await fetch(`${API_URL}/api/customers`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar los clientes.");
        }

        const data: CustomerOption[] = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setCustomers([]);
        setCustomersError("No se pudo cargar la lista de clientes.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    if (!customers.length || !form.customerId) return;

    const selected = customers.find((customer) => customer.id === form.customerId);
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      customerName: selected.full_name ?? prev.customerName,
      customerRut: selected.document_id ?? prev.customerRut,
      customerAddress: selected.address ?? prev.customerAddress,
      customerGiro: selected.giro ?? prev.customerGiro,
      customerComuna: selected.comuna ?? prev.customerComuna,
      customerCiudad: selected.city ?? prev.customerCiudad,
    }));
  }, [customers, form.customerId]);

  const handleChange = (field: keyof BillingFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCustomerSelect = (customerId: string) => {
    const selected = customers.find((customer) => customer.id === customerId);

    setForm((prev) => ({
      ...prev,
      customerId,
      customerName: selected?.full_name ?? "",
      customerRut: selected?.document_id ?? "",
      customerAddress: selected?.address ?? "",
      customerGiro: selected?.giro ?? "",
      customerComuna: selected?.comuna ?? "",
      customerCiudad: selected?.city ?? "",
    }));
  };

  const handleDocumentTypeChange = (documentType: BillingDocumentType) => {
    setForm((prev) => {
      if (documentType === "Factura") {
        return {
          ...prev,
          documentType,
          exento: prev.exento || totalFromOrder || "0",
          neto: prev.neto || "0",
          iva: prev.iva || "0",
          total:
            String(
              parseAmount(prev.exento || "0") +
                parseAmount(prev.neto || "0") +
                parseAmount(prev.iva || "0")
            ) || "0",
        };
      }

      return {
        ...prev,
        documentType,
        exento: "0",
        neto: "0",
        iva: "0",
        total:
          prev.total && parseAmount(prev.total) > 0
            ? prev.total
            : totalFromOrder || "0",
      };
    });
  };

  const handleAmountChange = (
    field: "exento" | "neto" | "iva",
    value: string
  ) => {
    setForm((prev) => {
      const exento = field === "exento" ? value : prev.exento;
      const neto = field === "neto" ? value : prev.neto;
      const iva = field === "iva" ? value : prev.iva;

      const total = parseAmount(exento) + parseAmount(neto) + parseAmount(iva);

      return {
        ...prev,
        [field]: value,
        total: String(total),
      };
    });
  };

  const validateForm = () => {
    if (!form.number.trim()) {
      return "Debes ingresar el número del documento.";
    }

    if (!form.customerId) {
      return "Debes seleccionar un cliente registrado.";
    }

    if (!form.customerName.trim()) {
      return "Debes ingresar el nombre del cliente.";
    }

    if (parseAmount(form.total) <= 0) {
      return "El total debe ser mayor a 0.";
    }

    if (isFactura) {
      if (!form.customerRut.trim()) {
        return "Para Factura debes ingresar el RUT del cliente.";
      }
      if (!form.customerGiro.trim()) {
        return "Para Factura debes ingresar el giro.";
      }
      if (!form.customerAddress.trim()) {
        return "Para Factura debes ingresar la dirección.";
      }
      if (!form.customerComuna.trim()) {
        return "Para Factura debes ingresar la comuna.";
      }
      if (!form.customerCiudad.trim()) {
        return "Para Factura debes ingresar la ciudad.";
      }

      const expectedTotal =
        parseAmount(form.exento) + parseAmount(form.neto) + parseAmount(form.iva);

      if (expectedTotal !== parseAmount(form.total)) {
        return "En Factura el total debe ser igual a exento + neto + IVA.";
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        number: form.number.trim(),
        date: form.date,
        document_type: form.documentType,

        customer_id: form.customerId,
        customer_name: form.customerName.trim(),

        customer_rut: form.customerRut.trim() || null,
        customer_giro: isFactura ? form.customerGiro.trim() || null : null,
        customer_address: isFactura ? form.customerAddress.trim() || null : null,
        customer_comuna: isFactura ? form.customerComuna.trim() || null : null,
        customer_city: isFactura ? form.customerCiudad.trim() || null : null,

        order_id: orderId || null,
        order_code: orderCode || null,

        exento: isFactura ? parseAmount(form.exento) : 0,
        neto: isFactura ? parseAmount(form.neto) : 0,
        iva: isFactura ? parseAmount(form.iva) : 0,
        total: parseAmount(form.total),

        payment_method: form.paymentMethod,
        status: form.status,
        observations: form.observations.trim() || null,
      };

      const response = await fetch(`${API_URL}/api/billing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "No se pudo guardar el documento.");
      }

      router.push("/dashboard/billing");
    } catch (error) {
      console.error(error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el documento."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    isFactura ? "Nueva factura" : isBoleta ? "Nueva boleta" : "Nuevo recibo";

  const subtitle =
    isFactura
      ? "Registra una factura del taller Díaz & Díaz."
      : isBoleta
      ? "Registra una boleta del taller Díaz & Díaz."
      : "Registra un recibo de atención o pago del taller Díaz & Díaz.";

  const documentPlaceholder =
    form.documentType === "Factura"
      ? "FAC-000125"
      : form.documentType === "Boleta"
      ? "BOL-000569"
      : "REC-000031";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/billing">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {title}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Tipo de documento
            </span>
          </div>

          <div className="flex gap-2">
            {(["Factura", "Boleta", "Recibo"] as BillingDocumentType[]).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleDocumentTypeChange(type)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                    form.documentType === type
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100"
                      : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              N° documento
            </label>
            <input
              required
              value={form.number}
              onChange={(e) => handleChange("number", e.target.value)}
              placeholder={documentPlaceholder}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Fecha de emisión
            </label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Cliente registrado
            </label>

            {customerLockedByOrder ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                {form.customerName || "Cliente asociado a la orden"}
              </div>
            ) : loadingCustomers ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando clientes...
              </div>
            ) : (
              <select
                required
                value={form.customerId}
                onChange={(e) => handleCustomerSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="">Selecciona un cliente</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name}
                  </option>
                ))}
              </select>
            )}

            {customersError && !customerLockedByOrder && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {customersError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Cliente (razón social / nombre)
            </label>
            <input
              required
              value={form.customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
              placeholder="SERVICIOS WEB SPA"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              RUT cliente
            </label>
            <input
              value={form.customerRut}
              onChange={(e) => handleChange("customerRut", e.target.value)}
              placeholder="76.123.456-7"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          {isFactura && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Giro
                </label>
                <input
                  value={form.customerGiro}
                  onChange={(e) => handleChange("customerGiro", e.target.value)}
                  placeholder="Servicios automotrices"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Dirección
                </label>
                <input
                  value={form.customerAddress}
                  onChange={(e) => handleChange("customerAddress", e.target.value)}
                  placeholder="Hernando de Aguirre 1285"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Comuna
                </label>
                <input
                  value={form.customerComuna}
                  onChange={(e) => handleChange("customerComuna", e.target.value)}
                  placeholder="Providencia"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Ciudad
                </label>
                <input
                  value={form.customerCiudad}
                  onChange={(e) => handleChange("customerCiudad", e.target.value)}
                  placeholder="Santiago"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <FileText className="h-4 w-4 text-slate-500" />
              Orden asociada
            </label>

            {hasOrderContext ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
                <FileText className="h-3 w-3" />
                <span>{orderCode}</span>
              </div>
            ) : (
              <input
                disabled
                value="Sin orden asociada"
                className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400"
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Método de pago
            </label>
            <select
              value={form.paymentMethod}
              onChange={(e) => handleChange("paymentMethod", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Transferencia">Transferencia</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Resumen de montos
          </h3>

          {isFactura ? (
            <div className="grid gap-4 text-sm md:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Monto exento
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.exento}
                  onChange={(e) => handleAmountChange("exento", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Monto neto afecto
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.neto}
                  onChange={(e) => handleAmountChange("neto", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  IVA
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.iva}
                  onChange={(e) => handleAmountChange("iva", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Total
                </label>
                <input
                  readOnly
                  value={form.total}
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-right text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
                {totalNumber > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatCurrency(totalNumber)}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  Total
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.total}
                  onChange={(e) => handleChange("total", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                />
                {totalNumber > 0 && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatCurrency(totalNumber)}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Estado del documento
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as BillingStatus,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              >
                <option value="Pagada">Pagada</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Anulada">Anulada</option>
              </select>
            </div>
          </div>
        </section>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
            {isRecibo ? "Detalle de la atención" : "Observaciones"}
          </label>
          <textarea
            rows={3}
            value={form.observations}
            onChange={(e) => handleChange("observations", e.target.value)}
            placeholder={
              isRecibo
                ? "Detalle de la atención realizada, repuestos, mano de obra u observaciones."
                : "Comentarios adicionales."
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            El backend ahora enviará tipo de documento, datos del cliente,
            desglose tributario para factura, orden asociada, total, método de
            pago, estado y observaciones.
          </span>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            asChild
            className="border-slate-300 dark:border-slate-700"
          >
            <Link href="/dashboard/billing">Cancelar</Link>
          </Button>

          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Guardando documento..." : "Guardar documento"}
          </Button>
        </div>
      </form>
    </div>
  );
}