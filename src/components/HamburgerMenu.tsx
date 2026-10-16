/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Sliders, 
  BarChart2, 
  FileText, 
  SplitSquareVertical, 
  Sparkles, 
  Camera, 
  Eye, 
  Layers, 
  Gauge, 
  Film, 
  Orbit, 
  ChevronRight, 
  Activity,
  Check
} from 'lucide-react';
import { GALAXY_PRESETS } from '../physics/galaxyPresets';
import { CameraPreset, PhysicalMetrics, SimulationPreset } from '../types/galaxy';

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  onClose: () => void;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  currentPresetId: string;
  onSelectPreset: (preset: SimulationPreset) => void;
  currentTimeMyr: number;
  simulationSpeed: number;
  onSpeedChange: (speed: number) => void;
  cameraPreset: CameraPreset['id'];
  onCameraPresetChange: (preset: CameraPreset['id']) => void;
  showTrails: boolean;
  onToggleTrails: () => void;
  showRocheSpheres: boolean;
  onToggleRoche: () => void;
  showPotentialGrid: boolean;
  onToggleGrid: () => void;
  resolutionScale: number;
  onResolutionScaleChange: (scale: number) => void;
  metrics: PhysicalMetrics | null;
  isCinematicMode?: boolean;
  onToggleCinematicMode?: () => void;
  onOpenParameters: () => void;
  onOpenDiagnostics: () => void;
  onOpenReport: () => void;
  onOpenMultiScenario: () => void;
  onOpenAI: () => void;
  onOpenTheory: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  isOpen,
  onToggleOpen,
  onClose,
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  currentPresetId,
  onSelectPreset,
  currentTimeMyr,
  simulationSpeed,
  onSpeedChange,
  cameraPreset,
  onCameraPresetChange,
  showTrails,
  onToggleTrails,
  showRocheSpheres,
  onToggleRoche,
  showPotentialGrid,
  onToggleGrid,
  resolutionScale,
  onResolutionScaleChange,
  metrics,
  isCinematicMode,
  onToggleCinematicMode,
  onOpenParameters,
  onOpenDiagnostics,
  onOpenReport,
  onOpenMultiScenario,
  onOpenAI,
  onOpenTheory,
}) => {
  const speeds = [0.5, 1.0, 2.0, 5.0, 10.0];

  const cameraOptions: Array<{ id: CameraPreset['id']; label: string }> = [
    { id: 'orbit', label: 'Orbital Livre' },
    { id: 'top', label: 'Plano XY (Topo)' },
    { id: 'side', label: 'Plano XZ (Perfil)' },
    { id: 'com', label: 'Centro de Massa' },
    { id: 'follow_g1', label: 'Seguir Galáxia 1' },
    { id: 'follow_g2', label: 'Seguir Galáxia 2' },
    { id: 'cinematic', label: 'Cinemático 360°' },
  ];

  const currentPreset = GALAXY_PRESETS.find((p) => p.id === currentPresetId) || GALAXY_PRESETS[0];

  return (
    <>
      {/* Top-Left Header Bar with Hamburger Button & Quick Status */}
      <div
        className={`fixed top-4 left-4 z-40 pointer-events-auto flex items-center gap-2.5 transition-all duration-500 ${
          isCinematicMode ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
        }`}
      >
        {/* Hamburger Trigger Button */}
        <button
          onClick={onToggleOpen}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-800 shadow-2xl backdrop-blur-md text-white transition group focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          title="Abrir Menu de Controles e Modelos"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200" />
          ) : (
            <Menu className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
          )}
          <span className="text-sm font-bold tracking-wide hidden sm:inline">Galaxy</span>
        </button>

        {/* Quick Playback Bar right next to the hamburger button */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-lg font-bold flex items-center justify-center transition ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
            }`}
            title={isRunning ? 'Pausar Simulação (Espaço)' : 'Iniciar Simulação (Espaço)'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            onClick={onStep}
            disabled={isRunning}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
            title="Avançar 1 passo (dt)"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reiniciar (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Time Chip */}
          <div className="px-2.5 py-0.5 border-l border-slate-800 flex items-baseline gap-1 font-mono text-xs text-cyan-400">
            <span className="font-bold">{currentTimeMyr.toFixed(1)}</span>
            <span className="text-[10px] text-slate-400 font-sans">Myr</span>
          </div>
        </div>

        {/* Current Active Preset Chip */}
        <button
          onClick={onToggleOpen}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-800 shadow-xl backdrop-blur-md text-xs text-slate-300 transition"
          title="Clique para trocar de modelo"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="font-semibold text-white">{currentPreset.title.split('(')[0].trim()}</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      {/* Backdrop when menu is open */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Slide-out Sidebar Drawer from the Top-Left */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[420px] max-w-[95vw] bg-slate-900/98 border-r border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col transition-transform duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/15 rounded-xl border border-cyan-500/30 text-cyan-400">
              <Orbit className="w-5 h-5 animate-[spin_18s_linear_infinite]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Galaxy</h2>
              <p className="text-[11px] text-slate-400">Simulador de Interação & Dinâmica de Galáxias</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Fechar Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
          {/* Section 1: Simulation Dynamics & Playback */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Dinâmica & Controle de Tempo
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300">
                {currentTimeMyr.toFixed(1)} Myr
              </span>
            </div>

            {/* Play, Step, Reset & Speed */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onTogglePlay}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                >
                  {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>

                <button
                  onClick={onStep}
                  disabled={isRunning}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 border border-slate-700/60 transition"
                  title="Avançar 1 passo de tempo"
                >
                  <StepForward className="w-4 h-4" />
                </button>

                <button
                  onClick={onReset}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                  title="Reiniciar para t=0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1">
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`px-1.5 py-1 text-[11px] font-mono rounded-md transition ${
                      simulationSpeed === s
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Live Telemetry Card */}
            {metrics && (
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Separação R</span>
                  <span className="text-cyan-400 font-semibold">{metrics.currentSeparation.toFixed(1)} kpc</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Velocidade Relativa</span>
                  <span className="text-amber-400 font-semibold">{metrics.relativeVelocity.toFixed(0)} km/s</span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Deriva Hamiltoniana</span>
                  <span className={`font-semibold ${Math.abs(metrics.energyConservationDrift) < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {metrics.energyConservationDrift.toFixed(2)}%
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Starbursts Ativos</span>
                  <span className="text-rose-400 font-semibold">{metrics.starburstCount} estrelas</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Preset Galaxy Library */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Modelos Pré-definidos
              </span>
              <span className="text-[10px] text-slate-400 font-mono">({GALAXY_PRESETS.length} cenários)</span>
            </div>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
              {GALAXY_PRESETS.map((preset) => {
                const isActive = preset.id === currentPresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate">{preset.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{preset.subtitle}</p>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Analysis, Parameters & Tools Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ferramentas & Análises
            </span>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  onOpenParameters();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-200 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold block">Ajuste de Parâmetros Físicos</span>
                    <span className="text-[10px] text-slate-400">Massas, velocidades, raios e ângulos</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onOpenDiagnostics();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-200 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold block">Diagnósticos Estatísticos & CSV</span>
                    <span className="text-[10px] text-slate-400">Gráficos de fase e scripts Python/R/MATLAB</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onOpenReport();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-200 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold block">Relatório Científico em PDF</span>
                    <span className="text-[10px] text-slate-400">Geração formal para publicação</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onOpenMultiScenario();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left text-xs text-slate-200 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <SplitSquareVertical className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold block">Bancada de Multicenários</span>
                    <span className="text-[10px] text-slate-400">Comparação paralela lado a lado</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => {
                  onOpenAI();
                  onClose();
                }}
                className="w-full p-2.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-800/50 text-left text-xs text-slate-200 transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-white block">IA Astrofísica Teórica</span>
                    <span className="text-[10px] text-cyan-300/80">Diagnóstico com Gemini 3.8 Flash e PINN</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Section 4: Camera & Visual Presets */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-cyan-400" /> Perspectivas de Câmera
            </span>

            <div className="grid grid-cols-2 gap-1.5">
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onCameraPresetChange(opt.id)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg transition font-medium text-left ${
                    cameraPreset === opt.id
                      ? 'bg-cyan-500 text-slate-950 font-semibold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Visual Layers Toggles */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" /> Camadas Gráficas
              </span>

              <div className="space-y-1.5">
                <button
                  onClick={onToggleTrails}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition flex items-center justify-between ${
                    showTrails
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Trajetórias Orbitais</span>
                  <span>{showTrails ? '✓' : '○'}</span>
                </button>

                <button
                  onClick={onToggleRoche}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition flex items-center justify-between ${
                    showRocheSpheres
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Esferas de Maré de Roche</span>
                  <span>{showRocheSpheres ? '✓' : '○'}</span>
                </button>

                <button
                  onClick={onToggleGrid}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition flex items-center justify-between ${
                    showPotentialGrid
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span>Grade Espaço-Tempo Deformada</span>
                  <span>{showPotentialGrid ? '✓' : '○'}</span>
                </button>
              </div>

              {/* Graphic Resolution Scale */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Resolução:</span>
                <div className="flex items-center gap-1 font-mono">
                  {[1.0, 1.5, 2.0].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => onResolutionScaleChange(scale)}
                      className={`px-2 py-0.5 rounded text-xs transition ${
                        resolutionScale === scale
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {scale === 1.0 ? '1x' : scale === 1.5 ? '1.5x' : '2x'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cinematic Mode inside drawer */}
              {onToggleCinematicMode && (
                <button
                  onClick={() => {
                    onClose();
                    onToggleCinematicMode();
                  }}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span>Ativar Modo Cinematográfico (C)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer with Teoria and Keyboard Shortcuts */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <button
            onClick={() => {
              onClose();
              onOpenTheory();
            }}
            className="hover:text-cyan-400 transition flex items-center gap-1 font-sans"
          >
            <span>📖 Fundamentos Físicos</span>
          </button>
          <span>Atalhos: Espaço, R, S, C</span>
        </div>
      </aside>
    </>
  );
};
