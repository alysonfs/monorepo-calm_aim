import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export type AnimationName =
  | "Armature|Idle"
  | "Armature|Shoot"
  | "Armature|Reload";

export interface FpsRigResult {
  object: THREE.Object3D;
  play(name: AnimationName): void;
  update(delta: number): void;
  dispose(): void;
}

export function loadFpsRig(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
): Promise<FpsRigResult> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    loader.load(
      "/models/FpsAKM.glb",
      (gltf) => {
        const gun = gltf.scene;
        gun.scale.set(0.08, 0.08, 0.08);
        gun.rotation.set(0, Math.PI / 2, 0);

        const gunHolder = new THREE.Object3D();
        // O posicionamento do gunHolder é ajustado para alinhar a arma corretamente na câmera, considerando a posição do modelo 3D e o ponto de mira desejado.
        gunHolder.position.set(0.15, -0.25, -0.35);
        camera.add(gunHolder);
        gunHolder.add(gun);

        const mixer = new THREE.AnimationMixer(gun);
        const clips: Partial<Record<AnimationName, THREE.AnimationAction>> = {};

        gltf.animations.forEach((clip) => {
          clips[clip.name as AnimationName] = mixer.clipAction(clip);
        });

        let isPlaying = false;

        function play(name: AnimationName) {
          if (isPlaying && name !== "Armature|Idle") return;
          Object.values(clips).forEach((a) => a?.stop());
          const action = clips[name];
          if (action) {
            if (name !== "Armature|Idle") {
              isPlaying = true;
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
              action.reset().play();
              mixer.addEventListener("finished", () => {
                isPlaying = false;
                play("Armature|Idle");
              });
            } else {
              action.reset().play();
            }
          }
        }

        play("Armature|Idle");

        resolve({
          object: gun,
          play,
          update(delta) {
            mixer.update(delta);
          },
          dispose() {
            camera.remove(gunHolder);
            mixer.stopAllAction();
          },
        });
      },
      undefined,
      reject,
    );
  });
}

/** Weapon placeholder (caixa) usado enquanto o GLB não está disponível. */
export function createPlaceholderRig(
  camera: THREE.PerspectiveCamera,
): FpsRigResult {
  const geo = new THREE.BoxGeometry(0.08, 0.06, 0.35);
  const mat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const mesh = new THREE.Mesh(geo, mat);

  const holder = new THREE.Object3D();
  holder.position.set(0.15, -0.2, -0.45);
  camera.add(holder);
  holder.add(mesh);

  return {
    object: mesh,
    play() {},
    update() {},
    dispose() {
      camera.remove(holder);
      geo.dispose();
      mat.dispose();
    },
  };
}
