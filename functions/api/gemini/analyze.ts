/**
 * Cloudflare Pages Function: /api/gemini/analyze
 * Serverless Edge Function executing on Cloudflare's global network
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function onRequestPost(context: { request: Request; env: Record<string, string> }) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { request, env } = context;
    const apiKey = env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          message: 'Chave GEMINI_API_KEY não configurada no Cloudflare Pages. Usando modelo neural físico local.',
        }),
        { status: 200, headers }
      );
    }

    const body = await request.json() as any;
    const { scenarioData, physicalMetrics, question } = body;

    const userQuestionClause = question
      ? `\n\nPergunta Específica do Usuário: "${question}"\nPor favor, responda com foco especial nesta dúvida após sua análise técnica.`
      : '';

    const prompt = `Você é um astrofísico teórico sênior especialista em dinâmica galáctica N-corpos e fusões de galáxias.
Analise a seguinte simulação de colisão galáctica com base nos parâmetros físicos extraídos:

Cenário: ${scenarioData?.name || scenarioData?.title || 'Personalizado'}
- Galáxia Primária: Massa = ${scenarioData?.galaxy1?.mass} x 10^10 M☉, Raio = ${scenarioData?.galaxy1?.radius} kpc, Tipo = ${scenarioData?.galaxy1?.type}
- Galáxia Secundária: Massa = ${scenarioData?.galaxy2?.mass} x 10^10 M☉, Raio = ${scenarioData?.galaxy2?.radius} kpc, Tipo = ${scenarioData?.galaxy2?.type}
- Parâmetro de Impacto (b): ${physicalMetrics?.impactParameter} kpc
- Velocidade Relativa Inicial: ${physicalMetrics?.relativeVelocity} km/s
- Razão de Massas (q = M2/M1): ${physicalMetrics?.massRatio}
- Energia Orbital Total: ${physicalMetrics?.totalEnergy} unidades
- Momento Angular Específico: ${physicalMetrics?.angularMomentum} kpc*km/s
- Raio de Maré de Roche: ~${physicalMetrics?.tidalRadius} kpc
- Fricção Dinâmica (Chandrasekhar): Estimada em ${physicalMetrics?.dynFrictionMag} km/s/Myr${userQuestionClause}

Forneça uma análise técnica estruturada em português contendo:
1. **Classificação do Encontro**: (Ex: Fusão maior prógrada, Encontro parabólico rápido, Canibalismo galáctico menor, Colisão frontal criadora de anéis).
2. **Previsão de Morfologia Remanescente**: (Ex: Galáxia elíptica relaxada E3-E4, Galáxia espiral com caudas de maré assimétricas tipo 'Camundongos', Galáxia anular tipo Cartwheel).
3. **Escala de Tempo de Coalescência**: Estimativa de tempo até a fusão completa dos buracos negros centrais (em milhões de anos / Myr).
4. **Impacto na Taxa de Formação Estelar (SFR)**: Efeito de compressão de gás interestelar e choques hidrodinâmicos (gatilho de starbursts).
5. **Recomendações Observacionais**: Quais telescópios (JWST, Hubble, ALMA) observariam estruturas semelhantes no universo local ou de alto redshift.

Seja direto, rigoroso com termos astrofísicos reais e didático. Formate com subtítulos limpos e pontos objetivos.`;

    // Direct HTTP request to Google GenAI REST API compatible with Cloudflare Workers runtime
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return new Response(
        JSON.stringify({
          success: false,
          fallback: true,
          error: `Erro na API Gemini: ${response.status}`,
        }),
        { status: 200, headers }
      );
    }

    const data = await response.json() as any;
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({
        success: true,
        analysis: generatedText,
      }),
      { status: 200, headers }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        fallback: true,
        error: error.message || 'Erro ao processar análise no Cloudflare Edge.',
      }),
      { status: 200, headers }
    );
  }
}
