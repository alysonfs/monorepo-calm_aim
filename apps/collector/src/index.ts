import { WebSocketServer, WebSocket } from "ws";
import type { EventoDualSense } from "@calm-aim/core";

const PORT = Number(process.env["COLLECTOR_PORT"] ?? 3002);

const wss = new WebSocketServer({ port: PORT });

console.log(`[collector] WebSocket server escutando na porta ${PORT}`);

function eventoZero(): EventoDualSense {
  return {
    timestamp: Date.now(),
    conectado: false,
    acelerometro: { x: 0, y: 0, z: 0 },
    giroscopio: { x: 0, y: 0, z: 0 },
    sticks: { esquerdo: { x: 0, y: 0 }, direito: { x: 0, y: 0 } },
    triggers: { l2: 0, r2: 0 },
    botoes: {},
  };
}

let ultimoEvento: EventoDualSense = eventoZero();

function broadcast(evento: EventoDualSense): void {
  ultimoEvento = evento;
  const payload = JSON.stringify(evento);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

async function tentarConectarDualSense(): Promise<void> {
  try {
    const { Dualsense } = await import("dualsense-ts");
    const controller = new Dualsense();

    console.log("[collector] DualSense instanciado, aguardando conexão...");

    controller.on("change", (ctrl) => {
      const evento: EventoDualSense = {
        timestamp: Date.now(),
        conectado: ctrl.connection.active,
        acelerometro: {
          x: ctrl.accelerometer.x.state,
          y: ctrl.accelerometer.y.state,
          z: ctrl.accelerometer.z.state,
        },
        giroscopio: {
          x: ctrl.gyroscope.x.state,
          y: ctrl.gyroscope.y.state,
          z: ctrl.gyroscope.z.state,
        },
        sticks: {
          esquerdo: {
            x: ctrl.left.analog.x.state,
            y: ctrl.left.analog.y.state,
          },
          direito: {
            x: ctrl.right.analog.x.state,
            y: ctrl.right.analog.y.state,
          },
        },
        triggers: {
          l2: ctrl.left.trigger.state,
          r2: ctrl.right.trigger.state,
        },
        botoes: {
          cross: ctrl.cross.state,
          circle: ctrl.circle.state,
          square: ctrl.square.state,
          triangle: ctrl.triangle.state,
          l1: ctrl.left.bumper.state,
          r1: ctrl.right.bumper.state,
          l3: ctrl.left.analog.button.state,
          r3: ctrl.right.analog.button.state,
          options: ctrl.options.state,
          create: ctrl.create.state,
          ps: ctrl.ps.state,
          dpadUp: ctrl.dpad.up.state,
          dpadDown: ctrl.dpad.down.state,
          dpadLeft: ctrl.dpad.left.state,
          dpadRight: ctrl.dpad.right.state,
        },
      };
      broadcast(evento);
    });

    controller.connection.on("change", ({ active }) => {
      console.log(
        `[collector] DualSense ${active ? "conectado" : "desconectado"}`,
      );
      if (!active) {
        broadcast(eventoZero());
      }
    });
  } catch (err) {
    console.warn(
      "[collector] Falha ao conectar DualSense, usando fallback zeros:",
      (err as Error).message,
    );
    setTimeout(() => void tentarConectarDualSense(), 5000);
  }
}

setInterval(() => {
  if (!ultimoEvento.conectado) {
    broadcast(eventoZero());
  }
}, 100);

wss.on("connection", (ws: WebSocket) => {
  console.log("[collector] Cliente WebSocket conectado");
  ws.send(JSON.stringify(ultimoEvento));

  ws.on("error", (err) => {
    console.error("[collector] Erro no cliente:", err.message);
  });

  ws.on("close", () => {
    console.log("[collector] Cliente WebSocket desconectado");
  });
});

void tentarConectarDualSense();
