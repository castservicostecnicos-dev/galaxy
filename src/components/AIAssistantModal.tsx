/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Brain, Loader2, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { GalaxyParams, PhysicalMetrics, SimulationPreset } from '../types/galaxy';
import { predictCollisionEvolution, MLSurrogatePrediction } from '../physics/astrophysicsML';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: SimulationPreset;
  metrics: PhysicalMetrics | null;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  preset,
  metrics,
}) => {
  const [analysisText, setAnalysisText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [customQuestion, setCustomQuestion] = useState<string>('');

  const currentMetrics = metrics || {
    currentSeparation: 45,
    relativeVelocity: 130,
    pericenterDistance: 12,
    massRatio: preset.galaxy2.mass / preset.galaxy1.mass,
    kineticEnergy: 100,
    potentialEnergy: -160,
    totalEnergy: -60,
    initialTotalEnergy: -60,
    energyConservationDrift: 0.1,
    angularMomentum: 320,
    virialRatio: 1.15,
    tidalRadius: 9.0,
    starburstCount: 180,
    dynFrictionMag: 4.5,
    impactParameter: 15,
    estimatedMergerTime: 1600,
    morphologyPrediction: 'Interação de Maré Prógrada',
  };

  const mlPrediction: MLSurrogatePrediction = predictCollisionEvolution(
    preset.galaxy1,
    preset.galaxy2,
    currentMetrics
  );

  const runAnalysis = async (userPrompt?: string) => {
    setLoading(true);
    setUsingFallback(false);

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioData: preset,
          physicalMetrics: currentMetrics,
          question: userPrompt,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysisText(data.analysis);
      } else {
        // Fallback to offline Physics-Informed ML Surrogate Model
        setUsingFallback(true);
        generateLocalAstrophysicsInsight();
      }
    } catch (err) {
      setUsingFallback(true);
      generateLocalAstrophysicsInsight();
    } finally {
      setLoading(false);
    }
  };

  const generateLocalAstrophysicsInsight = () => {
    const isMajor = currentMetrics.massRatio >= 0.33 && currentMetrics.massRatio <= 3.0;
    const isPrograde = preset.galaxy1.rotationSense === preset.galaxy2.rotationSense;

    const insight = `### Análise Astrofísica Teórica: ${preset.title}

#### 1. Classificação do Encontro Gravitacional
- **Regime**: ${isMajor ? 'Fusão Maior (Major Merger)' : 'Fusão Menor / Canibalismo Galáctico'} com razão de massas q = ${currentMetrics.massRatio.toFixed(2)}.
- **Ressonância de Spin-Órbita**: ${isPrograde ? 'Ressonância prógrada dupla. Os vetores de momento angular estelar alinham-se favoravelmente com o vetor orbital, promovendo a ejeção eficiente de caudas de maré espetaculares (efeito Toomre & Toomre 1972).' : 'Encontro prógrado-retrógrado inclinado. A assimetria reduz o arremesso de maré em uma das componentes, gerando caudas desiguais.'}

#### 2. Previsão de Morfologia Remanescente
- **Estrutura Final Prevista**: **${mlPrediction.finalMorphology}**
- **Perfil de Brilho de Superfície**: Índice de Sérsic n ≈ ${mlPrediction.sersicIndex} com elipticidade axial b/a ≈ ${mlPrediction.axisRatio}.
- **Fração de Estrelas Preservadas**: Cerca de ${mlPrediction.boundMassFraction}% das estrelas permanecerão gravitacionalmente ligadas ao corpo principal do remanescente, enquanto o restante povoará o halo difuso intergaláctico.

#### 3. Escala de Tempo e Fricção Dinâmica de Chandrasekhar
- **Tempo Estimado até Coalescência**: ~${mlPrediction.mergerTimescaleMyr} Myr (milhões de anos).
- O arrasto gravitacional gerado pelas esteiras de matéria escura (halos com ${preset.galaxy1.haloMassRatio}x e ${preset.galaxy2.haloMassRatio}x a massa bariônica) dissipa continuamente a energia orbital, transformando a trajetória em uma espiral de aproximação rápida.

#### 4. Formação Estelar & Starbursts
- **Pico de Formação Estelar (SFR)**: Aumento estimado em **${mlPrediction.starburstPeakSFRMultiplier}x** devido à compressão hidrodinâmica e ondas de choque em nuvens moleculares gigantes. Atualmente, há aproximadamente ${currentMetrics.starburstCount} regiões estelares em fase de ignição ultravioleta.

#### 5. Coalescência de Buracos Negros Supermassivos (SMBHs)
- A fusão final dos núcleos centrais (${preset.galaxy1.blackHoleMass} × 10⁶ M☉ e ${preset.galaxy2.blackHoleMass} × 10⁶ M☉) formará um par binário relativístico emitindo ondas gravitacionais de baixa frequência (~${mlPrediction.gravitationalWaveFrequencyHz} nHz), detectáveis por redes de temporização de pulsares (PTA / NANOGrav).`;

    setAnalysisText(insight);
  };

  useEffect(() => {
    if (isOpen && !analysisText) {
      runAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickQuestions = [
    'Qual a morfologia final prevista?',
    'Como a matéria escura desacelera a fusão?',
    'Haverá um starburst de novas estrelas?',
    'Por que as caudas de maré se formam?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-md shadow-cyan-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>IA Astrofísica Teórica</span>
                {usingFallback ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    PINN Neural Surrogate Local
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Gemini 3.8 Flash
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Interpretação física em tempo real, ressonância orbital e modelo preditivo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Tópicos:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => runAnalysis(q)}
              disabled={loading}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap transition disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs font-mono">Processando dinâmica N-corpos e tensores gravitacionais...</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              {analysisText.split('\n\n').map((paragraph, i) => {
                if (paragraph.startsWith('### ')) {
                  return <h3 key={i} className="text-sm font-bold text-cyan-400 mt-2">{paragraph.replace('### ', '')}</h3>;
                }
                if (paragraph.startsWith('#### ')) {
                  return <h4 key={i} className="text-xs font-bold text-amber-300 mt-3">{paragraph.replace('#### ', '')}</h4>;
                }
                return (
                  <p key={i} className="text-slate-300">
                    {paragraph}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/70 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Validação teórica apoiada em artigos de Toomre (1972) e modelos de halo NFW / Hernquist.
          </span>
          <button
            onClick={() => runAnalysis()}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Atualizar Análise</span>
          </button>
        </div>
      </div>
    </div>
  );
};
