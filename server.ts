import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API route for AI Astrophysical Analysis using Gemini
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { scenarioData, physicalMetrics } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'Chave GEMINI_API_KEY não configurada. Usando modelo substituto de física local.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    
    const userQuestionClause = req.body.question 
      ? `\n\nPergunta Específica do Usuário: "${req.body.question}"\nPor favor, responda com foco especial nesta dúvida após sua análise técnica.` 
      : '';

    const prompt = `Você é um astrofísico teórico sênior especialista em dinâmica galáctica N-corpos e fusões de galáxias.
Analise a seguinte simulação de colisão galáctica com base nos parâmetros físicos extraídos:

Cenário: ${scenarioData.name || scenarioData.title || 'Personalizado'}
- Galáxia Primária: Massa = ${scenarioData.galaxy1.mass} x 10^10 M☉, Raio = ${scenarioData.galaxy1.radius} kpc, Tipo = ${scenarioData.galaxy1.type}
- Galáxia Secundária: Massa = ${scenarioData.galaxy2.mass} x 10^10 M☉, Raio = ${scenarioData.galaxy2.radius} kpc, Tipo = ${scenarioData.galaxy2.type}
- Parâmetro de Impacto (b): ${physicalMetrics.impactParameter} kpc
- Velocidade Relativa Inicial: ${physicalMetrics.relativeVelocity} km/s
- Razão de Massas (q = M2/M1): ${physicalMetrics.massRatio}
- Energia Orbital Total: ${physicalMetrics.totalEnergy} unidades
- Momento Angular Específico: ${physicalMetrics.angularMomentum} kpc*km/s
- Raio de Maré de Roche: ~${physicalMetrics.tidalRadius} kpc
- Fricção Dinâmica (Chandrasekhar): Estimada em ${physicalMetrics.dynFrictionMag} km/s/Myr${userQuestionClause}

Forneça uma análise técnica estruturada em português contendo:
1. **Classificação do Encontro**: (Ex: Fusão maior prógrada, Encontro parabólico rápido, Canibalismo galáctico menor, Colisão frontal criadora de anéis).
2. **Previsão de Morfologia Remanescente**: (Ex: Galáxia elíptica relaxada E3-E4, Galáxia espiral com caudas de maré assimétricas tipo 'Camundongos', Galáxia anular tipo Cartwheel).
3. **Escala de Tempo de Coalescência**: Estimativa de tempo até a fusão completa dos buracos negros centrais (em milhões de anos / Myr).
4. **Impacto na Taxa de Formação Estelar (SFR)**: Efeito de compressão de gás interestelar e choques hidrodinâmicos (gatilho de starbursts).
5. **Recomendações Observacionais**: Quais telescópios (JWST, Hubble, ALMA) observariam estruturas semelhantes no universo local ou de alto redshift.

Seja direto, rigoroso com termos astrofísicos reais e didático. Formate com subtítulos limpos e pontos objetivos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.status(200).json({
      success: true,
      analysis: response.text
    });
  } catch (error: any) {
    console.error('Erro na análise Gemini:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar análise astrofísica.'
    });
  }
});

// Configure Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌌 AstroCollision Server rodando em http://localhost:${PORT}`);
  });
}

startServer();
