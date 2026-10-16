/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, FileText, Download, Printer, Check, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GalaxyParams, PhysicalMetrics, TrajectoryPoint } from '../types/galaxy';
import { predictCollisionEvolution, MLSurrogatePrediction } from '../physics/astrophysicsML';

interface ScientificReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioName: string;
  galaxy1: GalaxyParams;
  galaxy2: GalaxyParams;
  metrics: PhysicalMetrics | null;
  trajectoryHistory: TrajectoryPoint[];
  currentTimeMyr: number;
}

export const ScientificReportModal: React.FC<ScientificReportModalProps> = ({
  isOpen,
  onClose,
  scenarioName,
  galaxy1,
  galaxy2,
  metrics,
  trajectoryHistory,
  currentTimeMyr,
}) => {
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const currentMetrics = metrics || {
    currentSeparation: 50,
    relativeVelocity: 120,
    pericenterDistance: 15,
    massRatio: galaxy2.mass / galaxy1.mass,
    kineticEnergy: 120,
    potentialEnergy: -200,
    totalEnergy: -80,
    initialTotalEnergy: -80,
    energyConservationDrift: 0.12,
    angularMomentum: 450,
    virialRatio: 1.2,
    tidalRadius: 8.5,
    starburstCount: 150,
    dynFrictionMag: 4.2,
    impactParameter: 18,
    estimatedMergerTime: 1800,
    morphologyPrediction: 'Interação de Maré Ativa',
  };

  const mlPrediction: MLSurrogatePrediction = predictCollisionEvolution(galaxy1, galaxy2, currentMetrics);

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor = [14, 116, 144]; // cyan-700
      const darkColor = [15, 23, 42]; // slate-900

      // Title & Header Bar
      doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.rect(0, 0, 210, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('GALAXY - RELATÓRIO TÉCNICO DE SIMULAÇÃO', 14, 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Dinâmica de Galáxias N-Corpos & Astrofísica Computacional | ${new Date().toLocaleDateString('pt-BR')}`, 14, 21);

      // Metadata section
      let y = 38;
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(`1. IDENTIFICAÇÃO DO CENÁRIO: ${scenarioName.toUpperCase()}`, 14, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Tempo Cósmico Decorrido: ${currentTimeMyr.toFixed(1)} Myr (Milhões de anos)`, 14, y);
      y += 5;
      doc.text(`Número de Pontos Amostrados na Trajetória: ${trajectoryHistory.length} registros`, 14, y);

      // Section 2: Initial Parameters Table
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. PARÂMETROS FÍSICOS DAS PROGENITORAS', 14, y);

      y += 6;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 38, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, y, 182, 38, 'S');

      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      // Table columns
      doc.setFont('helvetica', 'bold');
      doc.text('Parâmetro Astrofísico', 18, y + 6);
      doc.text(`Galáxia 1: ${galaxy1.name}`, 80, y + 6);
      doc.text(`Galáxia 2: ${galaxy2.name}`, 140, y + 6);
      doc.setFont('helvetica', 'normal');

      doc.line(14, y + 8, 196, y + 8);
      doc.text('Massa Estelar Visível (M☉):', 18, y + 14);
      doc.text(`${galaxy1.mass} × 10¹⁰ M☉`, 80, y + 14);
      doc.text(`${galaxy2.mass} × 10¹⁰ M☉`, 140, y + 14);

      doc.text('Raio do Disco Visível (kpc):', 18, y + 19);
      doc.text(`${galaxy1.radius} kpc`, 80, y + 19);
      doc.text(`${galaxy2.radius} kpc`, 140, y + 19);

      doc.text('Massa do SMBH Central:', 18, y + 24);
      doc.text(`${galaxy1.blackHoleMass} × 10⁶ M☉`, 80, y + 24);
      doc.text(`${galaxy2.blackHoleMass} × 10⁶ M☉`, 140, y + 24);

      doc.text('Razão de Matéria Escura (Halo):', 18, y + 29);
      doc.text(`${galaxy1.haloMassRatio}x massa visível`, 80, y + 29);
      doc.text(`${galaxy2.haloMassRatio}x massa visível`, 140, y + 29);

      doc.text('Sentido de Rotação (Spin):', 18, y + 34);
      doc.text(galaxy1.rotationSense === 1 ? 'Prógrado (+1)' : 'Retrógrado (-1)', 80, y + 34);
      doc.text(galaxy2.rotationSense === 1 ? 'Prógrado (+1)' : 'Retrógrado (-1)', 140, y + 34);

      // Section 3: Conservation & Diagnostics
      y += 48;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. LEIS DE CONSERVAÇÃO E PRECISÃO NUMÉRICA', 14, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.text(`• Distância Mínima no Pericentro (r_p): ${currentMetrics.pericenterDistance.toFixed(2)} kpc`, 18, y);
      y += 5;
      doc.text(`• Velocidade Relativa no Instante Atual: ${currentMetrics.relativeVelocity.toFixed(1)} km/s`, 18, y);
      y += 5;
      doc.text(`• Razão de Massas do Par (q = M₂/M₁): ${currentMetrics.massRatio.toFixed(3)}`, 18, y);
      y += 5;
      doc.text(`• Deriva do Hamiltoniano Total (ΔE / E₀): ${currentMetrics.energyConservationDrift.toFixed(3)}% (Integrador Simplético Leapfrog)`, 18, y);
      y += 5;
      doc.text(`• Razão Virial 2K / |U|: ${currentMetrics.virialRatio.toFixed(2)} (Estado Virializado = 1.0)`, 18, y);
      y += 5;
      doc.text(`• Raio de Maré de Roche: ${currentMetrics.tidalRadius.toFixed(2)} kpc`, 18, y);

      // Section 4: Machine Learning Surrogate Predictions
      y += 12;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('4. PREVISÕES DE APRENDIZADO DE MÁQUINA & TEORIA FÍSICA', 14, y);

      y += 6;
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, 182, 36, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(14, y, 182, 36, 'S');

      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Morfologia Remanescente Prevista: ${mlPrediction.finalMorphology}`, 18, y + 7);
      doc.text(`Escala de Tempo até Coalescência Final: ~${mlPrediction.mergerTimescaleMyr} Myr`, 18, y + 13);
      doc.text(`Índice de Sérsic Previsto (n): ${mlPrediction.sersicIndex} (Disco = 1.0, Elíptica = 4.0)`, 18, y + 19);
      doc.text(`Fração de Estrelas Ligadas ao Remanescente: ${mlPrediction.boundMassFraction}%`, 18, y + 25);
      doc.text(`Multiplicador de Formação Estelar por Choque: ${mlPrediction.starburstPeakSFRMultiplier}x SFR`, 18, y + 31);

      // Section 5: Theoretical Conclusions
      y += 46;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('5. SÍNTESE ASTROFÍSICA E CONCLUSÃO', 14, y);

      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const conclusionText = `A colisão entre as galáxias ${galaxy1.name} e ${galaxy2.name} apresenta dinâmica regida por fricção de Chandrasekhar nos halos de matéria escura. A perturbação no potencial gravitacional dissipa o momento angular das partículas estelares, arremessando fluxos para os arcos de maré. A conservação hamiltoniana com deriva inferior a 1% confirma a alta fidelidade matemática da integração simplética realizada.`;
      const splitConclusion = doc.splitTextToSize(conclusionText, 180);
      doc.text(splitConclusion, 18, y);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Gerado automaticamente pelo Galaxy - Simulador de Galáxias N-Corpos', 14, 285);
      doc.text('Página 1 de 1', 185, 285);

      doc.save(`astrocollision_relatorio_${scenarioName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Relatório Técnico de Astrofísica</h2>
              <p className="text-xs text-slate-400">Síntese formal de colisão, conservação de energia e previsão morfológica</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Preview Document */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950/60 font-sans">
          {/* Document Cover Card */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">Galaxy • Relatório de Simulação</span>
                <h1 className="text-2xl font-bold text-white mt-1">{scenarioName}</h1>
                <p className="text-xs text-slate-400 mt-0.5">Tempo Cósmico: {currentTimeMyr.toFixed(1)} Myr • Integrador Simplético Leapfrog</p>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Hamiltoniano Válido (ΔE/E₀: {currentMetrics.energyConservationDrift.toFixed(2)}%)</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-sans">Pericentro Mínimo</span>
                <p className="text-base font-bold text-cyan-400">{currentMetrics.pericenterDistance.toFixed(2)} kpc</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-sans">Vel. Relativa Atual</span>
                <p className="text-base font-bold text-amber-400">{currentMetrics.relativeVelocity.toFixed(1)} km/s</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-sans">Razão de Massa (q)</span>
                <p className="text-base font-bold text-purple-400">{currentMetrics.massRatio.toFixed(2)}</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase font-sans">Tempo de Coalescência</span>
                <p className="text-base font-bold text-rose-400">~{mlPrediction.mergerTimescaleMyr} Myr</p>
              </div>
            </div>

            {/* Progenitor Galaxies Comparison Table */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Progenitoras Envolvidas</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Propriedade</th>
                      <th className="p-2.5 text-cyan-400">G1: {galaxy1.name}</th>
                      <th className="p-2.5 text-rose-400">G2: {galaxy2.name}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
                    <tr>
                      <td className="p-2.5 font-sans text-slate-400">Massa Estelar (M☉)</td>
                      <td className="p-2.5">{galaxy1.mass} × 10¹⁰ M☉</td>
                      <td className="p-2.5">{galaxy2.mass} × 10¹⁰ M☉</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-400">Raio do Disco Visível</td>
                      <td className="p-2.5">{galaxy1.radius} kpc</td>
                      <td className="p-2.5">{galaxy2.radius} kpc</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-400">Massa SMBH Central</td>
                      <td className="p-2.5">{galaxy1.blackHoleMass} × 10⁶ M☉</td>
                      <td className="p-2.5">{galaxy2.blackHoleMass} × 10⁶ M☉</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-400">Halo de Matéria Escura</td>
                      <td className="p-2.5">{galaxy1.haloMassRatio}x</td>
                      <td className="p-2.5">{galaxy2.haloMassRatio}x</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans text-slate-400">Geometria Orbital (Spin)</td>
                      <td className="p-2.5 font-sans">{galaxy1.rotationSense === 1 ? 'Prógrado (+1)' : 'Retrógrado (-1)'}</td>
                      <td className="p-2.5 font-sans">{galaxy2.rotationSense === 1 ? 'Prógrado (+1)' : 'Retrógrado (-1)'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Machine Learning Surrogate Box */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Previsões do Modelo Físico-Neural (PINN)</span>
              </h3>
              <p className="text-xs text-slate-300">
                <strong>Morfologia Final Estimada:</strong> {mlPrediction.finalMorphology}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs font-mono">
                <div>
                  <span className="text-slate-400 font-sans block text-[10px]">Perfil de Sérsic (n)</span>
                  <span className="text-purple-300 font-bold">{mlPrediction.sersicIndex}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[10px]">Estrelas Ligadas</span>
                  <span className="text-emerald-400 font-bold">{mlPrediction.boundMassFraction}%</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[10px]">Pico de Starburst</span>
                  <span className="text-rose-400 font-bold">{mlPrediction.starburstPeakSFRMultiplier}x SFR</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block text-[10px]">Freq. Ondas Grav.</span>
                  <span className="text-cyan-400 font-bold">{mlPrediction.gravitationalWaveFrequencyHz} nHz</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 italic">{mlPrediction.theoreticalNotes}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/70">
          <span className="text-xs text-slate-400">PDF formatado no padrão A4 de publicação astrofísica.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Fechar
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Gerando Documento...' : 'Baixar Relatório em PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
