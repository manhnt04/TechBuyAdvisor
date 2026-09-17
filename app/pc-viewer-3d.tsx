'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createPcModel,
  PcModelInstance,
} from '@/lib/threejs/pc-model-builder';

interface PcViewer3DProps {
  className?: string;
  height?: string | number;
  initialPreset?: string;
  showControls?: boolean;
  onOpenModal?: () => void;
}

/**
 * Procedural Soft Radial Contact Shadow Texture
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.32)');
    grad.addColorStop(0.4, 'rgba(15, 23, 42, 0.15)');
    grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.04)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

export default function PcViewer3D({
  className = '',
  height = '520px',
  initialPreset = 'sunset',
  showControls = false,
  onOpenModal,
}: PcViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pcModelRef = useRef<PcModelInstance | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera Framing: Generous clearance all around (top, bottom, sides) with zero cut-off
    const width = container.clientWidth || 580;
    const heightPx = container.clientHeight || 520;
    const camera = new THREE.PerspectiveCamera(36, width / heightPx, 0.1, 100);
    // Positioned slightly further back and elevated, aimed comfortably at center of case
    camera.position.set(-4.6, 1.2, 5.4);
    cameraRef.current = camera;

    // 3. Renderer with high visual fidelity, 100% transparent canvas background
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls: Horizontal-only rotation around PC, no zoom, no pan
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Locked zoom
    controls.enablePan = false;  // Locked pan
    // Tilt angle clamped to showroom vantage point
    controls.minPolarAngle = Math.PI / 2 - 0.25;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.target.set(0, 0, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controlsRef.current = controls;

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.0);
    keyLight.position.set(-5, 8, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(6, 4, -4);
    scene.add(fillLight);

    // Rim Light
    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    // Soft Contact Shadow Plane (naturally fades out beneath the PC feet)
    const shadowTex = createContactShadowTexture();
    const shadowGeom = new THREE.PlaneGeometry(4.0, 4.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -1.64, 0);
    scene.add(shadowMesh);

    // 7. Build the Procedural PC Model
    const pcModel = createPcModel();
    pcModel.group.scale.set(0.80, 0.80, 0.80);
    scene.add(pcModel.group);
    pcModelRef.current = pcModel;

    // Apply Sunset Amber preset
    pcModel.setLightingPreset(initialPreset);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let lastTime = performance.now();
    const startTime = lastTime;
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      const elapsed = (now - startTime) / 1000;
      lastTime = now;

      controls.update();

      if (pcModelRef.current) {
        pcModelRef.current.update(delta, elapsed, {
          fanSpeed: 1.2,
          preset: initialPreset,
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      shadowTex.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [initialPreset]);

  return (
    <div
      className={`pc-viewer-3d-clean ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
        overflow: 'visible',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          touchAction: 'none',
        }}
      />
    </div>
  );
}
