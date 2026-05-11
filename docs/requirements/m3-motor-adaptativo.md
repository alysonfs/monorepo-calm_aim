# M3 — Motor Adaptativo + Análise Emocional por Voz

## Problema

O treino fixo não respeita o estado do jogador. Um adulto com stress alto ou fadiga não vai melhorar num modo difícil — vai frustrar e abandonar. O motor adaptativo precisa perceber quando o jogador está fora do fluxo e ajustar a dificuldade sem que ele precise pedir.

---

## Escopo

### O que entra no M3

1. **Persistência de eventos de treino no Cassandra** — cada tiro, acerto e tempo de reação é registrado como série temporal.
2. **Motor de dificuldade adaptativo** — calcula e ajusta a dificuldade com base nos últimos N eventos da sessão.
3. **Análise emocional por voz** — Web Audio API analisa o microfone localmente (sem envio de áudio ao servidor) e estima o nível de estresse.
4. **Integração no loop de jogo** — alvos reagem à dificuldade atual (velocidade, tamanho, frequência de spawn).
5. **Indicador visual no HUD** — estado emocional e nível de dificuldade visíveis para o jogador.

### O que NÃO entra no M3

- Modelo de machine learning para emoção (heurística simples é suficiente para o M3)
- Análise de expressão facial
- Haptics adaptativos do DualSense (backlog pós-M3)
- Múltiplos perfis de dificuldade por usuário (backlog)

---

## Comportamento Esperado

### Motor de Dificuldade

```
dado: últimos 10 eventos de 'tiro' da sessão
  precisão > 80%  →  aumenta dificuldade em +0.1 (teto: 1.0)
  precisão < 40%  →  diminui dificuldade em -0.1 (piso: 0.1)
  40% ≤ precisão ≤ 80%  →  mantém dificuldade atual

dado: nível emocional (voz) > 0.7 por mais de 10s
  →  diminui dificuldade em -0.15 independente da performance
  →  registra motivo: 'emocao'
```

### Efeitos da Dificuldade nos Alvos

| Dificuldade | Velocidade alvo | Tamanho alvo | Spawn (alvos simultâneos) |
|------------|----------------|--------------|--------------------------|
| 0.1 (mínima) | 1× (base) | 1.5× (grande) | 1 |
| 0.5 (média) | 2× | 1× (normal) | 2 |
| 1.0 (máxima) | 3.5× | 0.6× (pequeno) | 3 |

### Análise Emocional (heurística local)

```
a cada 500ms:
  rms = volume RMS dos últimos 512 samples
  freq = frequência dominante (FFT, bin de maior amplitude)

  nivel_stress = 0.0

  se rms > LIMIAR_VOLUME:
    nivel_stress += 0.4
  se freq > 300Hz:
    nivel_stress += 0.3
  se variacao_rms > LIMIAR_VARIACAO:   -- voz instável/tensa
    nivel_stress += 0.3

  nivel_stress = clamp(nivel_stress, 0.0, 1.0)
  media_movel = (media_movel * 0.8) + (nivel_stress * 0.2)  -- suaviza picos
```

---

## Modelo de Dados (Cassandra)

```cql
-- Eventos de treino por sessão (série temporal)
CREATE TABLE calm_aim.eventos_sessao (
  sessao_id   uuid,
  ts          timestamp,
  tipo        text,      -- 'tiro' | 'acerto' | 'miss'
  reacao_ms   int,       -- null quando tipo = 'tiro' sem acerto
  dificuldade float,
  PRIMARY KEY (sessao_id, ts)
) WITH CLUSTERING ORDER BY (ts DESC);

-- Estado emocional por sessão
CREATE TABLE calm_aim.estado_emocional (
  sessao_id  uuid,
  ts         timestamp,
  nivel      float,
  confianca  float,
  PRIMARY KEY (sessao_id, ts)
) WITH CLUSTERING ORDER BY (ts DESC);

-- Histórico de ajustes de dificuldade
CREATE TABLE calm_aim.metricas_dificuldade (
  usuario_id  text,
  ts          timestamp,
  sessao_id   uuid,
  dificuldade float,
  motivo      text,
  PRIMARY KEY (usuario_id, ts)
) WITH CLUSTERING ORDER BY (ts DESC);
```

---

## Contratos de API

### `POST /sessions/:id/eventos`

Recebe lote de eventos do frontend (a cada disparo ou a cada 5s, o que vier primeiro).

**Body:**
```json
{
  "eventos": [
    { "tipo": "tiro", "ts": 1715000000000, "dificuldade": 0.5 },
    { "tipo": "acerto", "ts": 1715000000312, "reacao_ms": 312, "dificuldade": 0.5 }
  ]
}
```

**Response (200):**
```json
{
  "dificuldadeAtual": 0.6,
  "ajustado": true,
  "motivo": "performance"
}
```

### `POST /sessions/:id/emocao`

Recebe leitura periódica de estado emocional (a cada 5s).

**Body:**
```json
{ "nivel": 0.72, "confianca": 0.85 }
```

**Response (200):**
```json
{
  "dificuldadeAtual": 0.45,
  "ajustado": true,
  "motivo": "emocao"
}
```

### `GET /sessions/:id/dificuldade`

Retorna dificuldade atual para inicializar o frontend.

**Response (200):**
```json
{ "dificuldade": 0.5 }
```

---

## Privacidade (Análise de Voz)

- O áudio **nunca sai do browser**. Apenas o valor numérico calculado (0–1) é enviado ao backend.
- Nenhum dado de áudio é gravado ou armazenado.
- O usuário consente ao microfone via `getUserMedia` — sem consentimento, a análise simplesmente não acontece.
- O HUD mostra claramente quando o microfone está ativo (ícone de mic).

---

## Não-Requisitos Funcionais

- A análise emocional não precisa ser precisa — serve como sinal de suporte, não de diagnóstico.
- O motor adaptativo não precisa ser em tempo real: latência de até 2s para ajuste de dificuldade é aceitável.
- Cassandra não precisa de replicação para M3 (desenvolvimento local, `replication_factor: 1`).
