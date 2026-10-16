/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GalaxyMorphology = 
  | 'spiral_sa' 
  | 'spiral_sb' 
  | 'spiral_sc' 
  | 'barred_spiral' 
  | 'elliptical_e0' 
  | 'elliptical_e4' 
  | 'lenticular_s0' 
  | 'dwarf_spheroidal'
  | 'ring_galaxy';

export interface GalaxyParams {
  id: number;
  name: string;
  catalogId?: string;
  type: GalaxyMorphology;
  // Astronomical physical units
  mass: number; // in 10^10 Solar Masses (M_sun)
  radius: number; // in kpc (kiloparsecs)
  bulgeRadius: number; // in kpc
  bulgeFraction: number; // fraction of total stellar mass (0.1 - 0.7)
  blackHoleMass: number; // in 10^6 Solar Masses (e.g. 4.3 for Sgr A*)
  haloMassRatio: number; // ratio of dark matter halo to visible mass (typically 5 - 10)
  haloScaleRadius: number; // in kpc
  diskScaleHeight: number; // in kpc
  numStars: number; // particle count
  colorBulge: string; // hex
  colorDisk: string; // hex
  colorStarburst: string; // hex
  // Spatial state
  position: [number, number, number]; // [x, y, z] in kpc
  velocity: [number, number, number]; // [vx, vy, vz] in km/s
  inclination: number; // tilt angle in degrees
  argumentOfPericenter: number; // rotation in orbital plane (degrees)
  rotationSense: 1 | -1; // 1 = counter-clockwise, -1 = clockwise (prograde vs retrograde)
  spiralArmsCount: number; // 2, 3, 4
  spiralTightness: number; // pitch angle factor
}

export interface SimulationPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  galaxy1: GalaxyParams;
  galaxy2: GalaxyParams;
  suggestedDurationMyr: number;
  recommendedDt: number;
  tags: string[];
  astronomicalNotes: string;
}

export interface TrajectoryPoint {
  timeMyr: number;
  pos1: [number, number, number];
  pos2: [number, number, number];
  vel1: [number, number, number];
  vel2: [number, number, number];
  separationKpc: number;
  relVelocityKms: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  energyDriftPercent: number;
  angularMomentum: number;
  virialRatio: number;
  starburstActive: number;
}

export interface PhysicalMetrics {
  currentSeparation: number; // kpc
  relativeVelocity: number; // km/s
  pericenterDistance: number; // kpc (minimum distance recorded)
  massRatio: number; // q = M2 / M1
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  initialTotalEnergy: number;
  energyConservationDrift: number; // %
  angularMomentum: number;
  virialRatio: number;
  tidalRadius: number; // Roche limit in kpc
  starburstCount: number;
  dynFrictionMag: number; // km/s / Myr
  impactParameter: number; // kpc
  estimatedMergerTime: number; // Myr
  morphologyPrediction: string;
}

export interface CameraPreset {
  id: 'orbit' | 'top' | 'side' | 'com' | 'follow_g1' | 'follow_g2' | 'cinematic';
  label: string;
}
