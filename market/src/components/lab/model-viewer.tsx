"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { ComponentDef } from "@/lab/types";
import { buildPartModel, disposeObject, setGlow } from "@/lab/visuals/models-3d";
import { PartThumb } from "@/lab/visuals/part-art";

/** Name build.mjs gives the LED/screen material inside a converted GLB, so it can glow. */
const GLB_GLOW_NAME = "lab-glow";

/** Real GLB when the part has one (converted from open CAD — see public/lab/models/CREDITS.md), else the in-code model. */
async function loadModel(def: ComponentDef, signal: AbortSignal): Promise<{ group: THREE.Group; glow: THREE.MeshStandardMaterial[]; real: boolean }> {
  if (def.modelUrl?.endsWith(".glb")) {
    try {
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync(def.modelUrl);
      if (signal.aborted) return { group: new THREE.Group(), glow: [], real: false };
      const glow: THREE.MeshStandardMaterial[] = [];
      gltf.scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && (mesh.material as THREE.Material)?.name === GLB_GLOW_NAME) {
          glow.push(mesh.material as THREE.MeshStandardMaterial);
        }
      });
      return { group: gltf.scene as THREE.Group, glow, real: true };
    } catch {
      // network hiccup or a source CAD file changed shape — the in-code model still teaches the pinout
    }
  }
  const { group, glow } = buildPartModel(def);
  return { group, glow, real: false };
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Rotatable 3D preview of a part. Loaded lazily (three.js stays out of the main bundle),
 * renders only while on screen, and falls back to the 2D drawing without WebGL.
 */
export function ModelViewer({ def, lit = false }: { def: ComponentDef; lit?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const [webgl] = useState(hasWebGL);
  const [isReal, setIsReal] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !webgl) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // keep the 2D fallback underneath
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const abort = new AbortController();
    let disposed = false;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    let io: IntersectionObserver | undefined;
    let controls: OrbitControls | undefined;

    void (async () => {
      const { group, glow, real } = await loadModel(def, abort.signal);
      if (disposed) {
        disposeObject(group);
        return;
      }
      glowRef.current = glow;
      setIsReal(real);

      // centre the model on the floor
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      group.position.set(-center.x, -box.min.y, -center.z);
      scene.add(group);

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.35 }));
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x1c1c2e, 1.1));
      const radius = Math.max(size.x, size.y, size.z, 0.001);
      const key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(radius, radius * 2, radius * 1.2);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      const sc = key.shadow.camera;
      sc.left = sc.bottom = -radius * 1.5;
      sc.right = sc.top = radius * 1.5;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xff7a00, 1.4); // brand-orange rim light
      rim.position.set(-radius * 1.5, radius, -radius * 1.5);
      scene.add(rim);

      const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 500);
      const target = new THREE.Vector3(0, size.y * 0.45, 0);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(target);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.maxPolarAngle = Math.PI / 2.05;

      // Corners of the (now centred) model, used to frame it tightly.
      const half = size.clone().multiplyScalar(0.5);
      const corners: THREE.Vector3[] = [];
      for (const sx of [-1, 1]) for (const sy of [0, 2]) for (const sz of [-1, 1]) {
        corners.push(new THREE.Vector3(sx * half.x, sy * half.y, sz * half.z));
      }
      /** Distance at which the model fills ~80% of the view at every auto-rotation angle. */
      const frame = () => {
        const base = new THREE.Vector3(0.7, 0.85, 1).normalize();
        let dist = radius * 2;
        for (let iter = 0; iter < 4; iter++) {
          let worst = 0;
          for (let a = 0; a < 8; a++) {
            const dir = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (a * Math.PI) / 4);
            camera.position.copy(target).addScaledVector(dir, dist);
            camera.lookAt(target);
            camera.updateMatrixWorld();
            for (const c of corners) {
              const p = c.clone().project(camera);
              worst = Math.max(worst, Math.abs(p.x), Math.abs(p.y));
            }
          }
          dist *= worst / 0.8;
        }
        camera.position.copy(target).addScaledVector(base, dist);
        camera.lookAt(target);
        controls!.minDistance = dist * 0.45;
        controls!.maxDistance = dist * 2.5;
        controls!.update();
      };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 1.6;
      controls.addEventListener("start", () => {
        controls!.autoRotate = false;
      });

      const resize = () => {
        const w = host.clientWidth || 1;
        const h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        frame();
      };
      resize();
      ro = new ResizeObserver(resize);
      ro.observe(host);

      let visible = true;
      io = new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
      });
      io.observe(host);

      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (!visible || document.hidden) return;
        controls!.update();
        renderer.render(scene, camera);
      };
      tick();
      host.dataset.ready = "true"; // hides the 2D fallback under the transparent canvas
    })();

    return () => {
      disposed = true;
      abort.abort();
      delete host.dataset.ready;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      controls?.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
      glowRef.current = [];
    };
  }, [def, webgl]);

  // Light LEDs / screens without rebuilding the scene
  useEffect(() => {
    setGlow(glowRef.current, lit);
  }, [lit, def]);

  return (
    <div
      ref={hostRef}
      className="group relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
      role="img"
      aria-label={`مدل سه‌بعدی ${def.name} — برای چرخاندن بکشید`}
    >
      {/* 2D drawing shows while the model loads, and stays if WebGL is unavailable */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 opacity-60 group-data-[ready=true]:hidden">
        <PartThumb def={def} className="h-full max-h-40 w-auto" />
      </div>
      {isReal && (
        <span className="pointer-events-none absolute top-2 right-2 border border-accent-tertiary/50 bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-accent-tertiary">
          مدل CAD واقعی
        </span>
      )}
    </div>
  );
}
