import { WebSocketServer, WebSocket } from 'ws';
import type { EventoDualSense } from '@calm-aim/types';

const PORT = Number(process.env['COLLECTOR_PORT'] ?? 3002);

const wss = new WebSocketServer({ port: PORT });

console.log(`[collector] WebSocket server escutando na porta ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[collector] Cliente conectado');

  const interval = setInterval(() => {
    const evento: EventoDualSense = {
      timestamp: Date.now(),
      acelerometro: { x: 0, y: 0, z: 0 },
      giroscopio: { x: 0, y: 0, z: 0 },
      botoes: {},
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(evento));
    }
  }, 100);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('[collector] Cliente desconectado');
  });

  ws.on('error', (err) => {
    clearInterval(interval);
    console.error('[collector] Erro no cliente:', err.message);
  });
});
