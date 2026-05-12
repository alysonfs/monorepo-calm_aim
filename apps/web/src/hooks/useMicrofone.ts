import { useEffect, useRef } from "react";
import { createVozAnalyzer, type VozAnalyzerResult } from "../game/VozAnalyzer";

export interface UseMicrofoneResult {
  analyzer: VozAnalyzerResult | null;
  permissaoNegada: boolean;
}

/**
 * Solicita permissão de microfone e retorna um VozAnalyzer pronto para uso.
 * O analyzer é iniciado automaticamente após permissão concedida.
 */
export function useMicrofone(): UseMicrofoneResult {
  const analyzerRef = useRef<VozAnalyzerResult | null>(null);
  const negadaRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((s) => {
        stream = s;
        const az = createVozAnalyzer(s);
        az.start();
        analyzerRef.current = az;
      })
      .catch(() => {
        negadaRef.current = true;
      });

    return () => {
      analyzerRef.current?.stop();
      analyzerRef.current = null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    get analyzer() {
      return analyzerRef.current;
    },
    get permissaoNegada() {
      return negadaRef.current;
    },
  };
}
