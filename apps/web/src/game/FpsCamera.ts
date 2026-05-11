import * as THREE from "three";
import type { EventoDualSense } from "@calm-aim/core";

export interface FpsCameraResult {
  camera: THREE.PerspectiveCamera;
  player: THREE.Object3D;
  /** Ativa o Pointer Lock no canvas */
  lock(): void;
  /** Remove listeners e libera recursos */
  dispose(): void;
  /** Aplica entrada do stick direito do DualSense */
  applyControllerLook(dx: number, dy: number): void;
}

const STICK_SENSITIVITY = 0.04;

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
    applyControllerLook(dx: number, dy: number) {
      camera.rotation.y -= dx * STICK_SENSITIVITY;
      camera.rotation.x = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(
          Math.PI / 2 - 0.05,
          camera.rotation.x + dy * STICK_SENSITIVITY,
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
