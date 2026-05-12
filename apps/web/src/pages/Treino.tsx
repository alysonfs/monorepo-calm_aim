import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { createFpsCamera, getLookFromEvent } from "../game/FpsCamera";
import { createFpsControls } from "../game/FpsControls";
import { createTargetSystem } from "../game/TargetSystem";
import { loadFpsRig, createPlaceholderRig } from "../game/FpsRig";
import {
  createMetricasTracker,
  type MetricasTrackerResult,
} from "../game/MetricasTracker";
import { useDualSense } from "../hooks/useDualSense";
import { useMicrofone } from "../hooks/useMicrofone";
import api from "../http/client";

const MAX_DPR = 1;
const MAX_CASSANDRA_LOG = 10;

interface CassandraLogEntry {
  ts: number;
  table: string;
  fields: Record<string, string | number>;
}

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.75)",
  color: "#e0e0e0",
  fontFamily: "system-ui, sans-serif",
  zIndex: 20,
  gap: "1rem",
};

const btnStyle: React.CSSProperties = {
  padding: "0.7rem 1.5rem",
  background: "#6366f1",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  fontSize: "1rem",
  cursor: "pointer",
};

const hudStyle: React.CSSProperties = {
  position: "absolute",
  top: "1rem",
  left: "1rem",
  color: "#e0e0e0",
  fontFamily: "monospace",
  fontSize: "0.85rem",
  zIndex: 10,
  pointerEvents: "none",
  background: "rgba(0,0,0,0.4)",
  padding: "0.5rem 0.75rem",
  borderRadius: "4px",
};

const crosshairStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 16,
  height: 16,
  pointerEvents: "none",
  zIndex: 10,
};

const creditStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "0.5rem",
  right: "0.75rem",
  color: "#555",
  fontSize: "0.7rem",
  fontFamily: "system-ui, sans-serif",
  zIndex: 10,
  pointerEvents: "none",
};

const cassandraLogStyle: React.CSSProperties = {
  position: "absolute",
  top: "3.5rem",
  right: "1rem",
  width: "230px",
  background: "rgba(0,0,0,0.42)",
  color: "#7dd3fc",
  fontFamily: "monospace",
  fontSize: "0.62rem",
  lineHeight: "1.5",
  zIndex: 10,
  pointerEvents: "none",
  borderRadius: "4px",
  padding: "0.35rem 0.5rem",
  backdropFilter: "blur(3px)",
  border: "1px solid rgba(100,180,255,0.12)",
};

export default function Treino() {
  const mountRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<MetricasTrackerResult>(createMetricasTracker());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessaoId = searchParams.get("sessaoId");
  const dualSenseRef = useDualSense();
  const microfone = useMicrofone();

  const [locked, setLocked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [hud, setHud] = useState({ tiros: 0, acertos: 0, precisao: 0 });
  const [dificuldade, setDificuldade] = useState(0.3);
  const [nivelEmocional, setNivelEmocional] = useState(0);
  const [cassandraLog, setCassandraLog] = useState<CassandraLogEntry[]>([]);
  const [tempoSessao, setTempoSessao] = useState(0);
  const dificuldadeRef = useRef(0.3);

  useEffect(() => {
    // Busca dificuldade inicial da sessão
    if (!sessaoId) return;
    api
      .get<{ dificuldade: number }>(`/sessions/${sessaoId}/dificuldade`)
      .then(({ data }) => {
        dificuldadeRef.current = data.dificuldade;
        setDificuldade(data.dificuldade);
      })
      .catch(() => {
        /* Cassandra pode estar indisponível — continua com padrão */
      });
  }, [sessaoId]);

  useEffect(() => {
    if (!locked || ended) return;
    const inicio = Date.now();
    setTempoSessao(0);
    const id = setInterval(() => {
      setTempoSessao(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [locked, ended]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // --- renderer ---
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: true,
    });
    renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // --- scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 15, 40);

    // --- lights ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // --- floor ---
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3e });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // --- camera + controls ---
    const fps = createFpsCamera(renderer.domElement);
    scene.add(fps.player);

    const controls = createFpsControls(fps.player, fps.camera);
    const targetSystem = createTargetSystem(scene);
    const tracker = trackerRef.current;

    // --- weapon rig (GLB ou placeholder) ---
    let rig = createPlaceholderRig(fps.camera);
    loadFpsRig(scene, fps.camera)
      .then((loaded) => {
        rig.dispose();
        rig = loaded;
      })
      .catch(() => {
        /* mantém placeholder se GLB não estiver disponível */
      });

    // --- pointer lock ---
    const onLockChange = () => {
      setLocked(document.pointerLockElement === renderer.domElement);
    };
    document.addEventListener("pointerlockchange", onLockChange);

    // --- shoot ---
    let shotCooldown = 0;

    function disparar() {
      if (shotCooldown > 0) return;
      shotCooldown = 200;

      tracker.registrarTiro();
      rig.play("Armature|Shoot");

      const hit = targetSystem.checkHit(fps.camera, scene);
      const reacaoMs =
        hit !== null ? Math.round(performance.now() - hit.spawnedAt) : 0;
      const tipo = hit !== null ? "acerto" : "tiro";
      const distanciaM = hit !== null ? Math.round(hit.distancia * 10) / 10 : 0;

      if (hit !== null) tracker.registrarAcerto(hit.spawnedAt);

      const m = tracker.calcular();
      setHud({ tiros: m.totalTiros, acertos: m.acertos, precisao: m.precisao });

      if (sessaoId) {
        api
          .post<{ dificuldade: number }>(`/sessions/${sessaoId}/eventos`, {
            tipo,
            reacaoMs,
            dificuldadeAtual: dificuldadeRef.current,
            distanciaM,
          })
          .then(({ data }) => {
            dificuldadeRef.current = data.dificuldade;
            setDificuldade(data.dificuldade);
            targetSystem.setDificuldade(data.dificuldade);
            setCassandraLog((prev) => [
              {
                ts: Date.now(),
                table: "eventos_sessao",
                fields: {
                  tipo,
                  reacao_ms: reacaoMs,
                  dist_m: distanciaM,
                  dificuldade: Number(data.dificuldade.toFixed(3)),
                },
              },
              ...prev.slice(0, MAX_CASSANDRA_LOG - 1),
            ]);
          })
          .catch(() => {
            /* motor indisponível */
          });
      }
    }

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (document.pointerLockElement !== renderer.domElement) return;
      disparar();
    };
    document.addEventListener("mousedown", onMouseDown);

    // --- resize ---
    const onResize = () => {
      fps.camera.aspect = mount.clientWidth / mount.clientHeight;
      fps.camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // --- visibilidade ---
    const onVisibility = () => {
      if (document.hidden) renderer.setAnimationLoop(null);
      else renderer.setAnimationLoop(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // --- envio de emoção a cada 5s ---
    let emocaoInterval: ReturnType<typeof setInterval> | null = null;
    if (sessaoId) {
      emocaoInterval = setInterval(() => {
        const nivel = microfone.analyzer?.nivel() ?? 0;
        setNivelEmocional(nivel);
        api
          .post(`/sessions/${sessaoId}/emocao`, { nivel })
          .then(() => {
            setCassandraLog((prev) => [
              {
                ts: Date.now(),
                table: "estado_emocional",
                fields: { nivel: Number(nivel.toFixed(3)) },
              },
              ...prev.slice(0, MAX_CASSANDRA_LOG - 1),
            ]);
          })
          .catch(() => {
            /* silencia */
          });
      }, 5000);
    }

    // --- loop ---
    const clock = new THREE.Clock();
    let r2WasPressed = false;
    const loop = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      shotCooldown = Math.max(0, shotCooldown - delta * 1000);
      controls.update(delta, dualSenseRef.current);

      // Look do stick direito
      const [lx, ly] = getLookFromEvent(dualSenseRef.current);
      if (lx !== 0 || ly !== 0) fps.applyControllerLook(lx, ly, delta);

      // Disparo por R2 (gatilho analógico > 0.5 = pressão suficiente)
      const r2 = dualSenseRef.current?.triggers.r2 ?? 0;
      const r2Pressed = r2 > 0.5;
      if (r2Pressed && !r2WasPressed) {
        disparar();
      }
      r2WasPressed = r2Pressed;

      targetSystem.update(delta);
      rig.update(delta);
      renderer.render(scene, fps.camera);
    };
    renderer.setAnimationLoop(loop);

    return () => {
      renderer.setAnimationLoop(null);
      if (emocaoInterval) clearInterval(emocaoInterval);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      fps.dispose();
      controls.dispose();
      targetSystem.dispose(scene);
      rig.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  async function handleEncerrar() {
    const metricas = trackerRef.current.calcular();
    try {
      if (sessaoId) {
        await api.patch(`/sessions/${sessaoId}`, metricas);
      }
    } catch {
      // silencia: sessão pode já ter sido encerrada
    }
    setEnded(true);
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* HUD */}
      {locked && !ended && (
        <div style={hudStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "1rem",
            }}
          >
            <span>
              Tiros: {hud.tiros} | Acertos: {hud.acertos} | Precisão:{" "}
              {hud.precisao.toFixed(1)}%
            </span>
            <span style={{ color: "#888", fontVariantNumeric: "tabular-nums" }}>
              {String(Math.floor(tempoSessao / 60)).padStart(2, "0")}:
              {String(tempoSessao % 60).padStart(2, "0")}
            </span>
          </div>

          {/* Nível de dificuldade adaptativa */}
          <div
            style={{
              marginTop: "0.4rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <span style={{ color: "#666", fontSize: "0.75rem" }}>NÍVEL</span>
            <div
              style={{
                width: 72,
                height: 5,
                background: "#222",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${dificuldade * 100}%`,
                  height: "100%",
                  background:
                    dificuldade > 0.75
                      ? "#ef4444"
                      : dificuldade > 0.5
                        ? "#f59e0b"
                        : dificuldade > 0.25
                          ? "#84cc16"
                          : "#22c55e",
                  borderRadius: 3,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
            <span
              style={{
                color:
                  dificuldade > 0.75
                    ? "#ef4444"
                    : dificuldade > 0.5
                      ? "#f59e0b"
                      : dificuldade > 0.25
                        ? "#84cc16"
                        : "#22c55e",
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              {dificuldade > 0.75
                ? "ELITE"
                : dificuldade > 0.5
                  ? "AVANÇADO"
                  : dificuldade > 0.25
                    ? "MÉDIO"
                    : "INICIANTE"}
            </span>
          </div>

          {/* Tensão emocional (análise de voz) */}
          <div
            style={{
              marginTop: "0.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              color: "#555",
              fontSize: "0.75rem",
            }}
          >
            <span>TENSÃO</span>
            <span
              style={{
                color:
                  nivelEmocional > 0.6
                    ? "#ef4444"
                    : nivelEmocional > 0.3
                      ? "#f59e0b"
                      : "#22c55e",
              }}
            >
              {nivelEmocional > 0.6
                ? "● Alta"
                : nivelEmocional > 0.3
                  ? "● Moderada"
                  : "● Calmo"}
            </span>
          </div>
        </div>
      )}

      {/* Crosshair */}
      {locked && !ended && (
        <svg style={crosshairStyle} viewBox="0 0 16 16" fill="none">
          <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="1.5" />
          <line
            x1="8"
            y1="10"
            x2="8"
            y2="14"
            stroke="white"
            strokeWidth="1.5"
          />
          <line x1="2" y1="8" x2="6" y2="8" stroke="white" strokeWidth="1.5" />
          <line
            x1="10"
            y1="8"
            x2="14"
            y2="8"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
      )}

      {/* Overlay: clique para iniciar */}
      {!locked && !ended && (
        <div style={overlayStyle}>
          <p style={{ margin: 0, fontSize: "1.1rem" }}>
            Clique para iniciar o treino
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#888" }}>
            WASD para mover · Espaço para pular · Clique para atirar
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              style={btnStyle}
              onClick={() =>
                mountRef.current?.querySelector("canvas")?.requestPointerLock()
              }
            >
              Jogar
            </button>
            <button
              style={{
                ...btnStyle,
                background: "transparent",
                border: "1px solid #555",
              }}
              onClick={() => navigate("/dashboard")}
            >
              ← Voltar
            </button>
          </div>
        </div>
      )}

      {/* Overlay: sessão encerrada */}
      {ended && (
        <div style={overlayStyle}>
          <p style={{ margin: 0, fontSize: "1.25rem" }}>Sessão encerrada</p>
          <p style={{ margin: 0, color: "#aaa" }}>
            Tiros: {hud.tiros} | Acertos: {hud.acertos} | Precisão:{" "}
            {hud.precisao.toFixed(1)}%
          </p>
          <button style={btnStyle} onClick={() => navigate("/dashboard")}>
            Ver histórico
          </button>
        </div>
      )}

      {/* Painel de debug Cassandra */}
      {locked && !ended && cassandraLog.length > 0 && (
        <div style={cassandraLogStyle}>
          <div
            style={{
              color: "#475569",
              marginBottom: "0.2rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            ▸ cassandra
          </div>
          {cassandraLog.map((entry, i) => (
            <div
              key={entry.ts + i}
              style={{
                opacity: Math.max(0.35, 1 - i * 0.09),
                marginBottom: "0.1rem",
              }}
            >
              <span style={{ color: "#334155" }}>
                {new Date(entry.ts).toISOString().slice(11, 19)}
              </span>{" "}
              <span
                style={{
                  color:
                    entry.table === "eventos_sessao" ? "#86efac" : "#fbbf24",
                }}
              >
                {entry.table}
              </span>{" "}
              {Object.entries(entry.fields).map(([k, v]) => (
                <span key={k}>
                  <span style={{ color: "#4b6a8a" }}>{k}=</span>
                  <span
                    style={{
                      color:
                        k === "tipo" && v === "acerto"
                          ? "#4ade80"
                          : k === "tipo" && v === "tiro"
                            ? "#f97316"
                            : "#cbd5e1",
                    }}
                  >
                    {String(v)}
                  </span>{" "}
                </span>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Botão encerrar (visível só com lock) */}
      {locked && !ended && (
        <button
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.4rem 0.8rem",
            background: "rgba(255,80,80,0.15)",
            color: "#ff8080",
            border: "1px solid rgba(255,80,80,0.3)",
            borderRadius: "4px",
            fontSize: "0.8rem",
            cursor: "pointer",
            zIndex: 10,
          }}
          onClick={handleEncerrar}
        >
          Encerrar
        </button>
      )}

      {/* Canvas Three.js */}
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", background: "#000" }}
      />

      {/* Crédito CC-BY */}
      <span style={creditStyle}>
        "Fps Rig AKM" by J-Toastie{" "}
        <a
          href="https://creativecommons.org/licenses/by/3.0/"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#555" }}
        >
          CC-BY
        </a>{" "}
        via{" "}
        <a
          href="https://poly.pizza/m/U6l6wjxFhC"
          target="_blank"
          rel="noreferrer"
          style={{ color: "#555" }}
        >
          Poly Pizza
        </a>
      </span>
    </div>
  );
}
