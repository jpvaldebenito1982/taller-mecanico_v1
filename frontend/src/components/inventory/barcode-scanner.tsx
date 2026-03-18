"use client";

import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Props = {
  onDetected: (barcode: string) => void;
  onError?: (message: string) => void;
};

export default function BarcodeScanner({ onDetected, onError }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "inventory-barcode-reader";

  useEffect(() => {
    let cancelled = false;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 180 },
          },
          async (decodedText) => {
            if (cancelled) return;

            try {
              await scanner.stop();
            } catch {
              // ignore stop errors
            }

            onDetected(decodedText);
          },
          () => {
            // Ignoramos errores de frame individuales
          }
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudo iniciar la cámara.";
        onError?.(message);
      }
    };

    startScanner();

    return () => {
      cancelled = true;

      const stopScanner = async () => {
        const scanner = scannerRef.current;
        if (!scanner) return;

        try {
          await scanner.stop();
        } catch {
          // ignore
        }

        try {
          await scanner.clear();
        } catch {
          // ignore
        }
      };

      stopScanner();
    };
  }, [onDetected, onError]);

  return <div id={elementId} className="w-full overflow-hidden rounded-xl" />;
}