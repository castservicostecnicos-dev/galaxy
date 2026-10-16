/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GalaxyParams } from '../types/galaxy';
import { G_ASTRONOMICAL, kmsToKpcMyr } from './constants';

export interface GeneratedStarsData {
  positions: Float32Array; // [x, y, z] for each star
  velocities: Float32Array; // [vx, vy, vz] for each star in kpc/Myr
  colors: Float32Array; // [r, g, b] for each star
  sizes: Float32Array; // float per star
  galaxyIds: Uint8Array; // 1 or 2
  originalRadii: Float32Array; // initial distance to host galaxy core
  starburstAges: Float32Array; // age/excitation factor
  totalStars: number;
}

// Convert hex color to normalized RGB
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b];
}

/**
 * Calculates theoretical circular velocity v_circ(R) at radius R
 * taking into account:
 * 1. Central Supermassive Black Hole (point-mass)
 * 2. Bulge (Plummer sphere profile)
 * 3. Exponential stellar disk
 * 4. Dark Matter Halo (Hernquist profile)
 */
export function calculateCircularVelocity(r: number, g: GalaxyParams): number {
  if (r <= 0.05) return 0;

  // SMBH mass (convert 10^6 M_sun to 10^10 M_sun units: 10^6 / 10^10 = 1e-4)
  const mBH = g.blackHoleMass * 1e-4;
  const mBulge = g.mass * g.bulgeFraction;
  const mDisk = g.mass * (1 - g.bulgeFraction);
  const mHalo = g.mass * g.haloMassRatio;
  const aHalo = g.haloScaleRadius;
  const aBulge = g.bulgeRadius;

  // Bulge mass enclosed within r (Plummer sphere)
  const mBulgeEnclosed = mBulge * Math.pow(r, 3) / Math.pow(r * r + aBulge * aBulge, 1.5);

  // Hernquist dark matter halo enclosed mass: M_h(r) = M_halo * r^2 / (r + a_halo)^2
  const mHaloEnclosed = mHalo * (r * r) / Math.pow(r + aHalo, 2);

  // Stellar disk enclosed mass approximation (Freeman exponential disk)
  const rd = g.radius * 0.35;
  const y = r / (2 * rd);
  // Approximation of Freeman disk cumulative mass fraction: 1 - (1 + y) * exp(-y)
  const mDiskEnclosed = mDisk * (1 - Math.exp(-r / rd) * (1 + r / rd));

  const totalEnclosedMass = mBH + mBulgeEnclosed + mHaloEnclosed + mDiskEnclosed;

  // v^2 = G * M(r) / r
  const vSquared = (G_ASTRONOMICAL * totalEnclosedMass) / r;
  return Math.sqrt(Math.max(0, vSquared));
}

/**
 * Generates initial star distribution for a single galaxy
 */
export function generateSingleGalaxyStars(
  g: GalaxyParams,
  galaxyIndex: 1 | 2
): {
  pos: number[];
  vel: number[];
  col: number[];
  sizes: number[];
  gIds: number[];
  radii: number[];
  starburst: number[];
} {
  const pos: number[] = [];
  const vel: number[] = [];
  const col: number[] = [];
  const sizes: number[] = [];
  const gIds: number[] = [];
  const radii: number[] = [];
  const starburst: number[] = [];

  const bulgeRgb = hexToRgb(g.colorBulge);
  const diskRgb = hexToRgb(g.colorDisk);
  const numBulgeStars = Math.floor(g.numStars * g.bulgeFraction);
  const numDiskStars = g.numStars - numBulgeStars;

  const degToRad = Math.PI / 180;
  const incRad = g.inclination * degToRad;
  const periRad = g.argumentOfPericenter * degToRad;

  // Galaxy center position and velocity
  const [gx, gy, gz] = g.position;
  const gvKpcMyr: [number, number, number] = [
    kmsToKpcMyr(g.velocity[0]),
    kmsToKpcMyr(g.velocity[1]),
    kmsToKpcMyr(g.velocity[2]),
  ];

  // Helper rotation matrix for inclination (tilt around X) and pericenter rotation (around Z)
  function rotateCoordinates(x: number, y: number, z: number): [number, number, number] {
    // 1. In-plane rotation (argument of pericenter)
    const cosP = Math.cos(periRad);
    const sinP = Math.sin(periRad);
    const x1 = x * cosP - y * sinP;
    const y1 = x * sinP + y * cosP;
    const z1 = z;

    // 2. Inclination tilt (around X axis)
    const cosI = Math.cos(incRad);
    const sinI = Math.sin(incRad);
    const x2 = x1;
    const y2 = y1 * cosI - z1 * sinI;
    const z2 = y1 * sinI + z1 * cosI;

    return [x2, y2, z2];
  }

  // 1. Generate Bulge Stars (Spheroidal Plummer distribution)
  for (let i = 0; i < numBulgeStars; i++) {
    // Plummer distribution radius sampling
    const u = Math.random();
    const r = g.bulgeRadius * Math.sqrt(Math.pow(u, -2 / 3) - 1);
    const boundedR = Math.min(r, g.bulgeRadius * 3.5);

    // Uniform spherical direction
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    const lx = boundedR * Math.sin(phi) * Math.cos(theta);
    const ly = boundedR * Math.sin(phi) * Math.sin(theta);
    const lz = boundedR * Math.cos(phi) * 0.75; // slightly oblate

    // Bulge stars have isotropic velocity dispersion with slight net rotation
    const vCirc = calculateCircularVelocity(boundedR, g);
    const sigma = vCirc * 0.45; // velocity dispersion

    // Slight rotation
    const vRot = vCirc * 0.3 * g.rotationSense;
    const lvx = -vRot * Math.sin(theta) + (Math.random() - 0.5) * sigma;
    const lvy = vRot * Math.cos(theta) + (Math.random() - 0.5) * sigma;
    const lvz = (Math.random() - 0.5) * sigma * 0.7;

    const [rx, ry, rz] = rotateCoordinates(lx, ly, lz);
    const [rvx, rvy, rvz] = rotateCoordinates(lvx, lvy, lvz);

    pos.push(rx + gx, ry + gy, rz + gz);
    vel.push(rvx + gvKpcMyr[0], rvy + gvKpcMyr[1], rvz + gvKpcMyr[2]);

    // Bulge stars color: warm golden-orange with subtle variance
    const colorVar = (Math.random() - 0.5) * 0.15;
    col.push(
      Math.min(1, Math.max(0, bulgeRgb[0] + colorVar)),
      Math.min(1, Math.max(0, bulgeRgb[1] + colorVar)),
      Math.min(1, Math.max(0, bulgeRgb[2] + colorVar))
    );

    sizes.push(1.2 + Math.random() * 1.8);
    gIds.push(galaxyIndex);
    radii.push(boundedR);
    starburst.push(0);
  }

  // 2. Generate Disk Stars (Exponential disk with spiral perturbation)
  const rd = g.radius * 0.35;
  for (let i = 0; i < numDiskStars; i++) {
    // Exponential disk radial distribution: r = -rd * ln(1 - u)
    const u = Math.random() * 0.98 + 0.01;
    let r = -rd * Math.log(1 - u);
    r = Math.min(r, g.radius * 1.35);

    // Azimuthal angle with logarithmic spiral arm structure
    let angle = Math.random() * 2 * Math.PI;

    if (g.spiralArmsCount > 0 && g.type.includes('spiral')) {
      // Modulate angle toward spiral arms
      const armIndex = Math.floor(Math.random() * g.spiralArmsCount);
      const armBaseAngle = (armIndex * 2 * Math.PI) / g.spiralArmsCount;
      const armAngle = armBaseAngle + Math.log(Math.max(0.1, r / rd)) * g.spiralTightness * g.rotationSense;
      // Scatter around the arm centerline
      const armScatter = (Math.random() - 0.5) * 0.45;
      angle = armAngle + armScatter;
    }

    // Vertical scale height: sech^2(z / z0) ~ exp(-|z|/z0)
    const z0 = g.diskScaleHeight;
    const zSign = Math.random() > 0.5 ? 1 : -1;
    const lz = -z0 * Math.log(Math.max(1e-4, 1 - Math.random())) * zSign;

    const lx = r * Math.cos(angle);
    const ly = r * Math.sin(angle);

    // Circular velocity matching gravitational equilibrium
    const vCirc = calculateCircularVelocity(r, g);
    // Add small Toomre velocity dispersion for realistic stability
    const vDisp = vCirc * 0.08;
    const vr = (Math.random() - 0.5) * vDisp;
    const vTheta = vCirc * g.rotationSense + (Math.random() - 0.5) * vDisp;

    // Convert cylindrical velocity (vr, vTheta) to Cartesian (lvx, lvy)
    const lvx = vr * Math.cos(angle) - vTheta * Math.sin(angle);
    const lvy = vr * Math.sin(angle) + vTheta * Math.cos(angle);
    const lvz = (Math.random() - 0.5) * vDisp * 0.5;

    const [rx, ry, rz] = rotateCoordinates(lx, ly, lz);
    const [rvx, rvy, rvz] = rotateCoordinates(lvx, lvy, lvz);

    pos.push(rx + gx, ry + gy, rz + gz);
    vel.push(rvx + gvKpcMyr[0], rvy + gvKpcMyr[1], rvz + gvKpcMyr[2]);

    // Color gradient: transition from warmer inner disk to luminous cyan/blue outer arms
    const radFraction = Math.min(1, r / g.radius);
    const rCol = bulgeRgb[0] * (1 - radFraction) + diskRgb[0] * radFraction;
    const gCol = bulgeRgb[1] * (1 - radFraction) + diskRgb[1] * radFraction;
    const bCol = bulgeRgb[2] * (1 - radFraction) + diskRgb[2] * radFraction;

    const starTint = (Math.random() - 0.5) * 0.12;
    col.push(
      Math.min(1, Math.max(0, rCol + starTint)),
      Math.min(1, Math.max(0, gCol + starTint)),
      Math.min(1, Math.max(0, bCol + starTint))
    );

    sizes.push(0.9 + Math.random() * 1.5);
    gIds.push(galaxyIndex);
    radii.push(r);
    starburst.push(0);
  }

  return { pos, vel, col, sizes, gIds, radii, starburst };
}

/**
 * Generates the complete dual-galaxy initial particle state
 */
export function generateGalaxyPair(
  galaxy1: GalaxyParams,
  galaxy2: GalaxyParams
): GeneratedStarsData {
  const g1 = generateSingleGalaxyStars(galaxy1, 1);
  const g2 = generateSingleGalaxyStars(galaxy2, 2);

  const totalStars = g1.gIds.length + g2.gIds.length;

  const positions = new Float32Array(totalStars * 3);
  const velocities = new Float32Array(totalStars * 3);
  const colors = new Float32Array(totalStars * 3);
  const sizes = new Float32Array(totalStars);
  const galaxyIds = new Uint8Array(totalStars);
  const originalRadii = new Float32Array(totalStars);
  const starburstAges = new Float32Array(totalStars);

  // Pack Galaxy 1
  for (let i = 0; i < g1.gIds.length; i++) {
    positions[i * 3] = g1.pos[i * 3];
    positions[i * 3 + 1] = g1.pos[i * 3 + 1];
    positions[i * 3 + 2] = g1.pos[i * 3 + 2];

    velocities[i * 3] = g1.vel[i * 3];
    velocities[i * 3 + 1] = g1.vel[i * 3 + 1];
    velocities[i * 3 + 2] = g1.vel[i * 3 + 2];

    colors[i * 3] = g1.col[i * 3];
    colors[i * 3 + 1] = g1.col[i * 3 + 1];
    colors[i * 3 + 2] = g1.col[i * 3 + 2];

    sizes[i] = g1.sizes[i];
    galaxyIds[i] = 1;
    originalRadii[i] = g1.radii[i];
    starburstAges[i] = 0;
  }

  // Pack Galaxy 2
  const offset = g1.gIds.length;
  for (let i = 0; i < g2.gIds.length; i++) {
    const idx = offset + i;
    positions[idx * 3] = g2.pos[i * 3];
    positions[idx * 3 + 1] = g2.pos[i * 3 + 1];
    positions[idx * 3 + 2] = g2.pos[i * 3 + 2];

    velocities[idx * 3] = g2.vel[i * 3];
    velocities[idx * 3 + 1] = g2.vel[i * 3 + 1];
    velocities[idx * 3 + 2] = g2.vel[i * 3 + 2];

    colors[idx * 3] = g2.col[i * 3];
    colors[idx * 3 + 1] = g2.col[i * 3 + 1];
    colors[idx * 3 + 2] = g2.col[i * 3 + 2];

    sizes[idx] = g2.sizes[i];
    galaxyIds[idx] = 2;
    originalRadii[idx] = g2.radii[i];
    starburstAges[idx] = 0;
  }

  return {
    positions,
    velocities,
    colors,
    sizes,
    galaxyIds,
    originalRadii,
    starburstAges,
    totalStars,
  };
}
