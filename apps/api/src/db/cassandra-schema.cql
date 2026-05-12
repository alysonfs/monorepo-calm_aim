-- Schema do Cassandra para o Calm Aim
-- Execute como superusuário ou com permissão de CREATE KEYSPACE

CREATE KEYSPACE IF NOT EXISTS calm_aim
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE calm_aim;

-- Eventos individuais de uma sessão (tiros, acertos, misses)
CREATE TABLE IF NOT EXISTS eventos_sessao (
  sessao_id   TEXT,
  evento_id   TIMEUUID,
  tipo        TEXT,   -- 'tiro' | 'acerto' | 'miss'
  reacao_ms   INT,
  dificuldade FLOAT,
  criado_em   TIMESTAMP,
  PRIMARY KEY (sessao_id, evento_id)
) WITH CLUSTERING ORDER BY (evento_id DESC);

-- Leituras emocionais (voz) de uma sessão
CREATE TABLE IF NOT EXISTS estado_emocional (
  sessao_id   TEXT,
  lido_em     TIMEUUID,
  nivel       FLOAT,   -- 0.0 (calmo) a 1.0 (estressado)
  PRIMARY KEY (sessao_id, lido_em)
) WITH CLUSTERING ORDER BY (lido_em DESC);

-- Snapshot de dificuldade calculado pelo motor adaptativo
CREATE TABLE IF NOT EXISTS metricas_dificuldade (
  sessao_id   TEXT,
  calculado_em TIMEUUID,
  dificuldade  FLOAT,
  PRIMARY KEY (sessao_id, calculado_em)
) WITH CLUSTERING ORDER BY (calculado_em DESC);
