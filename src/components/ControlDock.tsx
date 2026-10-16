/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Sliders, 
  BarChart2, 
  FileText, 
  SplitSquareVertical, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Camera,
  Layers,
  Gauge,
  Film
} from 'lucide-react';
import { GALAXY_PRESETS } from '../physics/galaxyPresets';
import { CameraPreset, PhysicalMetrics, SimulationPreset } from '../types/galaxy';

interface ControlDockProps {
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
}

export const ControlDock: React.FC<ControlDockProps> = ({
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
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'playback' | 'camera' | 'display'>('playback');

  const speeds = [0.5, 1.0, 2.0, 5.0, 10.0];

  const cameraOptions: Array<{ id: CameraPreset['id']; label: string }> = [
    { id: 'orbit', label: 'Orbital Livre' },
    { id: 'top', label: 'Plano XY (Topo)' },
    { id: 'side', label: 'Plano XZ (Perfil)' },
    { id: 'com', label: 'Centro de Massa' },
    { id: 'follow_g1', label: 'Seguir G1' },
    { id: 'follow_g2', label: 'Seguir G2' },
    { id: 'cinematic', label: 'Cinemático 360°' },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-5xl px-3 pointer-events-none transition-all duration-300">
      <div className="pointer-events-auto flex flex-col items-center">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mb-1.5 flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-t-lg bg-slate-900/95 border border-b-0 border-slate-700/70 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition shadow-lg backdrop-blur-md"
          title="Alternar visibilidade do painel (Tecla H)"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Expandir Painel de Controle</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Ocultar Painel (Visualização Total)</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div
          className={`w-full bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md transition-all duration-300 overflow-hidden ${
            isCollapsed ? 'max-h-0 opacity-0 pointer-events-none border-none py-0' : 'p-3.5 opacity-100'
          }`}
        >
          {/* Preset Selector Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2.5 mb-2.5 border-b border-slate-800/80 scrollbar-thin">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Modelos:
            </span>
            {GALAXY_PRESETS.map((preset) => {
              const isActive = preset.id === currentPresetId;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  <span>{preset.title.split('(')[0].trim()}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-Header Tabs & Quick Tools */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            {/* Tab switchers */}
            <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('playback')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition ${
                  activeTab === 'playback' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dinâmica & Tempo
              </button>
              <button
                onClick={() => setActiveTab('camera')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'camera' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-3 h-3" /> Câmera
              </button>
              <button
                onClick={() => setActiveTab('display')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'display' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" /> Camadas & Gráficos
              </button>
            </div>

            {/* Scientific Modals Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenParameters}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 flex items-center gap-1.5 transition"
                title="Ajustar massas, velocidades e parâmetros orbitais"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Parâmetros Físicos</span>
              </button>

              <button
                onClick={onOpenDiagnostics}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 flex items-center gap-1.5 transition"
                title="Estatísticas em tempo real, CSV e scripts Python/R"
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Análise Estatística</span>
              </button>

              <button
                onClick={onOpenReport}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 flex items-center gap-1.5 transition"
                title="Gerar e baixar relatório formal em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Relatório PDF</span>
              </button>

              <button
                onClick={onOpenMultiScenario}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/70 flex items-center gap-1.5 transition"
                title="Simular múltiplos cenários em paralelo"
              >
                <SplitSquareVertical className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Multicenários</span>
              </button>

              <button
                onClick={onOpenAI}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm flex items-center gap-1.5 transition"
                title="Diagnóstico astrofísico e IA Teórica"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>IA Astrofísica</span>
              </button>

              {onToggleCinematicMode && (
                <button
                  onClick={onToggleCinematicMode}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 flex items-center gap-1.5 transition shadow-sm"
                  title="Modo Cinematográfico (Oculta HUD - Tecla C)"
                >
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Modo Cinema (C)</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Tab Controls Content */}
          {activeTab === 'playback' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Playback Transport Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onTogglePlay}
                  className={`p-2.5 rounded-xl font-bold flex items-center justify-center transition shadow-lg ${
                    isRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                  }`}
                  title={isRunning ? 'Pausar Simulação (Espaço)' : 'Iniciar Simulação (Espaço)'}
                >
                  {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                <button
                  onClick={onStep}
                  disabled={isRunning}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition"
                  title="Avançar 1 passo de tempo (dt)"
                >
                  <StepForward className="w-4 h-4" />
                </button>

                <button
                  onClick={onReset}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Reiniciar para condições iniciais"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Time Display */}
                <div className="flex flex-col pl-2 border-l border-slate-800">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Tempo Cósmico</span>
                  <div className="text-sm font-mono font-bold text-cyan-400 flex items-baseline gap-1">
                    <span>{currentTimeMyr.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">Myr (Milhões de anos)</span>
                  </div>
                </div>
              </div>

              {/* Simulation Speed Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" /> Velocidade:
                </span>
                {speeds.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSpeedChange(s)}
                    className={`px-2 py-0.5 text-xs font-mono rounded-md transition ${
                      simulationSpeed === s
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Live Physical Quick Readout */}
              {metrics && (
                <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-slate-400 font-sans text-[11px]">Separação: </span>
                    <span className="text-cyan-400 font-semibold">{metrics.currentSeparation.toFixed(1)} kpc</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans text-[11px]">Vel. Rel: </span>
                    <span className="text-amber-400 font-semibold">{metrics.relativeVelocity.toFixed(0)} km/s</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans text-[11px]">Deriva ΔE/E₀: </span>
                    <span className={`font-semibold ${Math.abs(metrics.energyConservationDrift) < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {metrics.energyConservationDrift.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-sans text-[11px]">Starbursts: </span>
                    <span className="text-rose-400 font-semibold">{metrics.starburstCount} estrelas</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'camera' && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium mr-1">Perspectiva:</span>
              {cameraOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onCameraPresetChange(opt.id)}
                  className={`px-3 py-1 text-xs rounded-lg transition font-medium ${
                    cameraPreset === opt.id
                      ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {onToggleCinematicMode && (
                <button
                  onClick={onToggleCinematicMode}
                  className="px-3 py-1 text-xs rounded-lg transition font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 flex items-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Modo Cinema (Tecla C)</span>
                </button>
              )}
              <span className="text-[11px] text-slate-400 ml-auto italic">
                * Arraste o mouse para orbitar, botão direito para transladar e roda para zoom.
              </span>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onToggleTrails}
                  className={`px-3 py-1 text-xs rounded-lg border transition font-medium ${
                    showTrails
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {showTrails ? '✓' : '○'} Trajetórias Orbitais
                </button>

                <button
                  onClick={onToggleRoche}
                  className={`px-3 py-1 text-xs rounded-lg border transition font-medium ${
                    showRocheSpheres
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {showRocheSpheres ? '✓' : '○'} Esferas de Maré de Roche
                </button>

                <button
                  onClick={onToggleGrid}
                  className={`px-3 py-1 text-xs rounded-lg border transition font-medium ${
                    showPotentialGrid
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {showPotentialGrid ? '✓' : '○'} Grade Deformada de Potencial
                </button>
              </div>

              {/* Graphic Resolution Selector */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-slate-400 font-medium">Resolução Gráfica:</span>
                {[1.0, 1.5, 2.0].map((scale) => (
                  <button
                    key={scale}
                    onClick={() => onResolutionScaleChange(scale)}
                    className={`px-2 py-0.5 text-xs font-mono rounded-md transition ${
                      resolutionScale === scale
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {scale === 1.0 ? 'Padrão (1x)' : scale === 1.5 ? 'Alta (1.5x)' : 'Ultra / SuperSample (2x)'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
