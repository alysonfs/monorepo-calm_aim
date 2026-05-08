import { useEffect, useState } from "react";
import type { EventoDualSense } from "@calm-aim/core";

export default function Debug() {
  const [evento, setEvento] = useState<EventoDualSense | null>(null);
  const [wsConectado, setWsConectado] = useState(false);

  useEffect(() => {
    const url =
      (import.meta.env["VITE_COLLECTOR_URL"] as string | undefined) ??
      "ws://localhost:3002";
    const ws = new WebSocket(url);

    ws.onopen = () => setWsConectado(true);
    ws.onclose = () => setWsConectado(false);
    ws.onerror = () => setWsConectado(false);
    ws.onmessage = (e) => {
      try {
        setEvento(JSON.parse(e.data as string) as EventoDualSense);
      } catch {
        // ignora mensagens malformadas
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div style={{ fontFamily: "monospace", padding: "1.5rem" }}>
      <h1>Debug — DualSense Collector</h1>

      <p>
        WebSocket:{" "}
        <strong style={{ color: wsConectado ? "green" : "red" }}>
          {wsConectado ? "conectado" : "desconectado"}
        </strong>
      </p>

      <p>
        Controle:{" "}
        <strong style={{ color: evento?.conectado ? "green" : "orange" }}>
          {evento?.conectado ? "conectado" : "desconectado"}
        </strong>
      </p>

      {evento && (
        <table
          border={1}
          cellPadding={6}
          style={{ borderCollapse: "collapse", marginTop: "1rem" }}
        >
          <tbody>
            <tr>
              <td colSpan={2}>
                <strong>Acelerômetro</strong>
              </td>
            </tr>
            <tr>
              <td>x</td>
              <td>{evento.acelerometro.x.toFixed(4)}</td>
            </tr>
            <tr>
              <td>y</td>
              <td>{evento.acelerometro.y.toFixed(4)}</td>
            </tr>
            <tr>
              <td>z</td>
              <td>{evento.acelerometro.z.toFixed(4)}</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>Giroscópio</strong>
              </td>
            </tr>
            <tr>
              <td>x</td>
              <td>{evento.giroscopio.x.toFixed(4)}</td>
            </tr>
            <tr>
              <td>y</td>
              <td>{evento.giroscopio.y.toFixed(4)}</td>
            </tr>
            <tr>
              <td>z</td>
              <td>{evento.giroscopio.z.toFixed(4)}</td>
            </tr>
            <tr>
              <td colSpan={2}>
                <strong>Botões</strong>
              </td>
            </tr>
            {Object.entries(evento.botoes).map(([nome, ativo]) => (
              <tr key={nome}>
                <td>{nome}</td>
                <td style={{ color: ativo ? "green" : "inherit" }}>
                  {String(ativo)}
                </td>
              </tr>
            ))}
            <tr>
              <td>timestamp</td>
              <td>{evento.timestamp}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
