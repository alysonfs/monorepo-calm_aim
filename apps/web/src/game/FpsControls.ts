import * as THREE from "three";
import type { EventoDualSense } from "@calm-aim/core";

export interface FpsControlsResult {
  update(delta: number, controllerEvento?: EventoDualSense | null): void;
  dispose(): void;
}

const SPEED = 8;
const GRAVITY = -20;
const JUMP_FORCE = 8;
const FLOOR_Y = 0;
const STICK_DEADZONE = 0.15;

export function createFpsControls(
  player: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
): FpsControlsResult {
  const keys: Record<string, boolean> = {};
  const velocity = new THREE.Vector3();

  const onKeyDown = (e: KeyboardEvent) => (keys[e.code] = true);
  const onKeyUp = (e: KeyboardEvent) => (keys[e.code] = false);

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  return {
    update(delta, controllerEvento) {
      const onFloor = player.position.y <= FLOOR_Y + 1.6;

      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      camera.updateMatrixWorld();
      forward.setFromMatrixColumn(camera.matrixWorld, 2).negate();
      forward.y = 0;
      forward.normalize();
      right.setFromMatrixColumn(camera.matrixWorld, 0);
      right.y = 0;
      right.normalize();

      const move = new THREE.Vector3();

      // Teclado
      if (keys["KeyW"]) move.add(forward);
      if (keys["KeyS"]) move.sub(forward);
      if (keys["KeyA"]) move.sub(right);
      if (keys["KeyD"]) move.add(right);

      // Stick esquerdo do DualSense
      if (controllerEvento?.conectado) {
        const sx = controllerEvento.sticks.esquerdo.x;
        const sy = controllerEvento.sticks.esquerdo.y;
        if (Math.abs(sx) > STICK_DEADZONE) move.addScaledVector(right, sx);
        if (Math.abs(sy) > STICK_DEADZONE) move.addScaledVector(forward, sy);
      }

      if (move.lengthSq() > 0) move.normalize().multiplyScalar(SPEED);

      velocity.x = move.x;
      velocity.z = move.z;

      const jumpPressed =
        keys["Space"] || (controllerEvento?.botoes["cross"] ?? false);

      if (onFloor) {
        velocity.y = 0;
        if (jumpPressed) velocity.y = JUMP_FORCE;
      } else {
        velocity.y += GRAVITY * delta;
      }

      player.position.addScaledVector(velocity, delta);

      // floor clamp
      if (player.position.y < FLOOR_Y + 1.6) {
        player.position.y = FLOOR_Y + 1.6;
        velocity.y = 0;
      }
    },
    dispose() {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    },
  };
}
