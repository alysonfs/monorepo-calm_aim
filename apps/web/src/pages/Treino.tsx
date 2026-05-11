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
import api from "../http/client";

const MAX_DPR = 1;

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

export default function Treino() {
  const mountRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<MetricasTrackerResult>(createMetricasTracker());
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessaoId = searchParams.get("sessaoId");
  const dualSenseRef = useDualSense();

  const [locked, setLocked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [hud, setHud] = useState({ tiros: 0, acertos: 0, precisao: 0 });

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
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (document.pointerLockElement !== renderer.domElement) return;
      if (shotCooldown > 0) return;
      shotCooldown = 200;

      tracker.registrarTiro();
      rig.play("Armature|Shoot");

      const spawnedAt = targetSystem.checkHit(fps.camera, scene);
      if (spawnedAt !== null) {
        tracker.registrarAcerto(spawnedAt);
      }

      const m = tracker.calcular();
      setHud({ tiros: m.totalTiros, acertos: m.acertos, precisao: m.precisao });
    };
    document.addEventListener("mousedown", onMouseDown);

    // --- resize ---
    const onResize = () => {
      fps.camera.aspect = mount.clientWidth / mount.clientHeight;
      fps.camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // --- visibility pause ---
    const onVisibility = () => {
      if (document.hidden) renderer.setAnimationLoop(null);
      else renderer.setAnimationLoop(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    // --- loop ---
    const clock = new THREE.Clock();
    let r2WasPressed = false;
    const loop = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      shotCooldown = Math.max(0, shotCooldown - delta * 1000);
      controls.update(delta, dualSenseRef.current);

      // Look do stick direito
      const [lx, ly] = getLookFromEvent(dualSenseRef.current);
      if (lx !== 0 || ly !== 0) fps.applyControllerLook(lx, ly);

      // Disparo por R2 (gatilho analógico > 0.5 = pressão suficiente)
      const r2 = dualSenseRef.current?.triggers.r2 ?? 0;
      const r2Pressed = r2 > 0.5;
      if (r2Pressed && !r2WasPressed && shotCooldown <= 0) {
        shotCooldown = 200;
        tracker.registrarTiro();
        rig.play("Armature|Shoot");
        const spawnedAt = targetSystem.checkHit(fps.camera, scene);
        if (spawnedAt !== null) tracker.registrarAcerto(spawnedAt);
        const m = tracker.calcular();
        setHud({
          tiros: m.totalTiros,
          acertos: m.acertos,
          precisao: m.precisao,
        });
      }
      r2WasPressed = r2Pressed;

      targetSystem.update(delta);
      rig.update(delta);
      renderer.render(scene, fps.camera);
    };
    renderer.setAnimationLoop(loop);

    return () => {
      renderer.setAnimationLoop(null);
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
          Tiros: {hud.tiros} | Acertos: {hud.acertos} | Precisão:{" "}
          {hud.precisao.toFixed(1)}%
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
