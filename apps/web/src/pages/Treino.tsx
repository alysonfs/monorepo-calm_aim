import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

const backButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "1rem",
  left: "1rem",
  padding: "0.5rem 1rem",
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.9rem",
  zIndex: 10,
};

export default function Treino() {
  const mountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <button style={backButtonStyle} onClick={() => navigate("/dashboard")}>
        ← Dashboard
      </button>
      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", background: "#000" }}
      />
    </div>
  );
}
