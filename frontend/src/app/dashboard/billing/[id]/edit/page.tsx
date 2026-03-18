"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type BillingStatus = "Pagada" | "Pendiente" | "Anulada";

type BillingFormState = {
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

type BillingDetailResponse = {
  id: string;
  number: string;
  date: string;
  customer_id: string;
  customer_name: string;
  order_id?: string | null;
  order_code?: string | null;
  total: number | string;
  payment_method: string;
  status: BillingStatus;
  created_at: string;
  updated_at: string;
};

type CustomerOption = {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  document_id?: string | null;
  address?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

export default function EditBillingPage() {
  const params = useParams();
  const router = useRouter();

  const billingId = String(params.id ?? "");

  const [docType, setDocType] = useState<"Factura" | "Boleta">("Factura");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [orderId, setOrderId] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  const [form, setForm] = useState<BillingFormState>({
    number: "",
    date: "",

    customerId: "",
    customerName: "",
    customerRut: "",
    customerGiro: "",
    customerAddress: "",
    customerComuna: "",
    customerCiudad: "",

    exento: "0",
    neto: "0",
    iva: "0",
    total: "0",

    paymentMethod: "Transferencia",
    status: "Pagada",
    observations: "",
  });

  const totalNumber = useMemo(() => Number(form.total) || 0, [form.total]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        setCustomersError(null);

        const response = await fetch(`${API_URL}/api/customers`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error();
        }

        const data: CustomerOption[] = await response.json();
        setCustomers(Array.isArray(data) ? data : []);
      } catch {
        setCustomers([]);
        setCustomersError("No se pudo cargar la lista de clientes.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(`${API_URL}/api/billing/${billingId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(
            data?.detail ||
              `No pudimos encontrar el documento de facturación con identificador ${billingId}.`
          );
        }

        const data: BillingDetailResponse = await response.json();

        setOrderId(data.order_id ?? "");
        setOrderCode(data.order_code ?? "");

        setDocType(data.number?.startsWith("B-") ? "Boleta" : "Factura");

        setForm({
          number: data.number ?? "",
          date: data.date ? String(data.date).slice(0, 10) : "",
          customerId: data.customer_id ?? "",
          customerName: data.customer_name ?? "",
          customerRut: "",
          customerGiro: "",
          customerAddress: "",
          customerComuna: "",
          customerCiudad: "",
          exento: String(Number(data.total ?? 0)),
          neto: "0",
          iva: "0",
          total: String(Number(data.total ?? 0)),
          paymentMethod: data.payment_method ?? "Transferencia",
          status: data.status ?? "Pagada",
          observations: "",
        });
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : `No pudimos encontrar el documento de facturación con identificador ${billingId}.`
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (billingId) {
      fetchBilling();
    }
  }, [billingId]);

  useEffect(() => {
    if (!customers.length || !form.customerId) return;

    const selected = customers.find((customer) => customer.id === form.customerId);
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      customerName: selected.full_name ?? prev.customerName,
      customerRut: selected.document_id ?? prev.customerRut,
      customerAddress: selected.address ?? prev.customerAddress,
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
    }));
  };

  const handleAmountChange = (
    field: "exento" | "neto" | "iva",
    value: string
  ) => {
    setForm((prev) => {
      const exento = field === "exento" ? value : prev.exento;
      const neto = field === "neto" ? value : prev.neto;
      const iva = field === "iva" ? value : prev.iva;

      const ex = Number(exento) || 0;
      const ne = Number(neto) || 0;
      const iv = Number(iva) || 0;

      return {
        ...prev,
        [field]: value,
        total: String(ex + ne + iv),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.customerId) {
      setSubmitError("Debes seleccionar un cliente registrado.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        number: form.number.trim(),
        date: form.date,
        customer_id: form.customerId,
        order_id: orderId || null,
        total: Number(form.total) || 0,
        payment_method: form.paymentMethod,
        status: form.status,
      };

      const response = await fetch(`${API_URL}/api/billing/${billingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "No se pudo actualizar el documento.");
      }

      router.push("/dashboard/billing");
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el documento."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border bg-white p-6 text-sm text-slate-600 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando documento...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm">{loadError}</p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/billing">Volver</Link>
          </Button>
        </div>
      </div>
    );
  }

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
            Editar factura/boleta
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Actualiza un documento de venta del taller Díaz & Díaz.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border bg-white p-6 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Tipo de documento
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDocType("Factura")}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                docType === "Factura"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100"
                  : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
              }`}
            >
              Factura
            </button>
            <button
              type="button"
              onClick={() => setDocType("Boleta")}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                docType === "Boleta"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-100"
                  : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300"
              }`}
            >
              Boleta
            </button>
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
              placeholder={docType === "Factura" ? "F-000125" : "B-000569"}
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

            {loadingCustomers ? (
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

            {customersError && (
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
              value={form.customerName}
              onChange={(e) => handleChange("customerName", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              RUT cliente
            </label>
            <input
              value={form.customerRut}
              onChange={(e) => handleChange("customerRut", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Giro
            </label>
            <input
              value={form.customerGiro}
              onChange={(e) => handleChange("customerGiro", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Dirección
            </label>
            <input
              value={form.customerAddress}
              onChange={(e) => handleChange("customerAddress", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Comuna
            </label>
            <input
              value={form.customerComuna}
              onChange={(e) => handleChange("customerComuna", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Ciudad
            </label>
            <input
              value={form.customerCiudad}
              onChange={(e) => handleChange("customerCiudad", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
              <FileText className="h-4 w-4 text-slate-500" />
              Orden asociada
            </label>
            {orderId && orderCode ? (
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

        <section className="rounded-xl border bg-slate-50/80 p-4 border-slate-200 dark:bg-slate-900/70 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Resumen de montos
          </h3>

          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                Monto exento
              </label>
              <input
                type="number"
                min={0}
                step={100}
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
                step={100}
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
                step={100}
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
            Observaciones
          </label>
          <textarea
            rows={3}
            value={form.observations}
            onChange={(e) => handleChange("observations", e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          <span>
            Esta edición está conectada a GET y PUT de billing.
          </span>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/billing">Cancelar</Link>
          </Button>

          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSubmitting ? "Guardando cambios..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}