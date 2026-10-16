/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Astronomical and Computational Physics Constants

/**
 * Gravitational Constant G in simulation units:
 * Length: 1 kpc = 3.085677581e19 m
 * Mass: 10^10 M_sun = 1.98847e40 kg
 * Time: 1 Myr = 3.15576e13 s
 * Velocity: 1 kpc / 1 Myr ≈ 977.79222168 km/s
 *
 * In these units, G = 4.4983e-3 kpc^3 / (10^10 M_sun * Myr^2)
 */
export const G_ASTRONOMICAL = 4.4983e-3;

// Velocity conversion factor: 1 kpc/Myr = 977.792 km/s
export const KPC_PER_MYR_TO_KM_PER_S = 977.79222;
export const KM_PER_S_TO_KPC_PER_MYR = 1 / KPC_PER_MYR_TO_KM_PER_S;

// Default gravitational softening length epsilon (kpc) to prevent non-physical singularities
export const DEFAULT_SOFTENING = 0.8; // kpc

// Speed of light in km/s (for relativistic checks)
export const SPEED_OF_LIGHT_KM_S = 299792.458;

// Coulomb logarithm ln(Lambda) for Chandrasekhar dynamical friction in galactic halos
export const COULOMB_LOGARITHM = 3.0;

// Conversion helpers
export function kmsToKpcMyr(vKmS: number): number {
  return vKmS * KM_PER_S_TO_KPC_PER_MYR;
}

export function kpcMyrToKms(vKpcMyr: number): number {
  return vKpcMyr * KPC_PER_MYR_TO_KM_PER_S;
}
