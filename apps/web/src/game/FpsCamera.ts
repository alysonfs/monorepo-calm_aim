import * as THREE from "three";

export interface FpsCameraResult {
  camera: THREE.PerspectiveCamera;
  player: THREE.Object3D;
  /** Ativa o Pointer Lock no canvas */
  lock(): void;
  /** Remove listeners e libera recursos */
  dispose(): void;
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
    dispose() {
      document.removeEventListener("mousemove", onMouseMove);
    },
  };
}
