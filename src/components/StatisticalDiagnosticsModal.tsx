/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  BarChart2, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Activity, 
  TrendingUp, 
  Layers, 
  FileSpreadsheet 
} from 'lucide-react';
import { GalaxyParams, TrajectoryPoint } from '../types/galaxy';
import { 
  exportTrajectoryToCSV, 
  generatePythonAnalysisScript, 
  generateRAnalysisScript, 
  generateMatlabAnalysisScript 
} from '../physics/astrophysicsML';

interface StatisticalDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trajectoryHistory: TrajectoryPoint[];
  galaxy1: GalaxyParams;
  galaxy2: GalaxyParams;
  scenarioName: string;
}

export const StatisticalDiagnosticsModal: React.FC<StatisticalDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  trajectoryHistory,
  galaxy1,
  galaxy2,
  scenarioName,
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'table' | 'scripts'>('charts');
  const [activeScriptTab, setActiveScriptTab] = useState<'python' | 'r' | 'matlab'>('python');
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render HTML5 2D Canvas diagnostic charts (no heavy chart library dependency)
  useEffect(() => {
    if (!isOpen || activeTab !== 'charts') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (trajectoryHistory.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Aguardando acúmulo de dados da simulação (inicie o tempo cósmico)...', width / 2, height / 2);
      return;
    }

    // Split canvas into 4 quadrant sub-charts:
    // Top-Left: Separation R(t)
    // Top-Right: Phase Space (r vs v_rel)
    // Bottom-Left: Energy Conservation (K, U, E)
    // Bottom-Right: Virial Ratio 2K / |U|
    const pad = 40;
    const halfW = width / 2;
    const halfH = height / 2;

    const times = trajectoryHistory.map((d) => d.timeMyr);
    const minT = times[0];
    const maxT = Math.max(times[times.length - 1], minT + 10);

    // Helper to draw chart frame
    const drawFrame = (x: number, y: number, w: number, h: number, title: string) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, x + 12, y + 20);
    };

    // 1. Chart 1: Separation R(t) in Top-Left
    drawFrame(0, 0, halfW, halfH, 'Distância de Separação Intergaláctica R(t) [kpc]');
    const seps = trajectoryHistory.map((d) => d.separationKpc);
    const maxSep = Math.max(...seps, 10);
    const minSep = Math.min(...seps);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trajectoryHistory.length; i++) {
      const px = pad + ((times[i] - minT) / (maxT - minT)) * (halfW - pad * 2);
      const py = (halfH - pad) - (seps[i] / maxSep) * (halfH - pad * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Mark minimum pericenter
    const minIdx = seps.indexOf(minSep);
    const pxMin = pad + ((times[minIdx] - minT) / (maxT - minT)) * (halfW - pad * 2);
    const pyMin = (halfH - pad) - (minSep / maxSep) * (halfH - pad * 2);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(pxMin, pyMin, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f43f5e';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillText(`Pericentro: ${minSep.toFixed(1)} kpc`, pxMin + 6, pyMin - 4);

    // 2. Chart 2: Phase Space (Separation vs Relative Velocity) in Top-Right
    drawFrame(halfW, 0, halfW, halfH, 'Diagrama de Espaço de Fase (R vs. Velocidade Relativa)');
    const vRels = trajectoryHistory.map((d) => d.relVelocityKms);
    const maxV = Math.max(...vRels, 100);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trajectoryHistory.length; i++) {
      const px = halfW + pad + (seps[i] / maxSep) * (halfW - pad * 2);
      const py = (halfH - pad) - (vRels[i] / maxV) * (halfH - pad * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current point
    const currPx = halfW + pad + (seps[seps.length - 1] / maxSep) * (halfW - pad * 2);
    const currPy = (halfH - pad) - (vRels[vRels.length - 1] / maxV) * (halfH - pad * 2);
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(currPx, currPy, 5, 0, Math.PI * 2);
    ctx.fill();

    // 3. Chart 3: Energy Conservation (K, U, E) in Bottom-Left
    drawFrame(0, halfH, halfW, halfH, 'Conservação de Energia Orbital (Hamiltoniano K, U, Total)');
    const energies = trajectoryHistory.map((d) => d.totalEnergy);
    const kEnergies = trajectoryHistory.map((d) => d.kineticEnergy);
    const uEnergies = trajectoryHistory.map((d) => d.potentialEnergy);

    const allE = [...energies, ...kEnergies, ...uEnergies];
    const minE = Math.min(...allE);
    const maxE = Math.max(...allE, 1);
    const eRange = maxE - minE || 1;

    // Draw Kinetic (green)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < trajectoryHistory.length; i++) {
      const px = pad + ((times[i] - minT) / (maxT - minT)) * (halfW - pad * 2);
      const py = (height - pad) - ((kEnergies[i] - minE) / eRange) * (halfH - pad * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw Potential (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < trajectoryHistory.length; i++) {
      const px = pad + ((times[i] - minT) / (maxT - minT)) * (halfW - pad * 2);
      const py = (height - pad) - ((uEnergies[i] - minE) / eRange) * (halfH - pad * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw Total Energy (purple)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < trajectoryHistory.length; i++) {
      const px = pad + ((times[i] - minT) / (maxT - minT)) * (halfW - pad * 2);
      const py = (height - pad) - ((energies[i] - minE) / eRange) * (halfH - pad * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Energy Legend
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#22c55e'; ctx.fillText('■ Cinética (K)', pad, height - 12);
    ctx.fillStyle = '#ef4444'; ctx.fillText('■ Potencial (U)', pad + 90, height - 12);
    ctx.fillStyle = '#c084fc'; ctx.fillText('■ Total (E)', pad + 185, height - 12);

    // 4. Chart 4: Virial Ratio in Bottom-Right
    drawFrame(halfW, halfH, halfW, halfH, 'Razão Virial (2K / |U|) & Starbursts Ativos');
    const virials = trajectoryHistory.map((d) => d.virialRatio);
    const maxVir = Math.min(3.5, Math.max(...virials, 1.5));

    // Virial equilibrium line at 1.0
    const pyVirial1 = (height - pad) - (1.0 / maxVir) * (halfH - pad * 2);
    ctx.strokeStyle = '#64748b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(halfW + pad, pyVirial1);
    ctx.lineTo(width - pad, pyVirial1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Equilíbrio Virial (1.0)', halfW + pad + 6, pyVirial1 - 4);

    // Virial curve
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < trajectoryHistory.length; i++) {
      const px = halfW + pad + ((times[i] - minT) / (maxT - minT)) * (halfW - pad * 2);
      const py = (height - pad) - (Math.min(maxVir, virials[i]) / maxVir) * (halfH - pad * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }, [isOpen, activeTab, trajectoryHistory]);

  if (!isOpen) return null;

  // CSV Download Handler
  const handleDownloadCSV = () => {
    const csvContent = exportTrajectoryToCSV(trajectoryHistory, galaxy1, galaxy2);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `trajetoria_astrocollision_${scenarioName.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Script Handler
  const handleCopyScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pythonScript = generatePythonAnalysisScript(scenarioName);
  const rScript = generateRAnalysisScript(scenarioName);
  const matlabScript = generateMatlabAnalysisScript(scenarioName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Diagnósticos Físicos & Integração Estatística</h2>
              <p className="text-xs text-slate-400">
                Gráficos de conservação, tabela de trajetória e código pronto para Astropy, Python, R e MATLAB
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

        {/* Top Tab Switcher */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'charts'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Gráficos Diagnósticos (4 Quadrantes)</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'table'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabela de Trajetória ({trajectoryHistory.length} pontos)</span>
            </button>

            <button
              onClick={() => setActiveTab('scripts')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'scripts'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Scripts para Ferramentas Externas</span>
            </button>
          </div>

          {/* Action: Export CSV */}
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV Completo</span>
          </button>
        </div>

        {/* Tab 1: Charts */}
        {activeTab === 'charts' && (
          <div className="flex-1 overflow-hidden p-4 flex flex-col items-center justify-center bg-slate-950/40">
            <canvas
              ref={canvasRef}
              width={900}
              height={500}
              className="w-full max-h-[500px] rounded-xl border border-slate-800 shadow-inner object-contain"
            />
          </div>
        )}

        {/* Tab 2: Table */}
        {activeTab === 'table' && (
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 sticky top-0">
                  <th className="p-2.5">Tempo (Myr)</th>
                  <th className="p-2.5">Separação (kpc)</th>
                  <th className="p-2.5">Vel. Rel (km/s)</th>
                  <th className="p-2.5">G1 (x, y, z)</th>
                  <th className="p-2.5">G2 (x, y, z)</th>
                  <th className="p-2.5">Energia Total (E)</th>
                  <th className="p-2.5">Deriva ΔE/E₀ (%)</th>
                  <th className="p-2.5">Virial (2K/|U|)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {trajectoryHistory.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-2.5 font-bold text-cyan-400">{row.timeMyr.toFixed(1)}</td>
                    <td className="p-2.5">{row.separationKpc.toFixed(2)}</td>
                    <td className="p-2.5 text-amber-400">{row.relVelocityKms.toFixed(1)}</td>
                    <td className="p-2.5 text-slate-400">[{row.pos1.join(', ')}]</td>
                    <td className="p-2.5 text-slate-400">[{row.pos2.join(', ')}]</td>
                    <td className="p-2.5 text-purple-400">{row.totalEnergy.toFixed(2)}</td>
                    <td className={`p-2.5 font-semibold ${Math.abs(row.energyDriftPercent) < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {row.energyDriftPercent.toFixed(2)}%
                    </td>
                    <td className="p-2.5">{row.virialRatio.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: External Analysis Scripts */}
        {activeTab === 'scripts' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveScriptTab('python')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeScriptTab === 'python'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Python (Astropy / NumPy / Matplotlib)
                </button>
                <button
                  onClick={() => setActiveScriptTab('r')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeScriptTab === 'r'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  R (ggplot2 / tidyverse)
                </button>
                <button
                  onClick={() => setActiveScriptTab('matlab')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeScriptTab === 'matlab'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  MATLAB / GNU Octave
                </button>
              </div>

              <button
                onClick={() => {
                  const script =
                    activeScriptTab === 'python'
                      ? pythonScript
                      : activeScriptTab === 'r'
                      ? rScript
                      : matlabScript;
                  handleCopyScript(script);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Código'}</span>
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-[380px] leading-relaxed select-text">
                {activeScriptTab === 'python' ? pythonScript : activeScriptTab === 'r' ? rScript : matlabScript}
              </pre>
            </div>

            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
              <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">Como executar: </span>
                Clique em <strong className="text-emerald-400">Exportar CSV Completo</strong> acima para baixar o arquivo{' '}
                <code className="text-cyan-400">trajetoria_astrocollision.csv</code> na mesma pasta do script, e execute no terminal:{' '}
                <code className="text-cyan-400">python analyze_galaxy.py</code>. Todos os gráficos de publicação serão salvos em alta resolução (300 DPI).
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Padrão de tabelas compatível com IVOA / CDS TOPCAT e Astropy QTable.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
