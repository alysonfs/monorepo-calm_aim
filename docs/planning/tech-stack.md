# Tech Stack

## Frontend

| Tecnologia | Papel |
|---|---|
| **React** | UI, gerenciamento de estado, roteamento |
| **Three.js** | Renderização 3D das cenas de treino |
| **Web Audio API** | Captura e análise de áudio do microfone (nativo) |
| **WebSocket (nativo)** | Conexão com Node Collector para dados do DualSense |

## Backend

| Tecnologia | Papel |
|---|---|
| **Node.js** | Runtime da API |
| **Express** | Framework HTTP |
| **JWT** | Autenticação (access token curto + refresh token) |

## Banco de Dados

| Tecnologia | Papel |
|---|---|
| **MongoDB** | Dados de usuário: perfil, preferências, configurações de controle, histórico de sessões |
| **Cassandra** | Séries temporais de alta frequência: eventos de sensor (acelerômetro, giroscópio, botões), eventos de tiro — otimizado para escrita intensiva e análise futura |
| **Redis** | Cache de sessão em andamento, dados de tempo real |

## Node Collector (local)

| Tecnologia | Papel |
|---|---|
| **Node.js** | Runtime do collector |
| **hidapi / dualsense-ts** | Leitura do DualSense via HID |
| **ws** | Servidor WebSocket para expor dados ao frontend |

## Infraestrutura

| Tecnologia | Papel |
|---|---|
| **Docker** | Containerização de Frontend, Backend, MongoDB, Cassandra e Redis |
| **Docker Compose** | Orquestração local dos containers |

---

## Decisões a Tomar

| Decisão | Opções | Status |
|---|---|---|
| Framework HTTP (Backend) | Express | Definido |
| ODM MongoDB | Mongoose | Definido |
| Cliente Cassandra | cassandra-driver (DataStax) | Definido |
| Classificador emocional | Rule-based | Definido |
| Algoritmo de sugestão de gatilho | Comparação estatística R1 vs R2 por sessão | Pendente |
| Autenticação social | Google / Discord OAuth (futuro) | Backlog |
| Deploy produção | Fly.io / Railway / VPS | Backlog |

---

## Restrições Conhecidas

- **Node Collector deve rodar fora do Docker** — acesso a dispositivos HID requer permissões do SO que não funcionam em containers
- **Análise de áudio no browser** — processamento local para evitar envio de dados de voz ao servidor (privacidade)
- **WebSocket local** — o Collector expõe apenas em `localhost`, sem risco de exposição externa
- **Cassandra para séries temporais** — os eventos de sensor (giroscópio, acelerômetro, botões) geram volume alto e frequência elevada; Cassandra é otimizado para esse padrão e suporta análise retrospectiva por janelas de tempo
- **MongoDB para dados de usuário** — esquema flexível para perfil de usuário e preferências, incluindo configurações de controle e histórico de sugestões de gatilho
