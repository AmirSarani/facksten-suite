"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ComponentDef } from "@/lab/types";
import { buildPartModel, disposeObject, setGlow } from "@/lab/visuals/models-3d";
import { PartThumb } from "@/lab/visuals/part-art";

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
    const { group, glow } = buildPartModel(def);
    glowRef.current = glow;
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
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    const radius = Math.max(size.x, size.y, size.z);
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

    const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 500);
    const dist = radius * 2.1 + 1;
    camera.position.set(dist * 0.75, dist * 0.8, dist);
    const target = new THREE.Vector3(0, size.y * 0.35, 0);
    camera.lookAt(target);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = radius * 0.8;
    controls.maxDistance = radius * 5;
    controls.maxPolarAngle = Math.PI / 2.05;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 1.6;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let visible = true;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(host);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
    };
    tick();
    host.dataset.ready = "true"; // hides the 2D fallback under the transparent canvas

    return () => {
      delete host.dataset.ready;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
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
      {/* 2D drawing shows while three.js boots, and stays if WebGL is unavailable */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 opacity-60 group-data-[ready=true]:hidden">
        <PartThumb def={def} className="h-full max-h-40 w-auto" />
      </div>
    </div>
  );
}
