import { useEffect, useRef } from "react";
import type { EventoDualSense } from "@calm-aim/core";

const COLLECTOR_URL =
  (import.meta.env["VITE_COLLECTOR_URL"] as string | undefined) ??
  "ws://localhost:3002";

/**
 * Mantém uma conexão WebSocket com o collector e expõe o último evento
 * via ref (sem re-render). Use `.current` nos loops de animação Three.js.
 */
export function useDualSense(): React.RefObject<EventoDualSense | null> {
  const eventoRef = useRef<EventoDualSense | null>(null);

  useEffect(() => {
    const ws = new WebSocket(COLLECTOR_URL);

    ws.onmessage = (e) => {
      try {
        eventoRef.current = JSON.parse(e.data as string) as EventoDualSense;
      } catch {
        // ignora mensagens malformadas
      }
    };

    ws.onerror = () => {
      eventoRef.current = null;
    };

    ws.onclose = () => {
      eventoRef.current = null;
    };

    return () => ws.close();
  }, []);

  return eventoRef;
}
