# Glossário do Domínio

> Termos do negócio e seus significados precisos neste contexto. Mantenha em ordem alfabética.

| Termo | Definição |
|-------|-----------|
| Avg Error (circularidade) | Métrica de desgaste mecânico do potenciômetro do stick. Calculada como o desvio percentual médio do raio durante um giro completo em relação ao raio ideal. Valores > 8–10% indicam stick degradado. |
| Deadzone | Região ao redor do centro do stick onde o input é ignorado para compensar drift. Três tipos: **axial** (por eixo independente — pior para FPS, cria zona morta em cruz), **radial** (por magnitude do vetor — melhor), **radial escalada** (radial + remapeamento `[dz..1]→[0..1]` — ideal). |
| Deadzone radial escalada | Tipo de deadzone recomendado para mira FPS. Verifica a magnitude do vetor `(x,y)`, não cada eixo separado. Remapeia o intervalo `[dz..1]` para `[0..1]`, eliminando o salto de velocidade ao cruzar o limiar. |
| Drift | Offset reportado pelo stick quando está em repouso sem ser tocado. Causado por desgaste do potenciômetro ALPS. Mensurável via Gamepad API ou HID. Valores típicos: ±0.01 (novo) a ±0.10 (desgastado). |
| Offset de stick | Valor médio de X e Y reportado pelo stick em repouso. Subtraído de cada leitura antes de processar o input para corrigir drift. Calculado na fase de calibração em repouso (~200 amostras). |
| Perfil de calibração | Documento salvo no MongoDB por usuário contendo `offsetX`, `offsetY`, `deadzoneRadial` e `avgCircularityError` de cada stick. Carregado pelo collector ao iniciar para corrigir os valores brutos do HID antes do broadcast. |
| Potenciômetro ALPS | Componente eletromecânico dos sticks analógicos do DualSense. Converte posição angular em resistência elétrica. Degrada com uso, causando drift e perda de circularidade — principal causa do "stick drift" relatado por jogadores. |
