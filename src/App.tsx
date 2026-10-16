/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Sparkles, 
  Orbit, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  BarChart2, 
  FileText, 
  SplitSquareVertical, 
  Info,
  Film,
  EyeOff
} from 'lucide-react';
import { GALAXY_PRESETS } from './physics/galaxyPresets';
import { generateGalaxyPair } from './physics/galaxyGenerator';
import { GalaxySimulationEngine } from './physics/nbodyEngine';
import { CameraPreset, GalaxyParams, PhysicalMetrics, SimulationPreset } from './types/galaxy';
import { GalaxyScene3D } from './components/GalaxyScene3D';
import { HamburgerMenu } from './components/HamburgerMenu';
import { GalaxyParametersModal } from './components/GalaxyParametersModal';
import { StatisticalDiagnosticsModal } from './components/StatisticalDiagnosticsModal';
import { ScientificReportModal } from './components/ScientificReportModal';
import { MultiScenarioComparison } from './components/MultiScenarioComparison';
import { AIAssistantModal } from './components/AIAssistantModal';

export default function App() {
  // 1. Preset & Engine State
  const [currentPreset, setCurrentPreset] = useState<SimulationPreset>(GALAXY_PRESETS[0]);
  const [galaxy1, setGalaxy1] = useState<GalaxyParams>(GALAXY_PRESETS[0].galaxy1);
  const [galaxy2, setGalaxy2] = useState<GalaxyParams>(GALAXY_PRESETS[0].galaxy2);
  const [dt, setDt] = useState<number>(GALAXY_PRESETS[0].recommendedDt);
  const [softening, setSoftening] = useState<number>(0.8);
  const [frictionEnabled, setFrictionEnabled] = useState<boolean>(true);

  // Engine instance initialized once per configuration
  const [engine, setEngine] = useState<GalaxySimulationEngine>(() => {
    const stars = generateGalaxyPair(GALAXY_PRESETS[0].galaxy1, GALAXY_PRESETS[0].galaxy2);
    return new GalaxySimulationEngine(
      GALAXY_PRESETS[0].galaxy1,
      GALAXY_PRESETS[0].galaxy2,
      stars,
      GALAXY_PRESETS[0].recommendedDt
    );
  });

  // 2. Playback State
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [currentTimeMyr, setCurrentTimeMyr] = useState<number>(0);
  const [metrics, setMetrics] = useState<PhysicalMetrics | null>(null);

  // 3. Visual & Camera State
  const [cameraPreset, setCameraPreset] = useState<CameraPreset['id']>('orbit');
  const [showTrails, setShowTrails] = useState<boolean>(true);
  const [showRocheSpheres, setShowRocheSpheres] = useState<boolean>(false);
  const [showPotentialGrid, setShowPotentialGrid] = useState<boolean>(false);
  const [resolutionScale, setResolutionScale] = useState<number>(1.5);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isCinematicMode, setIsCinematicMode] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // 4. Modals State
  const [isParamsOpen, setIsParamsOpen] = useState<boolean>(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isMultiScenarioOpen, setIsMultiScenarioOpen] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Switch to a new preset
  const handleSelectPreset = useCallback((preset: SimulationPreset) => {
    setCurrentPreset(preset);
    setGalaxy1(preset.galaxy1);
    setGalaxy2(preset.galaxy2);
    setDt(preset.recommendedDt);

    const newStars = generateGalaxyPair(preset.galaxy1, preset.galaxy2);
    const newEngine = new GalaxySimulationEngine(
      preset.galaxy1,
      preset.galaxy2,
      newStars,
      preset.recommendedDt
    );
    newEngine.softening = softening;
    newEngine.frictionEnabled = frictionEnabled;

    setEngine(newEngine);
    setCurrentTimeMyr(0);
    setMetrics(newEngine.computePhysicalMetrics());
  }, [softening, frictionEnabled]);

  // Reset current simulation back to t = 0
  const handleReset = useCallback(() => {
    const newStars = generateGalaxyPair(galaxy1, galaxy2);
    engine.reset(galaxy1, galaxy2, newStars);
    setCurrentTimeMyr(0);
    setMetrics(engine.computePhysicalMetrics());
  }, [engine, galaxy1, galaxy2]);

  // Step 1 dt forward
  const handleStep = useCallback(() => {
    if (!isRunning) {
      const newMetrics = engine.step();
      setCurrentTimeMyr(engine.currentTimeMyr);
      setMetrics(newMetrics);
    }
  }, [engine, isRunning]);

  // Apply customized parameters from modal
  const handleApplyParameters = useCallback((
    newG1: GalaxyParams,
    newG2: GalaxyParams,
    newDt: number,
    newSoftening: number,
    newFriction: boolean
  ) => {
    setGalaxy1(newG1);
    setGalaxy2(newG2);
    setDt(newDt);
    setSoftening(newSoftening);
    setFrictionEnabled(newFriction);

    const newStars = generateGalaxyPair(newG1, newG2);
    const newEngine = new GalaxySimulationEngine(newG1, newG2, newStars, newDt);
    newEngine.softening = newSoftening;
    newEngine.frictionEnabled = newFriction;

    setEngine(newEngine);
    setCurrentTimeMyr(0);
    setMetrics(newEngine.computePhysicalMetrics());
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcuts (Space = Play/Pause, R = Reset, S = Step, M = Menu, C = Cinema, ESC = Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.code === 'KeyR') {
        handleReset();
      } else if (e.code === 'KeyS') {
        handleStep();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsMenuOpen((prev) => !prev);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCinematicMode((prev) => !prev);
      } else if (e.code === 'Escape') {
        if (isMenuOpen) {
          setIsMenuOpen(false);
        } else if (isCinematicMode) {
          setIsCinematicMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleStep, isCinematicMode, isMenuOpen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* 1. Unobstructed 3D WebGL Canvas Viewport */}
      <GalaxyScene3D
        engine={engine}
        isRunning={isRunning}
        simulationSpeed={simulationSpeed}
        cameraPreset={cameraPreset}
        showTrails={showTrails}
        showRocheSpheres={showRocheSpheres}
        showPotentialGrid={showPotentialGrid}
        resolutionScale={resolutionScale}
        onMetricsUpdate={(newMetrics) => {
          setMetrics(newMetrics);
          setCurrentTimeMyr(engine.currentTimeMyr);
        }}
      />

      {/* Floating Exit Pill when in Cinematic Mode */}
      {isCinematicMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto transition-all duration-300 opacity-60 hover:opacity-100 animate-in fade-in">
          <button
            onClick={() => setIsCinematicMode(false)}
            className="px-4 py-1.5 rounded-full bg-slate-900/95 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 shadow-2xl backdrop-blur-md transition group"
          >
            <EyeOff className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300" />
            <span>Modo Cinematográfico Ativo (Pressione <strong>C</strong> para restaurar)</span>
          </button>
        </div>
      )}

      {/* 2. Top-Left Hamburger Menu & Drawer (All simulation controls, models and analysis) */}
      <HamburgerMenu
        isOpen={isMenuOpen}
        onToggleOpen={() => setIsMenuOpen(!isMenuOpen)}
        onClose={() => setIsMenuOpen(false)}
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onStep={handleStep}
        onReset={handleReset}
        currentPresetId={currentPreset.id}
        onSelectPreset={handleSelectPreset}
        currentTimeMyr={currentTimeMyr}
        simulationSpeed={simulationSpeed}
        onSpeedChange={setSimulationSpeed}
        cameraPreset={cameraPreset}
        onCameraPresetChange={setCameraPreset}
        showTrails={showTrails}
        onToggleTrails={() => setShowTrails(!showTrails)}
        showRocheSpheres={showRocheSpheres}
        onToggleRoche={() => setShowRocheSpheres(!showRocheSpheres)}
        showPotentialGrid={showPotentialGrid}
        onToggleGrid={() => setShowPotentialGrid(!showPotentialGrid)}
        resolutionScale={resolutionScale}
        onResolutionScaleChange={setResolutionScale}
        metrics={metrics}
        isCinematicMode={isCinematicMode}
        onToggleCinematicMode={() => setIsCinematicMode(!isCinematicMode)}
        onOpenParameters={() => setIsParamsOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenMultiScenario={() => setIsMultiScenarioOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenTheory={() => setIsTheoryOpen(true)}
      />

      {/* 3. Top-Right: Quick Controls, Cinematic Toggle & Fullscreen */}
      <div className={`absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2 transition-all duration-500 ${
        isCinematicMode ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <button
          onClick={() => setIsCinematicMode(true)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 border border-slate-800 shadow-xl backdrop-blur-md transition flex items-center gap-1.5"
          title="Modo Cinematográfico (Ocultar UI - Tecla 'C')"
        >
          <Film className="w-4 h-4 text-indigo-400" />
        </button>

        <button
          onClick={() => setIsTheoryOpen(true)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shadow-xl backdrop-blur-md transition"
          title="Equações e Fundamentos Físicos"
        >
          <Info className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 shadow-xl backdrop-blur-md transition"
          title="Modo Tela Cheia"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* 5. Modals */}
      <GalaxyParametersModal
        isOpen={isParamsOpen}
        onClose={() => setIsParamsOpen(false)}
        galaxy1={galaxy1}
        galaxy2={galaxy2}
        dt={dt}
        softening={softening}
        frictionEnabled={frictionEnabled}
        onApply={handleApplyParameters}
        onResetDefaults={() => {
          setGalaxy1(currentPreset.galaxy1);
          setGalaxy2(currentPreset.galaxy2);
          setDt(currentPreset.recommendedDt);
          setSoftening(0.8);
          setFrictionEnabled(true);
        }}
      />

      <StatisticalDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        trajectoryHistory={engine.trajectoryHistory}
        galaxy1={galaxy1}
        galaxy2={galaxy2}
        scenarioName={currentPreset.title}
      />

      <ScientificReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        scenarioName={currentPreset.title}
        galaxy1={galaxy1}
        galaxy2={galaxy2}
        metrics={metrics}
        trajectoryHistory={engine.trajectoryHistory}
        currentTimeMyr={currentTimeMyr}
      />

      <MultiScenarioComparison
        isOpen={isMultiScenarioOpen}
        onClose={() => setIsMultiScenarioOpen(false)}
        currentPreset={currentPreset}
        onSelectScenarioToSimulate={handleSelectPreset}
      />

      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        preset={currentPreset}
        metrics={metrics}
      />

      {/* Theory & Equations Quick Modal */}
      {isTheoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                <span>Fundamentos Físicos & Métodos Numéricos</span>
              </h3>
              <button
                onClick={() => setIsTheoryOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed font-sans">
              <p>
                <strong>1. Integrador Simplético Leapfrog (Kick-Drift-Kick):</strong> Preserva a estrutura simplética do espaço de fase e a energia hamiltoniana total $H = K + U$ sem deriva cumulativa não-física ao longo de bilhões de anos.
              </p>
              <p>
                <strong>2. Potencial Amortecido (Softened Plummer/Hernquist):</strong> O campo gravitacional utiliza softening de gravidade $\epsilon$ para evitar singularidades matemáticas infinitas em aproximações $r \to 0$:
                <br />
                <code className="block bg-slate-950 p-2 rounded mt-1 text-cyan-300 font-mono">
                  a = - G * M * r / (r² + ε²)^(3/2)
                </code>
              </p>
              <p>
                <strong>3. Fricção Dinâmica de Chandrasekhar:</strong> O arrasto provocado pelas esteiras de matéria escura nos halos estelares é modelado analiticamente:
                <br />
                <code className="block bg-slate-950 p-2 rounded mt-1 text-cyan-300 font-mono">
                  F_df = - (4π G² M² ρ ln Λ / v²) * [erf(X) - (2X / √π) e^(-X²)] * (v / |v|)
                </code>
              </p>
              <p>
                <strong>4. Critério de Estabilidade de Toomre (Q &gt; 1):</strong> Os discos estelares têm velocidades circulares computadas a partir do equilíbrio com os bojos e halos de matéria escura, com dispersão de velocidades radial $\sigma_R$ que estabiliza o disco contra colapso espontâneo antes do encontro.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsTheoryOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
