"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  CarFront,
  ClipboardCheck,
  Loader2,
  Mic,
  MicOff,
  Save,
  User,
  Wrench,
} from "lucide-react";

type OrderStatus =
  | "Abierta"
  | "En proceso"
  | "Finalizada"
  | "En espera de repuestos";

type OrderPriority = "Baja" | "Media" | "Alta";

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
};

type WorkOrder = {
  id: string;
  code: string;
  plate: string;
  vehicle: string;
  customer: string;
  phone?: string;
  status: OrderStatus;
  priority: OrderPriority;
  description: string;
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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

function mapOrderFromApi(order: OrderApiResponse): WorkOrder {
  return {
    id: order.id,
    code: order.code,
    plate: order.plate,
    vehicle: order.vehicle,
    customer: order.customer,
    phone: order.phone ?? undefined,
    status: order.status,
    priority: order.priority,
    description: order.description ?? "",
  };
}

const statusOptions: OrderStatus[] = [
  "Abierta",
  "En proceso",
  "En espera de repuestos",
  "Finalizada",
];

export default function MechanicOrderPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [order, setOrder] = useState<WorkOrder | null>(null);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<OrderStatus>("En proceso");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/api/orders/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "No se pudo cargar la orden");
        }

        const data: OrderApiResponse = await response.json();
        const mapped = mapOrderFromApi(data);
        setOrder(mapped);
        setDescription(mapped.description);
        setStatus(mapped.status);
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

    if (id) fetchOrder();
  }, [id]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "es-CL";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
      setSavedMessage(null);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        setSpeechError("Debes permitir el acceso al microfono.");
        return;
      }

      if (event.error === "no-speech") {
        setSpeechError("No se detecto voz. Intenta hablar mas cerca.");
        return;
      }

      setSpeechError("No se pudo transcribir el audio.");
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      setDescription((finalTranscript + interimTranscript).trim());
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Already stopped.
      }
    };
  }, []);

  const handleStartDictation = () => {
    if (!recognitionRef.current) return;

    setSpeechError(null);
    finalTranscriptRef.current = description ? `${description} ` : "";

    try {
      recognitionRef.current.start();
    } catch {
      setSpeechError("No se pudo iniciar el dictado.");
    }
  };

  const handleStopDictation = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      setIsListening(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;

    try {
      setSaving(true);
      setError(null);
      setSavedMessage(null);

      const response = await fetch(`${API_URL}/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          status,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "No se pudo guardar la indicacion");
      }

      const data: OrderApiResponse = await response.json();
      const mapped = mapOrderFromApi(data);
      setOrder(mapped);
      setDescription(mapped.description);
      setStatus(mapped.status);
      setSavedMessage("Indicaciones guardadas.");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar las indicaciones."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-xl items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando orden...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Button variant="ghost" asChild className="gap-2 px-0">
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
          {error ?? "Orden no encontrada."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-2 px-0">
          <Link href={`/dashboard/orders/${order.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {order.code}
        </span>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <CarFront className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {order.vehicle || "Vehiculo sin detalle"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Patente {order.plate}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <User className="h-4 w-4 text-slate-400" />
            <span className="truncate">{order.customer}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prioridad
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {order.priority}
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Estado del trabajo
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {statusOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setStatus(option);
                setSavedMessage(null);
              }}
              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                status === option
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-200"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Indicaciones del mecanico
            </h3>
          </div>
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="sm"
            onClick={isListening ? handleStopDictation : handleStartDictation}
            disabled={!speechSupported}
            className="gap-2"
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                Detener
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Dictar
              </>
            )}
          </Button>
        </div>

        <textarea
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setSavedMessage(null);
          }}
          rows={10}
          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-base leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          placeholder="Dicta o escribe los trabajos a realizar, diagnostico, observaciones y repuestos necesarios."
        />

        <div className="mt-2 space-y-1">
          {isListening && (
            <p className="text-xs font-medium text-red-600 dark:text-red-300">
              Escuchando... habla claro cerca del celular.
            </p>
          )}
          {!speechSupported && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              El dictado no esta disponible en este navegador.
            </p>
          )}
          {speechError && (
            <p className="text-xs text-red-600 dark:text-red-300">
              {speechError}
            </p>
          )}
          {savedMessage && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              {savedMessage}
            </p>
          )}
          {error && (
            <p className="text-xs text-red-600 dark:text-red-300">{error}</p>
          )}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !description.trim()}
          className="h-12 w-full gap-2 text-base"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Guardar indicaciones
        </Button>
      </div>

      <div className="hidden md:block">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !description.trim()}
          className="h-11 gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar indicaciones
        </Button>
      </div>
    </div>
  );
}
