"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import BarcodeScanner from "@/components/inventory/barcode-scanner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

type InventoryApiItem = {
  id: string;
  code: string;
  barcode?: string | null;
  name: string;
};

export default function InventoryScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const handleDetected = async (barcode: string) => {
    try {
      setIsResolving(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/inventory/barcode/${encodeURIComponent(barcode)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (response.ok) {
        const item: InventoryApiItem = await response.json();
        router.push(`/dashboard/inventory/${item.id}/edit`);
        return;
      }

      if (response.status === 404) {
        router.push(
          `/dashboard/inventory/new?barcode=${encodeURIComponent(barcode)}`
        );
        return;
      }

      throw new Error("No se pudo buscar el código escaneado.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar el escaneo."
      );
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Escanear código de barras
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Usa la cámara del celular para buscar o registrar un repuesto.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <ScanLine className="h-4 w-4" />
          <span>Apunta la cámara al código de barras.</span>
        </div>

        <BarcodeScanner
          onDetected={handleDetected}
          onError={(message) => setError(message)}
        />

        {isResolving && (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Procesando código escaneado...
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
