/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GalaxyParams, PhysicalMetrics, TrajectoryPoint } from '../types/galaxy';
import { 
  G_ASTRONOMICAL, 
  DEFAULT_SOFTENING, 
  kpcMyrToKms, 
  kmsToKpcMyr, 
  COULOMB_LOGARITHM 
} from './constants';
import { GeneratedStarsData } from './galaxyGenerator';

export class GalaxySimulationEngine {
  galaxy1: GalaxyParams;
  galaxy2: GalaxyParams;
  starsData: GeneratedStarsData;

  // Galaxy Centers state
  pos1: [number, number, number];
  pos2: [number, number, number];
  vel1: [number, number, number]; // kpc/Myr
  vel2: [number, number, number]; // kpc/Myr

  // Simulation time
  currentTimeMyr: number = 0;
  dt: number = 1.0; // Myr per step
  softening: number = DEFAULT_SOFTENING; // kpc
  frictionEnabled: boolean = true;
  starburstThreshold: number = 0.08;

  // History tracking for analysis & export
  trajectoryHistory: TrajectoryPoint[] = [];
  initialTotalEnergy: number = 0;
  minSeparationKpc: number = Infinity;
  starburstActiveCount: number = 0;

  constructor(
    galaxy1: GalaxyParams,
    galaxy2: GalaxyParams,
    starsData: GeneratedStarsData,
    initialDt: number = 1.0
  ) {
    this.galaxy1 = galaxy1;
    this.galaxy2 = galaxy2;
    this.starsData = starsData;
    this.dt = initialDt;

    this.pos1 = [...galaxy1.position];
    this.pos2 = [...galaxy2.position];
    this.vel1 = [
      kmsToKpcMyr(galaxy1.velocity[0]),
      kmsToKpcMyr(galaxy1.velocity[1]),
      kmsToKpcMyr(galaxy1.velocity[2]),
    ];
    this.vel2 = [
      kmsToKpcMyr(galaxy2.velocity[0]),
      kmsToKpcMyr(galaxy2.velocity[1]),
      kmsToKpcMyr(galaxy2.velocity[2]),
    ];

    // Compute initial state and baseline total energy
    const initialMetrics = this.computePhysicalMetrics();
    this.initialTotalEnergy = initialMetrics.totalEnergy !== 0 ? initialMetrics.totalEnergy : -1;
    this.minSeparationKpc = initialMetrics.currentSeparation;
    this.recordTrajectorySnapshot(initialMetrics);
  }

  /**
   * Calculates mutual gravitational acceleration and Chandrasekhar dynamical friction
   * between the two galactic cores & halos
   */
  private computeCoreAccelerations(
    p1: [number, number, number],
    p2: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number]
  ): { a1: [number, number, number]; a2: [number, number, number]; dynFricMag: number } {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dz = p2[2] - p1[2];
    const r2 = dx * dx + dy * dy + dz * dz;
    const r = Math.sqrt(r2);

    const mTotal1 = this.galaxy1.mass * (1 + this.galaxy1.haloMassRatio * 0.4);
    const mTotal2 = this.galaxy2.mass * (1 + this.galaxy2.haloMassRatio * 0.4);

    // Softened gravitational acceleration
    const eps2 = this.softening * this.softening;
    const denom = Math.pow(r2 + eps2, 1.5);

    // Force magnitude factor: a1 = G * M2 * dr / denom
    const factor1 = (G_ASTRONOMICAL * mTotal2) / denom;
    const factor2 = (G_ASTRONOMICAL * mTotal1) / denom;

    const aGrav1: [number, number, number] = [dx * factor1, dy * factor1, dz * factor1];
    const aGrav2: [number, number, number] = [-dx * factor2, -dy * factor2, -dz * factor2];

    let dynFricMag = 0;

    // Chandrasekhar dynamical friction between overlapping dark matter halos
    if (this.frictionEnabled && r > 0.1) {
      const relVx = v1[0] - v2[0];
      const relVy = v1[1] - v2[1];
      const relVz = v1[2] - v2[2];
      const vRel2 = relVx * relVx + relVy * relVy + relVz * relVz;
      const vRel = Math.sqrt(Math.max(1e-6, vRel2));

      // Local halo density at separation r (Hernquist model)
      const aHaloAvg = (this.galaxy1.haloScaleRadius + this.galaxy2.haloScaleRadius) * 0.5;
      const rhoHalo = (mTotal2 / (2 * Math.PI)) * (aHaloAvg / Math.max(0.5, r)) * Math.pow(r + aHaloAvg, -3);

      // Chandrasekhar deceleration factor
      // a_df ~ - 4 * pi * G^2 * M * rho * ln(Lambda) / v^2
      const frictionConstant = 4 * Math.PI * G_ASTRONOMICAL * G_ASTRONOMICAL * mTotal2 * rhoHalo * COULOMB_LOGARITHM;
      const fDecel = frictionConstant / Math.max(1e-4, vRel2);

      // Cap dynamical friction to ensure numerical stability
      const boundedFDecel = Math.min(fDecel, 0.05);
      dynFricMag = kpcMyrToKms(boundedFDecel * vRel);

      // Deceleration opposes relative velocity
      const dfx = (relVx / vRel) * boundedFDecel;
      const dfy = (relVy / vRel) * boundedFDecel;
      const dfz = (relVz / vRel) * boundedFDecel;

      aGrav1[0] -= dfx;
      aGrav1[1] -= dfy;
      aGrav1[2] -= dfz;

      // Equal and opposite drag for galaxy 2 scaled by mass ratio
      const massRatio = mTotal1 / mTotal2;
      aGrav2[0] += dfx * massRatio;
      aGrav2[1] += dfy * massRatio;
      aGrav2[2] += dfz * massRatio;
    }

    return { a1: aGrav1, a2: aGrav2, dynFricMag };
  }

  /**
   * Calculates gravitational acceleration on a star particle
   * caused by both galaxy cores and their halos
   */
  private getStarAcceleration(
    sx: number,
    sy: number,
    sz: number
  ): [number, number, number] {
    const eps2 = this.softening * this.softening;

    // Pull from Galaxy 1
    const dx1 = this.pos1[0] - sx;
    const dy1 = this.pos1[1] - sy;
    const dz1 = this.pos1[2] - sz;
    const r1Sq = dx1 * dx1 + dy1 * dy1 + dz1 * dz1;
    const r1 = Math.sqrt(r1Sq);

    // Enclosed mass at radius r1
    const mTotal1 = this.galaxy1.mass;
    const mHalo1 = this.galaxy1.mass * this.galaxy1.haloMassRatio;
    const aH1 = this.galaxy1.haloScaleRadius;
    const mEncl1 = mTotal1 + mHalo1 * (r1Sq / Math.pow(r1 + aH1, 2));

    const denom1 = Math.pow(r1Sq + eps2, 1.5);
    const f1 = (G_ASTRONOMICAL * mEncl1) / denom1;

    // Pull from Galaxy 2
    const dx2 = this.pos2[0] - sx;
    const dy2 = this.pos2[1] - sy;
    const dz2 = this.pos2[2] - sz;
    const r2Sq = dx2 * dx2 + dy2 * dy2 + dz2 * dz2;
    const r2 = Math.sqrt(r2Sq);

    const mTotal2 = this.galaxy2.mass;
    const mHalo2 = this.galaxy2.mass * this.galaxy2.haloMassRatio;
    const aH2 = this.galaxy2.haloScaleRadius;
    const mEncl2 = mTotal2 + mHalo2 * (r2Sq / Math.pow(r2 + aH2, 2));

    const denom2 = Math.pow(r2Sq + eps2, 1.5);
    const f2 = (G_ASTRONOMICAL * mEncl2) / denom2;

    return [
      dx1 * f1 + dx2 * f2,
      dy1 * f1 + dy2 * f2,
      dz1 * f1 + dz2 * f2,
    ];
  }

  /**
   * Symplectic Leapfrog (Kick-Drift-Kick / Velocity-Verlet) Integrator
   * Advances simulation by time step dt
   */
  public step(customDt?: number): PhysicalMetrics {
    const dt = customDt !== undefined ? customDt : this.dt;
    const halfDt = dt * 0.5;

    // 1. Compute initial core accelerations
    const { a1: a1_0, a2: a2_0, dynFricMag } = this.computeCoreAccelerations(
      this.pos1,
      this.pos2,
      this.vel1,
      this.vel2
    );

    // 2. Half-kick galaxy velocities: v(t + dt/2) = v(t) + a(t) * dt/2
    this.vel1[0] += a1_0[0] * halfDt;
    this.vel1[1] += a1_0[1] * halfDt;
    this.vel1[2] += a1_0[2] * halfDt;

    this.vel2[0] += a2_0[0] * halfDt;
    this.vel2[1] += a2_0[1] * halfDt;
    this.vel2[2] += a2_0[2] * halfDt;

    // 3. Drift galaxy positions: r(t + dt) = r(t) + v(t + dt/2) * dt
    this.pos1[0] += this.vel1[0] * dt;
    this.pos1[1] += this.vel1[1] * dt;
    this.pos1[2] += this.vel1[2] * dt;

    this.pos2[0] += this.vel2[0] * dt;
    this.pos2[1] += this.vel2[1] * dt;
    this.pos2[2] += this.vel2[2] * dt;

    // 4. Compute new core accelerations at r(t + dt)
    const { a1: a1_1, a2: a2_1 } = this.computeCoreAccelerations(
      this.pos1,
      this.pos2,
      this.vel1,
      this.vel2
    );

    // 5. Complete kick: v(t + dt) = v(t + dt/2) + a(t + dt) * dt/2
    this.vel1[0] += a1_1[0] * halfDt;
    this.vel1[1] += a1_1[1] * halfDt;
    this.vel1[2] += a1_1[2] * halfDt;

    this.vel2[0] += a2_1[0] * halfDt;
    this.vel2[1] += a2_1[1] * halfDt;
    this.vel2[2] += a2_1[2] * halfDt;

    // 6. Integrate all star particles using Leapfrog
    const { positions, velocities, colors, totalStars, starburstAges } = this.starsData;
    let starburstCount = 0;

    for (let i = 0; i < totalStars; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];

      // Star acceleration
      const [ax, ay, az] = this.getStarAcceleration(px, py, pz);

      // Velocity kick
      velocities[idx] += ax * dt;
      velocities[idx + 1] += ay * dt;
      velocities[idx + 2] += az * dt;

      // Position drift
      positions[idx] += velocities[idx] * dt;
      positions[idx + 1] += velocities[idx + 1] * dt;
      positions[idx + 2] += velocities[idx + 2] * dt;

      // Tidal acceleration magnitude for starburst excitation
      const aMag = Math.sqrt(ax * ax + ay * ay + az * az);
      if (aMag > this.starburstThreshold) {
        starburstCount++;
        starburstAges[i] = Math.min(1.0, starburstAges[i] + 0.1);
        // Brighten color towards radiant cyan/magenta starburst
        colors[idx] = Math.min(1.0, colors[idx] * 0.95 + 0.2);
        colors[idx + 1] = Math.min(1.0, colors[idx + 1] * 0.95 + 0.15);
        colors[idx + 2] = Math.min(1.0, colors[idx + 2] * 0.95 + 0.35);
      } else if (starburstAges[i] > 0) {
        starburstAges[i] = Math.max(0, starburstAges[i] - 0.01);
      }
    }

    this.starburstActiveCount = starburstCount;
    this.currentTimeMyr += dt;

    // Compute physical metrics
    const metrics = this.computePhysicalMetrics(dynFricMag);

    if (metrics.currentSeparation < this.minSeparationKpc) {
      this.minSeparationKpc = metrics.currentSeparation;
    }

    // Record trajectory snapshot every 5-10 Myr or at milestones
    const lastPoint = this.trajectoryHistory[this.trajectoryHistory.length - 1];
    if (!lastPoint || (this.currentTimeMyr - lastPoint.timeMyr) >= Math.max(2.0, dt * 2)) {
      this.recordTrajectorySnapshot(metrics);
    }

    return metrics;
  }

  /**
   * Computes authentic astrophysical metrics, conservation laws and diagnostics
   */
  public computePhysicalMetrics(dynFricMag: number = 0): PhysicalMetrics {
    const dx = this.pos2[0] - this.pos1[0];
    const dy = this.pos2[1] - this.pos1[1];
    const dz = this.pos2[2] - this.pos1[2];
    const sepKpc = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const rvx = this.vel2[0] - this.vel1[0];
    const rvy = this.vel2[1] - this.vel1[1];
    const rvz = this.vel2[2] - this.vel1[2];
    const relVKpcMyr = Math.sqrt(rvx * rvx + rvy * rvy + rvz * rvz);
    const relVKmS = kpcMyrToKms(relVKpcMyr);

    const m1 = this.galaxy1.mass;
    const m2 = this.galaxy2.mass;
    const reducedMass = (m1 * m2) / (m1 + m2);

    // Kinetic Energy K = 1/2 mu * v_rel^2
    const kineticEnergy = 0.5 * reducedMass * relVKpcMyr * relVKpcMyr;

    // Gravitational Potential Energy U = - G * M1 * M2 / sqrt(r^2 + eps^2)
    const potentialEnergy = - (G_ASTRONOMICAL * m1 * m2) / Math.sqrt(sepKpc * sepKpc + this.softening * this.softening);

    // Total Hamiltonian Energy E = K + U
    const totalEnergy = kineticEnergy + potentialEnergy;

    // Energy conservation percentage drift
    let energyDrift = 0;
    if (this.initialTotalEnergy !== 0) {
      energyDrift = ((totalEnergy - this.initialTotalEnergy) / Math.abs(this.initialTotalEnergy)) * 100;
    }

    // Specific Angular Momentum L = r x v
    const lx = dy * rvz - dz * rvy;
    const ly = dz * rvx - dx * rvz;
    const lz = dx * rvy - dy * rvx;
    const angularMomentum = Math.sqrt(lx * lx + ly * ly + lz * lz) * reducedMass;

    // Virial ratio 2K / |U|
    const virialRatio = Math.abs(potentialEnergy) > 1e-6 ? (2 * kineticEnergy) / Math.abs(potentialEnergy) : 1;

    // Roche Tidal Radius of Galaxy 2 in Galaxy 1's field
    // r_tidal ~ sep * (M2 / (3 * M1))^(1/3)
    const tidalRadius = Math.max(0.1, sepKpc * Math.cbrt(m2 / (3 * m1)));

    // Mass ratio
    const massRatio = m2 / m1;

    // Rough impact parameter (perpendicular distance at initial state)
    const impactParameter = Math.abs(dx * rvy - dy * rvx) / Math.max(1e-4, relVKpcMyr);

    // Estimate merger timescale (analytical Chandrasekhar dynamical friction decay)
    // t_merge ~ r_p^2 * v_c / (G * M2 * ln(Lambda))
    const estimatedMergerTime = Math.round(
      Math.max(200, (sepKpc * sepKpc * 0.15) / Math.max(0.01, (G_ASTRONOMICAL * m2 * 0.5)))
    );

    // Theoretical morphology prediction
    let morphology = 'Galáxias Separadas em Órbita';
    if (sepKpc < (this.galaxy1.radius + this.galaxy2.radius) * 0.35) {
      morphology = 'Núcleos em Coalescência Final (Galáxia Elíptica Relaxada)';
    } else if (sepKpc < (this.galaxy1.radius + this.galaxy2.radius)) {
      morphology = 'Interação Ativa: Formação de Caudas de Maré e Starbursts';
    } else if (this.minSeparationKpc < (this.galaxy1.radius + this.galaxy2.radius)) {
      morphology = 'Pós-Pericentro: Ejeção de Correntes Estelares e Pontes de Matéria';
    }

    return {
      currentSeparation: sepKpc,
      relativeVelocity: relVKmS,
      pericenterDistance: this.minSeparationKpc,
      massRatio,
      kineticEnergy,
      potentialEnergy,
      totalEnergy,
      initialTotalEnergy: this.initialTotalEnergy,
      energyConservationDrift: energyDrift,
      angularMomentum,
      virialRatio,
      tidalRadius,
      starburstCount: this.starburstActiveCount,
      dynFrictionMag: dynFricMag,
      impactParameter,
      estimatedMergerTime,
      morphologyPrediction: morphology,
    };
  }

  private recordTrajectorySnapshot(metrics: PhysicalMetrics) {
    this.trajectoryHistory.push({
      timeMyr: Math.round(this.currentTimeMyr * 10) / 10,
      pos1: [
        Math.round(this.pos1[0] * 100) / 100,
        Math.round(this.pos1[1] * 100) / 100,
        Math.round(this.pos1[2] * 100) / 100,
      ],
      pos2: [
        Math.round(this.pos2[0] * 100) / 100,
        Math.round(this.pos2[1] * 100) / 100,
        Math.round(this.pos2[2] * 100) / 100,
      ],
      vel1: [
        Math.round(kpcMyrToKms(this.vel1[0]) * 10) / 10,
        Math.round(kpcMyrToKms(this.vel1[1]) * 10) / 10,
        Math.round(kpcMyrToKms(this.vel1[2]) * 10) / 10,
      ],
      vel2: [
        Math.round(kpcMyrToKms(this.vel2[0]) * 10) / 10,
        Math.round(kpcMyrToKms(this.vel2[1]) * 10) / 10,
        Math.round(kpcMyrToKms(this.vel2[2]) * 10) / 10,
      ],
      separationKpc: Math.round(metrics.currentSeparation * 100) / 100,
      relVelocityKms: Math.round(metrics.relativeVelocity * 10) / 10,
      kineticEnergy: Math.round(metrics.kineticEnergy * 100) / 100,
      potentialEnergy: Math.round(metrics.potentialEnergy * 100) / 100,
      totalEnergy: Math.round(metrics.totalEnergy * 100) / 100,
      energyDriftPercent: Math.round(metrics.energyConservationDrift * 100) / 100,
      angularMomentum: Math.round(metrics.angularMomentum * 10) / 10,
      virialRatio: Math.round(metrics.virialRatio * 100) / 100,
      starburstActive: metrics.starburstCount,
    });
  }

  /**
   * Resets simulation back to initial preset conditions
   */
  public reset(
    newGalaxy1?: GalaxyParams,
    newGalaxy2?: GalaxyParams,
    newStarsData?: GeneratedStarsData
  ) {
    if (newGalaxy1) this.galaxy1 = newGalaxy1;
    if (newGalaxy2) this.galaxy2 = newGalaxy2;
    if (newStarsData) this.starsData = newStarsData;

    this.currentTimeMyr = 0;
    this.pos1 = [...this.galaxy1.position];
    this.pos2 = [...this.galaxy2.position];
    this.vel1 = [
      kmsToKpcMyr(this.galaxy1.velocity[0]),
      kmsToKpcMyr(this.galaxy1.velocity[1]),
      kmsToKpcMyr(this.galaxy1.velocity[2]),
    ];
    this.vel2 = [
      kmsToKpcMyr(this.galaxy2.velocity[0]),
      kmsToKpcMyr(this.galaxy2.velocity[1]),
      kmsToKpcMyr(this.galaxy2.velocity[2]),
    ];

    this.trajectoryHistory = [];
    this.minSeparationKpc = Infinity;
    this.starburstActiveCount = 0;

    const initialMetrics = this.computePhysicalMetrics();
    this.initialTotalEnergy = initialMetrics.totalEnergy !== 0 ? initialMetrics.totalEnergy : -1;
    this.minSeparationKpc = initialMetrics.currentSeparation;
    this.recordTrajectorySnapshot(initialMetrics);
  }
}
