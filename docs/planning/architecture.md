# Arquitetura do Sistema

## Visão Geral

```
DualSense → Node Collector (local)
                   ↓
             WebSocket
                   ↓
Frontend (React + Three.js)
                   ↓
Backend (Node.js API)
                   ↓
MongoDB + Cassandra + Redis
```

## Camadas

### Node Collector (local)
- Roda **fora do Docker**, diretamente na máquina do usuário
- Lê dados do DualSense via USB/Bluetooth (acelerômetro, giroscópio)
- Envia os dados em tempo real para o Frontend via WebSocket

### Frontend
- **React** para UI e gerenciamento de estado
- **Three.js** para renderização 3D das cenas de treino
- Consome dados do Node Collector via WebSocket
- Comunica com a API REST do Backend

### Backend (API)
- **Node.js** com API REST (Express)
- Processa métricas de gameplay
- Gerencia sessões, usuários e histórico
- Integra análise emocional (áudio) e motor adaptativo

### Banco de Dados
- **MongoDB** — dados de usuário: perfil, preferências, configurações de controle, histórico de sessões
- **Cassandra** — séries temporais de alta frequência: eventos de sensor (acelerômetro, giroscópio, botões), eventos de tiro
- **Redis** — cache de sessão em andamento e dados de tempo real

---

## Infraestrutura

| Componente | Ambiente |
|---|---|
| Frontend | Docker |
| Backend (API) | Docker |
| MongoDB | Docker |
| Cassandra | Docker |
| Redis | Docker |
| Node Collector | Local (fora do Docker) |

### Justificativa do Node Collector local
O acesso a dispositivos HID (DualSense) requer permissões do sistema operacional que não funcionam bem dentro de containers Docker. Por isso, o collector roda localmente e expõe os dados via WebSocket.

---

## Fluxo de Dados

### Dados do Controle
```
DualSense (HID)
  → Node Collector (hidapi / dualsense-ts)
  → WebSocket ws://localhost:<porta>
  → Frontend (React hook)
  → Estado do jogo (Three.js)
  → Payload de métricas
  → Backend API (POST /sessions/:id/events)
  → Cassandra (séries temporais de sensores)
  → MongoDB (resumo da sessão)
```

### Dados de Áudio
```
Microfone
  → Web Audio API (navegador)
  → Extração de features (volume, pitch, intensidade)
  → Classificador emocional (calmo / nervoso / frustrado)
  → Motor adaptativo
  → Ajuste de dificuldade em tempo real
```

### Fluxo do Motor Adaptativo
```
Métricas de gameplay (precisão, reação, consistência, spam)
  + Estado emocional (áudio)
  + Dados de controle (tremor, movimentos bruscos)
  → Motor Adaptativo (Backend)
  → Configuração de dificuldade
  → Frontend (WebSocket ou polling)
```

---

## Segurança

- Comunicação WebSocket local apenas (`localhost`) — sem exposição externa
- API Backend com autenticação JWT (access token curto + refresh token)
- Variáveis de ambiente para todos os segredos (sem hardcode)
- Validação de entrada em todos os endpoints

---

## Infraestrutura

| Componente | Ambiente |
|---|---|
| Frontend | Docker |
| Backend (API) | Docker |
| PostgreSQL | Docker |
| Redis | Docker |
| Node Collector | Local (fora do Docker) |

### Justificativa do Node Collector local
O acesso a dispositivos HID (DualSense) requer permissões do sistema operacional que não funcionam bem dentro de containers Docker. Por isso, o collector roda localmente e expõe os dados via WebSocket.

---

## Fluxo de Dados

### Dados do Controle
```
DualSense (HID)
  → Node Collector (hidapi / dualsense-ts)
  → WebSocket ws://localhost:<porta>
  → Frontend (React hook)
  → Estado do jogo (Three.js)
  → Payload de métricas
  → Backend API (POST /sessions/:id/events)
  → PostgreSQL
```

### Dados de Áudio
```
Microfone
  → Web Audio API (navegador)
  → Extração de features (volume, pitch, intensidade)
  → Classificador emocional (calmo / nervoso / frustrado)
  → Motor adaptativo
  → Ajuste de dificuldade em tempo real
```

### Fluxo do Motor Adaptativo
```
Métricas de gameplay (precisão, reação, consistência, spam)
  + Estado emocional (áudio)
  + Dados de controle (tremor, movimentos bruscos)
  → Motor Adaptativo (Backend)
  → Configuração de dificuldade
  → Frontend (WebSocket ou polling)
```

---

## Segurança

- Comunicação WebSocket local apenas (`localhost`) — sem exposição externa
- API Backend com autenticação JWT (access token curto + refresh token)
- Variáveis de ambiente para todos os segredos (sem hardcode)
- Validação de entrada em todos os endpoints
