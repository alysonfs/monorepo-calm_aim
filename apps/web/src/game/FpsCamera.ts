import * as THREE from "three";
import type { EventoDualSense } from "@calm-aim/core";

export interface FpsCameraResult {
  camera: THREE.PerspectiveCamera;
  player: THREE.Object3D;
  /** Ativa o Pointer Lock no canvas */
  lock(): void;
  /** Remove listeners e libera recursos */
  dispose(): void;
  /** Aplica entrada do stick direito do DualSense (delta em segundos) */
  applyControllerLook(dx: number, dy: number, delta?: number): void;
}

/** Velocidade máxima de rotação em radianos por segundo (deflexão total). */
const STICK_SENSITIVITY = 2.4;
/** Zona morta do stick de look — valores abaixo são ignorados. */
const LOOK_DEADZONE = 0.05;

function applyDeadzone(value: number): number {
  if (Math.abs(value) < LOOK_DEADZONE) return 0;
  const sign = value > 0 ? 1 : -1;
  return (sign * (Math.abs(value) - LOOK_DEADZONE)) / (1 - LOOK_DEADZONE);
}

export function createFpsCamera(canvas: HTMLElement): FpsCameraResult {
  const camera = new THREE.PerspectiveCamera(
    70,
    canvas.clientWidth / canvas.clientHeight,
    0.02,
    1000,
  );
  camera.rotation.order = "YXZ";

  const player = new THREE.Object3D();
  player.add(camera);
  player.position.set(0, 1.6, 0);

  const onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement !== canvas) return;
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x = Math.max(
      -Math.PI / 2 + 0.05,
      Math.min(Math.PI / 2 - 0.05, camera.rotation.x - e.movementY * 0.002),
    );
  };

  document.addEventListener("mousemove", onMouseMove);

  return {
    camera,
    player,
    lock() {
      canvas.requestPointerLock();
    },
    applyControllerLook(dx: number, dy: number, delta = 1 / 60) {
      const fdx = applyDeadzone(dx);
      const fdy = applyDeadzone(dy);
      camera.rotation.y -= fdx * STICK_SENSITIVITY * delta;
      camera.rotation.x = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(
          Math.PI / 2 - 0.05,
          camera.rotation.x + fdy * STICK_SENSITIVITY * delta,
        ),
      );
    },
    dispose() {
      document.removeEventListener("mousemove", onMouseMove);
    },
  };
}

/** Extrai look do stick direito; retorna [0,0] se evento nulo ou desconectado */
export function getLookFromEvent(
  evento: EventoDualSense | null,
): [number, number] {
  if (!evento?.conectado) return [0, 0];
  return [evento.sticks.direito.x, evento.sticks.direito.y];
}
