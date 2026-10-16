/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Sliders, Check, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { GalaxyParams } from '../types/galaxy';

interface GalaxyParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  galaxy1: GalaxyParams;
  galaxy2: GalaxyParams;
  dt: number;
  softening: number;
  frictionEnabled: boolean;
  onApply: (
    newG1: GalaxyParams,
    newG2: GalaxyParams,
    newDt: number,
    newSoftening: number,
    newFriction: boolean
  ) => void;
  onResetDefaults: () => void;
}

export const GalaxyParametersModal: React.FC<GalaxyParametersModalProps> = ({
  isOpen,
  onClose,
  galaxy1,
  galaxy2,
  dt,
  softening,
  frictionEnabled,
  onApply,
  onResetDefaults,
}) => {
  const [activeGalaxy, setActiveGalaxy] = useState<1 | 2>(1);

  // Local state copies
  const [g1, setG1] = useState<GalaxyParams>({ ...galaxy1 });
  const [g2, setG2] = useState<GalaxyParams>({ ...galaxy2 });
  const [localDt, setLocalDt] = useState<number>(dt);
  const [localSoftening, setLocalSoftening] = useState<number>(softening);
  const [localFriction, setLocalFriction] = useState<boolean>(frictionEnabled);

  if (!isOpen) return null;

  const currentG = activeGalaxy === 1 ? g1 : g2;
  const setCurG = (updater: (prev: GalaxyParams) => GalaxyParams) => {
    if (activeGalaxy === 1) {
      setG1(updater);
    } else {
      setG2(updater);
    }
  };

  // Live calculations
  const dx = g2.position[0] - g1.position[0];
  const dy = g2.position[1] - g1.position[1];
  const dz = g2.position[2] - g1.position[2];
  const initialSep = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const dvx = g2.velocity[0] - g1.velocity[0];
  const dvy = g2.velocity[1] - g1.velocity[1];
  const dvz = g2.velocity[2] - g1.velocity[2];
  const relV = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

  const massRatio = (g2.mass / Math.max(0.1, g1.mass)).toFixed(2);

  const handleSave = () => {
    onApply(g1, g2, localDt, localSoftening, localFriction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Ajuste de Parâmetros Físicos e Orbitais</h2>
              <p className="text-xs text-slate-400">Configure massas, velocidades iniciais, perfis de matéria escura e integração N-corpos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Dynamics Summary Bar */}
        <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400 font-sans">Separação Inicial:</span>
            <span className="text-cyan-400 font-semibold">{initialSep.toFixed(1)} kpc</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400 font-sans">Velocidade Relativa Inicial:</span>
            <span className="text-amber-400 font-semibold">{relV.toFixed(1)} km/s</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400 font-sans">Razão de Massas (q = M₂/M₁):</span>
            <span className="text-purple-400 font-semibold">{massRatio}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-400 font-sans">Regime:</span>
            <span className="text-emerald-400 font-semibold">
              {Number(massRatio) > 0.33 && Number(massRatio) < 3.0 ? 'Fusão Maior (Major Merger)' : 'Fusão Menor (Canibalismo)'}
            </span>
          </div>
        </div>

        {/* Body content with tabs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Galaxy Selection Switch */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveGalaxy(1)}
              className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeGalaxy === 1
                  ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Galáxia 1: {g1.name}</span>
            </button>
            <button
              onClick={() => setActiveGalaxy(2)}
              className={`flex-1 py-2 px-4 rounded-xl border text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeGalaxy === 2
                  ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-sm'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Galáxia 2: {g2.name}</span>
            </button>
          </div>

          {/* Section: Mass & Internal Structure */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <span>Massa e Estrutura Estelar Interna</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Visible Mass */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Massa Visível Estelar</span>
                  <span className="font-mono text-cyan-400">{currentG.mass} × 10¹⁰ M☉</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={currentG.mass}
                  onChange={(e) => setCurG((p) => ({ ...p, mass: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">Via Láctea ~ 90 × 10¹⁰ M☉</span>
              </div>

              {/* Disk Radius */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Raio do Disco Visível</span>
                  <span className="font-mono text-cyan-400">{currentG.radius} kpc</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="40"
                  step="1"
                  value={currentG.radius}
                  onChange={(e) => setCurG((p) => ({ ...p, radius: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">1 kpc ≈ 3.260 anos-luz</span>
              </div>

              {/* SMBH Mass */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Buraco Negro Central (SMBH)</span>
                  <span className="font-mono text-cyan-400">{currentG.blackHoleMass} × 10⁶ M☉</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="5"
                  value={currentG.blackHoleMass}
                  onChange={(e) => setCurG((p) => ({ ...p, blackHoleMass: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">Sgr A* = 4.3 × 10⁶ M☉</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Dark Matter Halo Ratio */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Razão de Matéria Escura (Halo)</span>
                  <span className="font-mono text-cyan-400">{currentG.haloMassRatio}x Massa</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={currentG.haloMassRatio}
                  onChange={(e) => setCurG((p) => ({ ...p, haloMassRatio: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">Mantém curva de rotação plana</span>
              </div>

              {/* Bulge Fraction */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Fração do Bojo Central</span>
                  <span className="font-mono text-cyan-400">{(currentG.bulgeFraction * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={currentG.bulgeFraction}
                  onChange={(e) => setCurG((p) => ({ ...p, bulgeFraction: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">Espiral Sc ~ 15%, Elíptica ~ 70%</span>
              </div>

              {/* Rotation Sense */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">Sentido de Rotação (Spin)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurG((p) => ({ ...p, rotationSense: 1 }))}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                      currentG.rotationSense === 1
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Prógrado (+1)
                  </button>
                  <button
                    onClick={() => setCurG((p) => ({ ...p, rotationSense: -1 }))}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                      currentG.rotationSense === -1
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    Retrógrado (-1)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Initial Orbit (Position & Velocity) */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>Posição Inicial e Vetor Velocidade (Cinemática)</span>
            </h3>

            {/* Position X, Y, Z */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">Posição Inicial (kpc):</span>
              <div className="grid grid-cols-3 gap-3">
                {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                  <div key={axis} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <label className="text-[11px] text-slate-400 flex justify-between">
                      <span>Eixo {axis}</span>
                      <span className="font-mono text-cyan-400">{currentG.position[i]} kpc</span>
                    </label>
                    <input
                      type="range"
                      min="-80"
                      max="80"
                      step="1"
                      value={currentG.position[i]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurG((p) => {
                          const pos = [...p.position] as [number, number, number];
                          pos[i] = val;
                          return { ...p, position: pos };
                        });
                      }}
                      className="w-full mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Velocity Vx, Vy, Vz */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">Velocidade Inicial (km/s):</span>
              <div className="grid grid-cols-3 gap-3">
                {(['Vx', 'Vy', 'Vz'] as const).map((axis, i) => (
                  <div key={axis} className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <label className="text-[11px] text-slate-400 flex justify-between">
                      <span>{axis}</span>
                      <span className="font-mono text-amber-400">{currentG.velocity[i]} km/s</span>
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="2"
                      value={currentG.velocity[i]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCurG((p) => {
                          const v = [...p.velocity] as [number, number, number];
                          v[i] = val;
                          return { ...p, velocity: v };
                        });
                      }}
                      className="w-full mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Orientation: Inclination & Pericenter argument */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Inclinação do Disco (Tilt i)</span>
                  <span className="font-mono text-cyan-400">{currentG.inclination}°</span>
                </label>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  step="5"
                  value={currentG.inclination}
                  onChange={(e) => setCurG((p) => ({ ...p, inclination: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Argumento do Pericentro (ω)</span>
                  <span className="font-mono text-cyan-400">{currentG.argumentOfPericenter}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="10"
                  value={currentG.argumentOfPericenter}
                  onChange={(e) => setCurG((p) => ({ ...p, argumentOfPericenter: Number(e.target.value) }))}
                  className="w-full mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Section: Global Physics Simulation Settings */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span>Parâmetros de Integração Numérica e Física Global</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Passo de Tempo (Δt)</span>
                  <span className="font-mono text-purple-400">{localDt.toFixed(2)} Myr</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={localDt}
                  onChange={(e) => setLocalDt(Number(e.target.value))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">Passos menores aumentam precisão</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium flex justify-between">
                  <span>Comprimento de Softening (ε)</span>
                  <span className="font-mono text-purple-400">{localSoftening.toFixed(2)} kpc</span>
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="2.5"
                  step="0.1"
                  value={localSoftening}
                  onChange={(e) => setLocalSoftening(Number(e.target.value))}
                  className="w-full mt-1.5"
                />
                <span className="text-[10px] text-slate-400">Evita divergências na singularidade r=0</span>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">Fricção Dinâmica (Chandrasekhar)</label>
                <button
                  onClick={() => setLocalFriction(!localFriction)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium border transition flex items-center justify-center gap-2 ${
                    localFriction
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <Check className={`w-4 h-4 ${localFriction ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{localFriction ? 'Ativada (Arrasto Gravitacional)' : 'Desativada (Órbitas Livres)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <button
            onClick={onResetDefaults}
            className="px-3.5 py-2 text-xs font-medium rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Valores Originais</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Parâmetros & Recalcular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
