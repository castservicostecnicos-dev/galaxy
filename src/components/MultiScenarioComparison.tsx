/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, SplitSquareVertical, Play, Pause, RotateCcw, Check, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { GALAXY_PRESETS } from '../physics/galaxyPresets';
import { SimulationPreset } from '../types/galaxy';
import { predictCollisionEvolution } from '../physics/astrophysicsML';

interface MultiScenarioComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreset: SimulationPreset;
  onSelectScenarioToSimulate: (preset: SimulationPreset) => void;
}

export const MultiScenarioComparison: React.FC<MultiScenarioComparisonProps> = ({
  isOpen,
  onClose,
  currentPreset,
  onSelectScenarioToSimulate,
}) => {
  const [selectedSlot1, setSelectedSlot1] = useState<SimulationPreset>(currentPreset);
  const [selectedSlot2, setSelectedSlot2] = useState<SimulationPreset>(
    GALAXY_PRESETS.find((p) => p.id !== currentPreset.id) || GALAXY_PRESETS[1]
  );
  const [selectedSlot3, setSelectedSlot3] = useState<SimulationPreset>(
    GALAXY_PRESETS.find((p) => p.id !== currentPreset.id && p.id !== selectedSlot2.id) || GALAXY_PRESETS[2]
  );

  if (!isOpen) return null;

  const scenarios = [
    { slot: 1, preset: selectedSlot1, setPreset: setSelectedSlot1, color: 'border-cyan-500/60' },
    { slot: 2, preset: selectedSlot2, setPreset: setSelectedSlot2, color: 'border-rose-500/60' },
    { slot: 3, preset: selectedSlot3, setPreset: setSelectedSlot3, color: 'border-amber-500/60' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/30">
              <SplitSquareVertical className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bancada de Múltiplos Cenários Comparativos</h2>
              <p className="text-xs text-slate-400">
                Compare lado a lado diferentes geometrias de colisão, dinâmicas de maré e destinos morfológicos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {scenarios.map(({ slot, preset, setPreset, color }) => {
              // Calculate analytical comparison metrics for each preset
              const g1 = preset.galaxy1;
              const g2 = preset.galaxy2;
              const q = g2.mass / g1.mass;
              const dx = g2.position[0] - g1.position[0];
              const dy = g2.position[1] - g1.position[1];
              const dz = g2.position[2] - g1.position[2];
              const sep = Math.sqrt(dx * dx + dy * dy + dz * dz);

              const dvx = g2.velocity[0] - g1.velocity[0];
              const dvy = g2.velocity[1] - g1.velocity[1];
              const dvz = g2.velocity[2] - g1.velocity[2];
              const relV = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

              const mockMetrics = {
                currentSeparation: sep,
                relativeVelocity: relV,
                pericenterDistance: sep * 0.25,
                massRatio: q,
                kineticEnergy: 100,
                potentialEnergy: -150,
                totalEnergy: -50,
                initialTotalEnergy: -50,
                energyConservationDrift: 0,
                angularMomentum: 300,
                virialRatio: 1.1,
                tidalRadius: sep * Math.cbrt(q / 3),
                starburstCount: 100,
                dynFrictionMag: 5,
                impactParameter: Math.abs(dx * dvy - dy * dvx) / Math.max(1, relV * 0.001),
                estimatedMergerTime: 1500,
                morphologyPrediction: '',
              };
              const ml = predictCollisionEvolution(g1, g2, mockMetrics);

              const isCurrentActive = preset.id === currentPreset.id;

              return (
                <div
                  key={slot}
                  className={`bg-slate-950 p-5 rounded-2xl border-2 flex flex-col justify-between shadow-xl transition relative ${
                    isCurrentActive ? color : 'border-slate-800'
                  }`}
                >
                  {isCurrentActive && (
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider">
                      Cenário em Execução no 3D
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Scenario Slot Header & Selector */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Cenário Comparativo {slot}
                      </span>
                      <select
                        value={preset.id}
                        onChange={(e) => {
                          const found = GALAXY_PRESETS.find((p) => p.id === e.target.value);
                          if (found) setPreset(found);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                      >
                        {GALAXY_PRESETS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 italic leading-relaxed">
                      "{preset.subtitle}"
                    </p>

                    {/* Progenitors Specs */}
                    <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-sans">Massa G1 / G2:</span>
                        <span className="text-cyan-400 font-semibold">{g1.mass} / {g2.mass} × 10¹⁰ M☉</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-sans">Razão de Massas (q):</span>
                        <span className="text-purple-400 font-semibold">{q.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-sans">Velocidade Relativa:</span>
                        <span className="text-amber-400 font-semibold">{relV.toFixed(0)} km/s</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-sans">Separação Inicial:</span>
                        <span className="text-slate-200 font-semibold">{sep.toFixed(1)} kpc</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-sans">Ressonância Orbital:</span>
                        <span className="text-emerald-400 font-semibold">
                          {g1.rotationSense === g2.rotationSense ? 'Prógrada Dupla' : 'Prógrada-Retrógrada'}
                        </span>
                      </div>
                    </div>

                    {/* Machine Learning Prediction Badge */}
                    <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/50 space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Previsão Teórica Remanescente:</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium">
                        {ml.finalMorphology}
                      </p>
                      <div className="flex justify-between text-[11px] font-mono text-purple-300 pt-1 border-t border-purple-900/40">
                        <span>Tempo Fusão: ~{ml.mergerTimescaleMyr} Myr</span>
                        <span>Sérsic: {ml.sersicIndex}</span>
                      </div>
                    </div>
                  </div>

                  {/* Switch to this scenario in 3D */}
                  <div className="pt-4 mt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        onSelectScenarioToSimulate(preset);
                        onClose();
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        isCurrentActive
                          ? 'bg-slate-800 text-cyan-400 border border-cyan-500/40 cursor-default'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      }`}
                    >
                      {isCurrentActive ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Atualmente Ativo no Visualizador 3D</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>Carregar e Simular no 3D</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between text-xs text-slate-400">
          <span>Permite comparar regimes de fusões maiores (Major Mergers) contra colisões perfurantes e canibalismo.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Fechar Bancada
          </button>
        </div>
      </div>
    </div>
  );
};
