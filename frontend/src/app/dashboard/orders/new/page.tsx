"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Save,
  Wrench,
  Camera,
  X,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  Info,
  Mic,
  MicOff,
} from "lucide-react";
import Link from "next/link";

type PreviewPhoto = {
  file: File;
  url: string;
};

type QuoteDetailResponse = {
  id: string;
  code: string;
  customer_id: string;
  customer: string;
  vehicle_id: string;
  vehicle: string;
  plate: string;
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

type SpeechRecognitionType = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          [key: number]: {
            [key: number]: { transcript: string };
            isFinal: boolean;
          };
          length: number;
        };
      }) => void)
    | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionType;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

function todayDateInputValue() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildVehicleLabel(vehicle: VehicleOption) {
  return [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ");
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helperMessage, setHelperMessage] = useState<string | null>(null);

  const [photos, setPhotos] = useState<PreviewPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const quoteId = searchParams.get("quoteId");
  const initialQuoteCode = searchParams.get("quoteCode") ?? "";

  const [quoteCode, setQuoteCode] = useState(initialQuoteCode);
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [customerInput, setCustomerInput] = useState("");
  const [plateInput, setPlateInput] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [vehicleName, setVehicleName] = useState("");
  const [plate, setPlate] = useState("");

  const [phone, setPhone] = useState("");
  const [createdAt, setCreatedAt] = useState(todayDateInputValue());
  const [promisedAt, setPromisedAt] = useState("");
  const [priority, setPriority] = useState<"Alta" | "Media" | "Baja">("Media");
  const [status, setStatus] = useState<
    "Abierta" | "En proceso" | "En espera de repuestos" | "Finalizada"
  >("Abierta");
  const [description, setDescription] = useState("");

  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([]);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [showVehicleResults, setShowVehicleResults] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const recognitionConstructorRef = useRef<SpeechRecognitionConstructor | null>(null);
  const dictationBaseRef = useRef("");

  const customerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vehicleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const customerBoxRef = useRef<HTMLDivElement | null>(null);
  const vehicleBoxRef = useRef<HTMLDivElement | null>(null);

  const linkedFromQuote = useMemo(() => !!quoteId, [quoteId]);

  const resetVehicleSelection = () => {
    setVehicleId("");
    setPlate("");
    setPlateInput("");
    setVehicleName("");
    setVehicleOptions([]);
    setShowVehicleResults(false);
  };

  const resetCustomerSelection = () => {
    setCustomerId("");
    setCustomerName("");
    setCustomerInput("");
    setPhone("");
    resetVehicleSelection();
  };

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
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    recognitionConstructorRef.current = SpeechRecognitionCtor;

    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        //
      }
      recognitionRef.current = null;
      recognitionConstructorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      if (!quoteId) return;

      try {
        setIsLoadingQuote(true);
        setError(null);
        setHelperMessage(null);

        const response = await fetch(`${API_URL}/api/quotes/${quoteId}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `No se pudo cargar el presupuesto asociado. ${errorText}`
          );
        }

        const data: QuoteDetailResponse = await response.json();

        setQuoteCode(data.code ?? "");
        setCustomerId(data.customer_id ?? "");
        setVehicleId(data.vehicle_id ?? "");
        setCustomerName(data.customer ?? "");
        setVehicleName(data.vehicle ?? "");
        setPlate(data.plate ?? "");
        setCustomerInput(data.customer ?? "");
        setPlateInput(data.plate ?? "");
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el presupuesto asociado."
        );
      } finally {
        setIsLoadingQuote(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  useEffect(() => {
    if (linkedFromQuote) return;

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
  }, [customerInput, linkedFromQuote]);

  useEffect(() => {
    if (linkedFromQuote) return;
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
  }, [plateInput, customerId, linkedFromQuote]);

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
          "Este cliente no tiene vehículos registrados. Debes registrar uno antes de crear la orden."
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
    setPhone(customer.phone ?? "");
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

  const handleStartDictation = () => {
    const SpeechRecognitionCtor = recognitionConstructorRef.current;
    if (!SpeechRecognitionCtor) return;

    setSpeechError(null);
    dictationBaseRef.current = description ? `${description.trim()} ` : "";

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-CL";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
      if (recognitionRef.current !== recognition) return;
      setIsListening(true);
    };
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      setIsListening(false);
      if (event.error === "not-allowed") {
        setSpeechError("Debes permitir acceso al micrófono para usar el dictado.");
      } else if (event.error === "no-speech") {
        setSpeechError("No se detectó voz. Intenta hablar más cerca del micrófono.");
      } else {
        setSpeechError("No se pudo transcribir el audio.");
      }
    };
    recognition.onresult = (event) => {
      if (recognitionRef.current !== recognition) return;
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += `${transcript} `;
        else interimTranscript += transcript;
      }
      setDescription(
        `${dictationBaseRef.current}${finalTranscript}${interimTranscript}`.trim()
      );
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setSpeechError("No se pudo iniciar el dictado.");
    }
  };

  const handleStopDictation = () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    setIsListening(false);
    try {
      recognition?.stop();
    } catch {
      //
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      if (!customerId) {
        throw new Error("Debes seleccionar un cliente existente.");
      }

      if (!vehicleId) {
        throw new Error("Debes seleccionar un vehículo existente.");
      }

      const formData = new FormData();
      formData.append("customer_id", customerId);
      formData.append("vehicle_id", vehicleId);
      formData.append("quote_id", quoteId || "");
      formData.append("created_at", createdAt);
      formData.append("promised_at", promisedAt || "");
      formData.append("priority", priority);
      formData.append("status", status);
      formData.append("description", description);
      formData.append("phone", phone);

      photos.forEach((photo) => {
        formData.append("images", photo.file);
      });

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`No se pudo crear la orden. ${errorText}`);
      }

      router.push("/dashboard/orders");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo crear la orden."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const maxPhotos = 8;

    const mapped = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPhotos((prev) => {
      const combined = [...prev, ...mapped];
      return combined.slice(0, maxPhotos);
    });

    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Nueva orden de trabajo
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Registra una nueva orden para los servicios realizados en Díaz & Díaz y deja evidencia del estado del vehículo al ingreso.
          </p>

          {linkedFromQuote && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <LinkIcon className="h-3 w-3" />
              Orden generada a partir del presupuesto{" "}
              <span className="font-semibold">{quoteCode || quoteId}</span>
            </div>
          )}
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
        encType="multipart/form-data"
        className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {quoteId && <input type="hidden" name="quoteId" value={quoteId} />}
        {customerId && <input type="hidden" name="customer_id" value={customerId} />}
        {vehicleId && <input type="hidden" name="vehicle_id" value={vehicleId} />}

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
                  setPhone("");
                  resetVehicleSelection();
                  setHelperMessage(null);
                }}
                onFocus={() => !linkedFromQuote && setShowCustomerResults(true)}
                disabled={linkedFromQuote || isLoadingQuote}
                className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:disabled:bg-slate-800"
              />
            </div>

            {customerId && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Cliente seleccionado
              </div>
            )}

            {showCustomerResults && !linkedFromQuote && customerInput.trim() && (
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
                  !linkedFromQuote && vehicleOptions.length > 0 && setShowVehicleResults(true)
                }
                disabled={linkedFromQuote || isLoadingQuote}
                className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:disabled:bg-slate-800"
              />
            </div>

            {vehicleId && (
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Vehículo seleccionado
              </div>
            )}

            {showVehicleResults && !linkedFromQuote && (
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
              Vehículo
            </label>
            <input
              value={vehicleName}
              readOnly
              placeholder="Se completa automáticamente"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Teléfono de contacto
            </label>
            <input
              name="phone"
              placeholder="+56 9 1234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Fecha de creación
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
              Fecha estimada de entrega
            </label>
            <input
              type="date"
              value={promisedAt}
              onChange={(e) => setPromisedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as "Alta" | "Media" | "Baja")
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Estado inicial
            </label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "Abierta"
                    | "En proceso"
                    | "En espera de repuestos"
                    | "Finalizada"
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            >
              <option value="Abierta">Abierta</option>
              <option value="En proceso">En proceso</option>
              <option value="En espera de repuestos">
                En espera de repuestos
              </option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Presupuesto asociado
            </label>
            <input
              placeholder="P-00045"
              value={quoteCode}
              onChange={(e) => setQuoteCode(e.target.value)}
              disabled={linkedFromQuote || isLoadingQuote}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:disabled:bg-slate-800"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Fotografías del vehículo al ingreso{" "}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                (opcional)
              </span>
            </label>

            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      Adjunta fotos como evidencia
                    </span>
                    <span>
                      Toma fotos de rayones, golpes, nivel de combustible u
                      otros detalles relevantes.
                    </span>
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
                    Seleccionar imágenes
                  </Button>
                </div>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div
                      key={photo.url}
                      className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        aria-label="Eliminar foto"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aún no has agregado imágenes. Este paso es opcional, pero
                  recomendable para dejar constancia del estado del vehículo.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Descripción del trabajo
              </label>

              {speechSupported && (
                <Button
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  size="sm"
                  onClick={isListening ? handleStopDictation : handleStartDictation}
                  className="gap-2"
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Detener dictado
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Dictar
                    </>
                  )}
                </Button>
              )}
            </div>

            <textarea
              rows={4}
              required
              placeholder="Describe el problema reportado por el cliente y los trabajos a realizar."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                dictationBaseRef.current = e.target.value
                  ? `${e.target.value.trim()} `
                  : "";
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />

            {isListening && (
              <p className="text-xs text-emerald-600 dark:text-emerald-300">
                Escuchando... habla para transcribir en la descripción.
              </p>
            )}

            {!speechSupported && (
              <p className="text-xs text-amber-600 dark:text-amber-300">
                El dictado por voz no está disponible en este navegador.
              </p>
            )}

            {speechError && (
              <p className="text-xs text-red-600 dark:text-red-300">
                {speechError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Wrench className="h-3 w-3" />
            <span>
              Más adelante podrás asociar repuestos y mano de obra a esta orden
              cuando conectemos el módulo de facturación.
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              asChild
              className="border-slate-300 dark:border-slate-700"
            >
              <Link href="/dashboard/orders">Cancelar</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingQuote}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Creando orden..." : "Crear orden"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
