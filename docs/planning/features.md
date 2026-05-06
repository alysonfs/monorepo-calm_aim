# Funcionalidades e Diferenciais

## Gameplay

### Cenários Realistas
- Alvos com movimentação humana, inspirados em comportamentos de Battlefield
- Sem alvos artificiais ou mecânicos (círculos estáticos, movimentos robotizados)
- Contexto de jogo: distâncias, ângulos e velocidades condizentes com o FPS

### Modos de Treino

| Modo | Descrição |
|---|---|
| **Tracking** | Seguir um alvo em movimento contínuo |
| **Burst** | Acertar um alvo com disparo controlado (não spam) |
| **Precisão** | Acertar alvos pequenos com alta exigência de mira |
| **Consistência** | Repetir padrões de mira com baixo desvio |

---

## Sistema Adaptativo

Ajusta a dificuldade automaticamente com base em três dimensões:

| Dimensão | Métricas coletadas |
|---|---|
| **Precisão** | % de acertos, dispersão dos tiros |
| **Reação** | Tempo entre aparição do alvo e primeiro tiro |
| **Consistência** | Variância entre tentativas consecutivas |

**Lógica de ajuste:**
- Performance acima do threshold → aumenta velocidade/complexidade
- Performance abaixo do threshold → reduz dificuldade e ativa modo calma
- Estado emocional estressado → pausa ou simplifica o treino

---

## Anti-Tryhard Caótico

O sistema **penaliza comportamentos improdutivos** e reforça o que importa:

### Comportamentos penalizados
- Spam de tiro (disparos em excesso sem alvo confirmado)
- Movimentos excessivos de câmera (sacudidas bruscas)
- Jump/slide como evasão em vez de controle

### Comportamentos reforçados
- Disparo após estabilização da mira
- Movimentos suaves e contínuos
- Paciência antes do engajamento

---

## Análise Emocional por Voz

### Captura
- Web Audio API no navegador (microfone do usuário)
- Processamento local, sem envio de áudio bruto para servidor

### Features extraídas
- Volume médio e picos
- Taxa de variação de intensidade
- Padrões de respiração inferidos

### Classificação
| Estado | Indicadores |
|---|---|
| **Calmo** | Volume estável, baixa variação |
| **Nervoso** | Picos frequentes, voz acelerada |
| **Frustrado** | Variações bruscas, silêncio abrupto |

### Ação do sistema
- Estado calmo → manter ou aumentar dificuldade
- Estado nervoso → manter dificuldade, ativar feedback visual de respiração
- Estado frustrado → reduzir dificuldade, iniciar modo calma

---

## Integração DualSense

### Dados coletados
- **Acelerômetro** — detecta tremor das mãos e impacto
- **Giroscópio** — detecta movimentos bruscos de rotação
- **Botões (R1, R2, demais)** — registra qual botão foi pressionado, timestamp e duração de cada pressionamento
- **Touchpad** — reservado para navegação de menu
- **Gatilhos adaptativos** — feedback háptico de confirmação de tiro (futuro)

### Métricas derivadas
| Métrica | Origem |
|---|---|
| Tremor da mão | Variância do acelerômetro em repouso |
| Movimentos bruscos | Picos de giroscópio acima de threshold |
| Controle fino | Suavidade da trajetória de mira |
| Frequência de disparo por gatilho | Contagem de eventos R1 vs R2 por sessão |
| Latência de acionamento | Tempo entre aparição do alvo e pressionamento do gatilho |

### Sugestão de Gatilho Ideal (R1 vs R2)

O sistema coleta dados de todas as sessões para identificar qual gatilho entrega melhor resultado por usuário:

**Variáveis analisadas por gatilho:**
- Precisão média dos tiros disparados com R1 vs R2
- Consistência (variância entre tentativas)
- Latência de acionamento
- Correlação com tremor do acelerômetro no momento do disparo

**Lógica de sugestão:**
- Após N sessões com dados suficientes de ambos os gatilhos, o sistema compara as médias
- Se um gatilho apresentar precisão e consistência superiores de forma estatisticamente relevante, exibe recomendação ao usuário
- A sugestão é contextual: pode variar por modo de treino (ex: R2 melhor para tracking, R1 para burst)

**Armazenamento:**
- Todos os eventos de botão são gravados no Cassandra como série temporal
- Análise agregada por sessão é salva no MongoDB junto ao perfil do usuário

---

## Modo Calma

Ativado automaticamente quando:
- Estado emocional → frustrado ou nervoso por N segundos
- Precisão cai abaixo do threshold crítico
- Usuário ativa manualmente

**Comportamento:**
- Alvos ficam mais lentos e maiores
- Feedback visual relaxante (cores frias, ritmo lento)
- Exercício de respiração guiado na tela
- Duração: 60–120 segundos antes de retomar treino normal
