/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GalaxySimulationEngine } from '../physics/nbodyEngine';
import { CameraPreset, PhysicalMetrics } from '../types/galaxy';

interface GalaxyScene3DProps {
  engine: GalaxySimulationEngine;
  isRunning: boolean;
  simulationSpeed: number; // 0.5, 1, 2, 5, 10
  cameraPreset: CameraPreset['id'];
  showTrails: boolean;
  showRocheSpheres: boolean;
  showPotentialGrid: boolean;
  resolutionScale: number; // 1.0, 1.5, 2.0
  onMetricsUpdate?: (metrics: PhysicalMetrics) => void;
}

// Module-level reusable math vectors to ensure zero GC in animation loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

// Create procedural Gaussian star particle sprite texture (zero 404s)
function createStarTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.15, 'rgba(230, 245, 255, 0.9)');
  gradient.addColorStop(0.4, 'rgba(120, 200, 255, 0.4)');
  gradient.addColorStop(0.7, 'rgba(60, 140, 255, 0.1)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Create glowing core texture
function createCoreGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.0, 'rgba(255, 255, 240, 1.0)');
  gradient.addColorStop(0.2, 'rgba(255, 200, 100, 0.85)');
  gradient.addColorStop(0.5, 'rgba(255, 120, 50, 0.35)');
  gradient.addColorStop(0.8, 'rgba(160, 50, 255, 0.1)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const GalaxyScene3D: React.FC<GalaxyScene3DProps> = ({
  engine,
  isRunning,
  simulationSpeed,
  cameraPreset,
  showTrails,
  showRocheSpheres,
  showPotentialGrid,
  resolutionScale,
  onMetricsUpdate,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(engine);
  const isRunningRef = useRef(isRunning);
  const speedRef = useRef(simulationSpeed);
  const cameraPresetRef = useRef(cameraPreset);
  const showTrailsRef = useRef(showTrails);
  const showRocheRef = useRef(showRocheSpheres);
  const showGridRef = useRef(showPotentialGrid);
  const onMetricsUpdateRef = useRef(onMetricsUpdate);

  // Keep refs in sync with props
  useEffect(() => { engineRef.current = engine; }, [engine]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { speedRef.current = simulationSpeed; }, [simulationSpeed]);
  useEffect(() => { cameraPresetRef.current = cameraPreset; }, [cameraPreset]);
  useEffect(() => { showTrailsRef.current = showTrails; }, [showTrails]);
  useEffect(() => { showRocheRef.current = showRocheSpheres; }, [showRocheSpheres]);
  useEffect(() => { showGridRef.current = showPotentialGrid; }, [showPotentialGrid]);
  useEffect(() => { onMetricsUpdateRef.current = onMetricsUpdate; }, [onMetricsUpdate]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.0018); // matches slate-950

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.5, 3000);
    camera.position.set(0, 80, 160);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio * resolutionScale, 2.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x020617, 1);

    container.appendChild(renderer.domElement);

    // 2. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 1200;
    controls.minDistance = 5;

    // 3. Ambient Starfield Background (Zero external asset: procedural background stars)
    const bgStarsGeo = new THREE.BufferGeometry();
    const bgStarCount = 1200;
    const bgStarPos = new Float32Array(bgStarCount * 3);
    const bgStarCol = new Float32Array(bgStarCount * 3);
    for (let i = 0; i < bgStarCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 800 + Math.random() * 400;
      bgStarPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      bgStarPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      bgStarPos[i * 3 + 2] = r * Math.cos(phi);

      const temp = Math.random();
      if (temp > 0.8) {
        bgStarCol[i * 3] = 0.7; bgStarCol[i * 3 + 1] = 0.85; bgStarCol[i * 3 + 2] = 1.0; // blue
      } else if (temp > 0.4) {
        bgStarCol[i * 3] = 1.0; bgStarCol[i * 3 + 1] = 0.95; bgStarCol[i * 3 + 2] = 0.8; // white/yellow
      } else {
        bgStarCol[i * 3] = 1.0; bgStarCol[i * 3 + 1] = 0.7; bgStarCol[i * 3 + 2] = 0.6; // red
      }
    }
    bgStarsGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
    bgStarsGeo.setAttribute('color', new THREE.BufferAttribute(bgStarCol, 3));
    const starTex = createStarTexture();
    const bgStarsMat = new THREE.PointsMaterial({
      size: 1.6,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bgPoints = new THREE.Points(bgStarsGeo, bgStarsMat);
    scene.add(bgPoints);

    // 4. Galaxy Star Particles (Points)
    const curEngine = engineRef.current;
    const { totalStars, positions, colors, sizes } = curEngine.starsData;

    const starsGeo = new THREE.BufferGeometry();
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    starsGeo.setAttribute('position', posAttr);

    const colAttr = new THREE.BufferAttribute(colors, 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    starsGeo.setAttribute('color', colAttr);

    const starParticlesMat = new THREE.PointsMaterial({
      size: 2.2,
      map: starTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const galaxyPoints = new THREE.Points(starsGeo, starParticlesMat);
    galaxyPoints.frustumCulled = false;
    scene.add(galaxyPoints);

    // 5. Glowing Galactic Cores / Supermassive Black Holes
    const coreTex = createCoreGlowTexture();
    const coreMat1 = new THREE.SpriteMaterial({
      map: coreTex,
      color: 0xffe082,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreSprite1 = new THREE.Sprite(coreMat1);
    coreSprite1.scale.set(10, 10, 1);
    scene.add(coreSprite1);

    const coreMat2 = new THREE.SpriteMaterial({
      map: coreTex,
      color: 0x90caf9,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreSprite2 = new THREE.Sprite(coreMat2);
    coreSprite2.scale.set(10, 10, 1);
    scene.add(coreSprite2);

    // SMBH Event Horizon Silhouettes (pure dark centers)
    const bhGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const bhMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const bhMesh1 = new THREE.Mesh(bhGeo, bhMat);
    const bhMesh2 = new THREE.Mesh(bhGeo, bhMat);
    scene.add(bhMesh1);
    scene.add(bhMesh2);

    // 6. Trajectory Trails (Line ribbons tracing galaxy core paths)
    const maxTrailPoints = 350;
    const trailPositions1 = new Float32Array(maxTrailPoints * 3);
    const trailPositions2 = new Float32Array(maxTrailPoints * 3);
    let trailCount = 0;

    const trailGeo1 = new THREE.BufferGeometry();
    const trailPosAttr1 = new THREE.BufferAttribute(trailPositions1, 3);
    trailPosAttr1.setUsage(THREE.DynamicDrawUsage);
    trailGeo1.setAttribute('position', trailPosAttr1);

    const trailMat1 = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const trailLine1 = new THREE.Line(trailGeo1, trailMat1);
    trailLine1.frustumCulled = false;
    scene.add(trailLine1);

    const trailGeo2 = new THREE.BufferGeometry();
    const trailPosAttr2 = new THREE.BufferAttribute(trailPositions2, 3);
    trailPosAttr2.setUsage(THREE.DynamicDrawUsage);
    trailGeo2.setAttribute('position', trailPosAttr2);

    const trailMat2 = new THREE.LineBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const trailLine2 = new THREE.Line(trailGeo2, trailMat2);
    trailLine2.frustumCulled = false;
    scene.add(trailLine2);

    // 7. Roche Tidal Sphere Wireframes
    const rocheGeo = new THREE.SphereGeometry(1, 24, 16);
    const rocheMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const rocheMesh1 = new THREE.Mesh(rocheGeo, rocheMat1);
    scene.add(rocheMesh1);

    const rocheMat2 = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const rocheMesh2 = new THREE.Mesh(rocheGeo, rocheMat2);
    scene.add(rocheMesh2);

    // 8. Space-Time Warped Potential Grid
    const gridSize = 160;
    const gridDivs = 32;
    const gridGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridDivs, gridDivs);
    gridGeo.rotateX(-Math.PI / 2);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.y = -15;
    scene.add(gridMesh);

    // 9. Center of Mass Indicator
    const comGeo = new THREE.RingGeometry(1.2, 1.6, 24);
    comGeo.rotateX(-Math.PI / 2);
    const comMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const comMesh = new THREE.Mesh(comGeo, comMat);
    scene.add(comMesh);

    // Pre-warm shaders
    renderer.compile(scene, camera);

    // Animation loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let metricsTimer = 0;

    const animate = (time: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const dtSec = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const activeEngine = engineRef.current;

      // Check if engine star data reference changed (e.g. preset reset)
      if (starsGeo.getAttribute('position').array !== activeEngine.starsData.positions) {
        starsGeo.setAttribute('position', new THREE.BufferAttribute(activeEngine.starsData.positions, 3));
        starsGeo.setAttribute('color', new THREE.BufferAttribute(activeEngine.starsData.colors, 3));
        trailCount = 0;
      }

      // Physics integration step
      if (isRunningRef.current) {
        const speed = speedRef.current;
        const simDt = activeEngine.dt * speed;
        const metrics = activeEngine.step(simDt);

        // Update trail buffer
        if (trailCount < maxTrailPoints) {
          trailPositions1[trailCount * 3] = activeEngine.pos1[0];
          trailPositions1[trailCount * 3 + 1] = activeEngine.pos1[1];
          trailPositions1[trailCount * 3 + 2] = activeEngine.pos1[2];

          trailPositions2[trailCount * 3] = activeEngine.pos2[0];
          trailPositions2[trailCount * 3 + 1] = activeEngine.pos2[1];
          trailPositions2[trailCount * 3 + 2] = activeEngine.pos2[2];
          trailCount++;
        } else {
          // Shift buffer left by 1
          trailPositions1.copyWithin(0, 3);
          trailPositions2.copyWithin(0, 3);
          const lastIdx = (maxTrailPoints - 1) * 3;
          trailPositions1[lastIdx] = activeEngine.pos1[0];
          trailPositions1[lastIdx + 1] = activeEngine.pos1[1];
          trailPositions1[lastIdx + 2] = activeEngine.pos1[2];

          trailPositions2[lastIdx] = activeEngine.pos2[0];
          trailPositions2[lastIdx + 1] = activeEngine.pos2[1];
          trailPositions2[lastIdx + 2] = activeEngine.pos2[2];
        }
        trailGeo1.setDrawRange(0, trailCount);
        trailGeo2.setDrawRange(0, trailCount);
        trailPosAttr1.needsUpdate = true;
        trailPosAttr2.needsUpdate = true;

        // Flag star buffer updates
        starsGeo.getAttribute('position').needsUpdate = true;
        starsGeo.getAttribute('color').needsUpdate = true;

        // Throttled metrics update for React UI (every 100ms)
        metricsTimer += dtSec;
        if (metricsTimer > 0.08) {
          metricsTimer = 0;
          if (onMetricsUpdateRef.current) {
            onMetricsUpdateRef.current(metrics);
          }
        }
      }

      // Update Galactic Core Sprites and BH positions
      coreSprite1.position.set(activeEngine.pos1[0], activeEngine.pos1[1], activeEngine.pos1[2]);
      coreSprite2.position.set(activeEngine.pos2[0], activeEngine.pos2[1], activeEngine.pos2[2]);
      bhMesh1.position.copy(coreSprite1.position);
      bhMesh2.position.copy(coreSprite2.position);

      // Subtle core pulsing
      const pulse1 = 10 + Math.sin(time * 0.003) * 1.5;
      const pulse2 = 10 + Math.cos(time * 0.003) * 1.5;
      coreSprite1.scale.set(pulse1, pulse1, 1);
      coreSprite2.scale.set(pulse2, pulse2, 1);

      // Visibility toggles
      trailLine1.visible = showTrailsRef.current;
      trailLine2.visible = showTrailsRef.current;
      rocheMesh1.visible = showRocheRef.current;
      rocheMesh2.visible = showRocheRef.current;
      gridMesh.visible = showGridRef.current;

      // Roche sphere positions and sizes
      if (showRocheRef.current) {
        rocheMesh1.position.copy(coreSprite1.position);
        rocheMesh2.position.copy(coreSprite2.position);

        const r1 = Math.max(2, activeEngine.galaxy1.radius * 0.85);
        const r2 = Math.max(2, activeEngine.galaxy2.radius * 0.85);
        rocheMesh1.scale.set(r1, r1, r1);
        rocheMesh2.scale.set(r2, r2, r2);
      }

      // Center of Mass position
      const m1 = activeEngine.galaxy1.mass;
      const m2 = activeEngine.galaxy2.mass;
      const totalM = m1 + m2;
      const comX = (activeEngine.pos1[0] * m1 + activeEngine.pos2[0] * m2) / totalM;
      const comY = (activeEngine.pos1[1] * m1 + activeEngine.pos2[1] * m2) / totalM;
      const comZ = (activeEngine.pos1[2] * m1 + activeEngine.pos2[2] * m2) / totalM;
      comMesh.position.set(comX, comY, comZ);

      // Space-time grid potential warping (fun visual effect)
      if (showGridRef.current) {
        const gridPos = gridGeo.attributes.position as THREE.BufferAttribute;
        const vCount = gridPos.count;
        for (let i = 0; i < vCount; i++) {
          const gx = gridPos.getX(i);
          const gz = gridPos.getZ(i);

          const d1Sq = Math.pow(gx - activeEngine.pos1[0], 2) + Math.pow(gz - activeEngine.pos1[2], 2);
          const d2Sq = Math.pow(gx - activeEngine.pos2[0], 2) + Math.pow(gz - activeEngine.pos2[2], 2);

          const pot1 = - (m1 * 30) / Math.sqrt(d1Sq + 25);
          const pot2 = - (m2 * 30) / Math.sqrt(d2Sq + 25);
          const totalPot = Math.max(-18, pot1 + pot2);

          gridPos.setY(i, totalPot * 0.12);
        }
        gridPos.needsUpdate = true;
      }

      // Camera Presets Smooth Damping
      const preset = cameraPresetRef.current;
      if (preset === 'top') {
        _camTarget.set(comX, comY, comZ);
        _v1.set(comX, comY + 220, comZ + 0.1);
        camera.position.lerp(_v1, 0.05);
        controls.target.lerp(_camTarget, 0.05);
      } else if (preset === 'side') {
        _camTarget.set(comX, comY, comZ);
        _v1.set(comX + 220, comY, comZ);
        camera.position.lerp(_v1, 0.05);
        controls.target.lerp(_camTarget, 0.05);
      } else if (preset === 'com') {
        _camTarget.set(comX, comY, comZ);
        controls.target.lerp(_camTarget, 0.06);
      } else if (preset === 'follow_g1') {
        _camTarget.set(activeEngine.pos1[0], activeEngine.pos1[1], activeEngine.pos1[2]);
        controls.target.lerp(_camTarget, 0.08);
      } else if (preset === 'follow_g2') {
        _camTarget.set(activeEngine.pos2[0], activeEngine.pos2[1], activeEngine.pos2[2]);
        controls.target.lerp(_camTarget, 0.08);
      } else if (preset === 'cinematic') {
        // Slow cinematic rotation around center of mass
        const angle = time * 0.0002;
        const rad = 170;
        _v1.set(comX + Math.cos(angle) * rad, comY + 50 + Math.sin(angle * 0.5) * 20, comZ + Math.sin(angle) * rad);
        camera.position.lerp(_v1, 0.03);
        _camTarget.set(comX, comY, comZ);
        controls.target.lerp(_camTarget, 0.05);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Window resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio * resolutionScale, 2.5));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js resources
      starsGeo.dispose();
      starParticlesMat.dispose();
      bgStarsGeo.dispose();
      bgStarsMat.dispose();
      starTex.dispose();
      coreTex.dispose();
      coreMat1.dispose();
      coreMat2.dispose();
      bhGeo.dispose();
      bhMat.dispose();
      trailGeo1.dispose();
      trailGeo2.dispose();
      trailMat1.dispose();
      trailMat2.dispose();
      rocheGeo.dispose();
      rocheMat1.dispose();
      rocheMat2.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      comGeo.dispose();
      comMat.dispose();
      controls.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [engine, resolutionScale]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    />
  );
};
