import * as THREE from "three";

export interface FpsControlsResult {
  update(delta: number): void;
  dispose(): void;
}

const SPEED = 8;
const GRAVITY = -20;
const JUMP_FORCE = 8;
const FLOOR_Y = 0;

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
    update(delta) {
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
      if (keys["KeyW"]) move.add(forward);
      if (keys["KeyS"]) move.sub(forward);
      if (keys["KeyA"]) move.sub(right);
      if (keys["KeyD"]) move.add(right);
      if (move.lengthSq() > 0) move.normalize().multiplyScalar(SPEED);

      velocity.x = move.x;
      velocity.z = move.z;

      if (onFloor) {
        velocity.y = 0;
        if (keys["Space"]) velocity.y = JUMP_FORCE;
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
