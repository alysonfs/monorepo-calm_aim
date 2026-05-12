import * as THREE from "three";

export interface Target {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spawnedAt: number;
}

export interface TargetSystemResult {
  targets: Target[];
  update(delta: number): void;
  setDificuldade(d: number): void;
  /**
   * Verifica hit por raycast a partir da câmera.
   * Retorna timestamp de spawn do alvo atingido (para calcular reação) ou null.
   */
  checkHit(camera: THREE.Camera, scene: THREE.Scene): number | null;
  dispose(scene: THREE.Scene): void;
}

const TARGET_RADIUS_MAX = 0.45;
const TARGET_RADIUS_MIN = 0.18;
const SPAWN_INTERVAL_MIN_MS = 700;
const SPAWN_INTERVAL_MAX_MS = 2500;
const TARGET_SPEED_MIN = 1.0;
const TARGET_SPEED_MAX = 4.0;
const MAX_TARGETS = 6;
const ARENA_HALF = 8;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function makeTarget(scene: THREE.Scene, dificuldade: number): Target {
  const radius = lerp(TARGET_RADIUS_MAX, TARGET_RADIUS_MIN, dificuldade);
  const speed = lerp(TARGET_SPEED_MIN, TARGET_SPEED_MAX, dificuldade);
  const geo = new THREE.SphereGeometry(radius, 12, 12);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
  const mesh = new THREE.Mesh(geo, mat);

  mesh.position.set(
    (Math.random() - 0.5) * ARENA_HALF * 2,
    1.2 + Math.random() * 2,
    -4 - Math.random() * 6,
  );

  const angle = Math.random() * Math.PI * 2;
  const velocity = new THREE.Vector3(
    Math.cos(angle) * speed,
    (Math.random() - 0.5) * speed * 0.5,
    Math.sin(angle) * speed * 0.3,
  );

  scene.add(mesh);
  return { mesh, velocity, spawnedAt: performance.now() };
}

export function createTargetSystem(scene: THREE.Scene): TargetSystemResult {
  const targets: Target[] = [];
  let lastSpawn = 0;
  let dificuldadeAtual = 0.3;
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);

  return {
    targets,

    setDificuldade(d: number) {
      dificuldadeAtual = Math.max(0, Math.min(1, d));
    },

    update(delta) {
      const now = performance.now();
      const spawnInterval = lerp(
        SPAWN_INTERVAL_MAX_MS,
        SPAWN_INTERVAL_MIN_MS,
        dificuldadeAtual,
      );

      if (now - lastSpawn > spawnInterval && targets.length < MAX_TARGETS) {
        targets.push(makeTarget(scene, dificuldadeAtual));
        lastSpawn = now;
      }

      for (let i = targets.length - 1; i >= 0; i--) {
        const t = targets[i]!;
        t.mesh.position.addScaledVector(t.velocity, delta);

        // bounce off arena walls
        if (Math.abs(t.mesh.position.x) > ARENA_HALF) {
          t.velocity.x *= -1;
        }
        if (t.mesh.position.y < 0.5 || t.mesh.position.y > 5) {
          t.velocity.y *= -1;
        }
      }
    },

    checkHit(camera, scene) {
      raycaster.setFromCamera(center, camera);
      const meshes = targets.map((t) => t.mesh);
      const hits = raycaster.intersectObjects(meshes);
      if (!hits.length || !hits[0]) return null;

      const hitMesh = hits[0].object as THREE.Mesh;
      const idx = targets.findIndex((t) => t.mesh === hitMesh);
      if (idx === -1) return null;

      const spawnedAt = targets[idx]!.spawnedAt;
      scene.remove(hitMesh);
      (hitMesh as THREE.Mesh).geometry.dispose();
      ((hitMesh as THREE.Mesh).material as THREE.Material).dispose();
      targets.splice(idx, 1);

      return spawnedAt;
    },

    dispose(scene) {
      targets.forEach((t) => {
        scene.remove(t.mesh);
        t.mesh.geometry.dispose();
        (t.mesh.material as THREE.Material).dispose();
      });
      targets.length = 0;
    },
  };
}
