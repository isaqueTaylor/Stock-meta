import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, ThinkingLevel } from "@google/genai";

function getValidMimeType(fileName: string, rawMimeType?: string): string {
  if (rawMimeType && typeof rawMimeType === 'string' && rawMimeType.startsWith('image/')) {
    if (rawMimeType === 'image/x-png') return 'image/png';
    if (rawMimeType === 'image/pjpeg' || rawMimeType === 'image/jpg') return 'image/jpeg';
    return rawMimeType;
  }
  if (rawMimeType && typeof rawMimeType === 'string' && rawMimeType.startsWith('video/')) {
    return rawMimeType;
  }
  const ext = (fileName || '').toLowerCase().split('.').pop() || '';
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'svg': return 'image/svg+xml';
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'webm': return 'video/webm';
    default: return 'image/png';
  }
}

function repairJson(jsonStr: string): string {
  let cleaned = jsonStr.trim();

  if (!cleaned) return cleaned;

  // Remove markdown code blocks if present
  const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleaned.match(markdownRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // 1. Repair unescaped double quotes in "title": "value"
  // Look for the title key and capture its string value.
  // The value is bounded by a starting " and ends with a " followed by a comma, newline, or closing brace.
  const titleRegex = /("title"\s*:\s*")([\s\S]*?)("\s*(?:,|\n|\s*\}))/;
  const titleMatch = cleaned.match(titleRegex);
  if (titleMatch) {
    const prefix = titleMatch[1];
    const value = titleMatch[2];
    const suffix = titleMatch[3];
    
    // Escape all double quotes inside the value that are not already escaped.
    let escapedValue = "";
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '"') {
        if (i > 0 && value[i - 1] === '\\') {
          escapedValue += '"';
        } else {
          escapedValue += '\\"';
        }
      } else {
        escapedValue += value[i];
      }
    }
    cleaned = cleaned.replace(titleRegex, prefix + escapedValue + suffix);
  }

  // 2. Repair unescaped double quotes in keywords array items
  const keywordsRegex = /("keywords"\s*:\s*\[)([\s\S]*?)(\s*\])/;
  const keywordsMatch = cleaned.match(keywordsRegex);
  if (keywordsMatch) {
    const prefix = keywordsMatch[1];
    const arrayContent = keywordsMatch[2];
    const suffix = keywordsMatch[3];

    // Split by commas representing array item dividers
    const items = arrayContent.split(/\s*,\s*/);
    const sanitizedItems = items.map(item => {
      let trimmed = item.trim();
      if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
        let val = trimmed.slice(1, -1);
        let escapedVal = "";
        for (let i = 0; i < val.length; i++) {
          if (val[i] === '"') {
            if (i > 0 && val[i - 1] === '\\') {
              escapedVal += '"';
            } else {
              escapedVal += '\\"';
            }
          } else {
            escapedVal += val[i];
          }
        }
        return `"${escapedVal}"`;
      }
      return trimmed;
    });
    cleaned = cleaned.replace(keywordsRegex, prefix + sanitizedItems.join(', ') + suffix);
  }

  // 3. Count braces/brackets to automatically close truncated or cut-off JSON structures
  let openBraces = 0;
  let closeBraces = 0;
  let openBrackets = 0;
  let closeBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') closeBraces++;
      else if (char === '[') openBrackets++;
      else if (char === ']') closeBrackets++;
    }
  }

  // If the model finished mid-string, close the string quote
  if (inString) {
    cleaned += '"';
    inString = false;
  }

  // Close brackets first, then close braces
  if (openBrackets > closeBrackets) {
    cleaned += ']'.repeat(openBrackets - closeBrackets);
  }
  if (openBraces > closeBraces) {
    cleaned += '}'.repeat(openBraces - closeBraces);
  }

  return cleaned;
}

const ADOBE_STOCK_CATEGORY_MAP: Record<number, string> = {
  1: "Animais",
  2: "Edifícios e Arquitetura",
  3: "Negócios",
  4: "Bebidas",
  5: "Meio ambiente",
  6: "Estados de espírito e pessoas",
  7: "Comida",
  8: "Recursos Gráficos",
  9: "Hobbies e lazer",
  10: "Indústria",
  11: "Paisagens",
  12: "Estilo de vida",
  13: "Pessoas",
  14: "Plantas e flores",
  15: "Cultura e religião",
  16: "Ciência",
  17: "Questões sociais",
  18: "Esportes",
  19: "Tecnologia",
  20: "Transporte",
  21: "Viagens",
};

function parseRobustJson(text: string): { title: string; keywords: string[]; category?: number; categoryName?: string } {
  if (!text || !text.trim()) {
    throw new Error("Resposta de texto vazia recebida da Inteligência Artificial.");
  }
  
  let clean = text.trim();
  // Remove markdown code fences
  clean = clean.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();

  let repaired = repairJson(clean);
  let parsedObj: any = null;

  try {
    parsedObj = JSON.parse(repaired);
  } catch (firstError) {
    const firstBrace = repaired.indexOf('{');
    const lastBrace = repaired.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = repaired.substring(firstBrace, lastBrace + 1);
      try {
        parsedObj = JSON.parse(extracted);
      } catch (secondError) {
        // Fall back to broader parsing
      }
    }
  }

  // Handle array of objects e.g. [{ title, keywords }]
  if (Array.isArray(parsedObj) && parsedObj.length > 0) {
    parsedObj = parsedObj[0];
  }

  // Handle nested wrapper properties e.g. { data: { title, keywords } }
  if (parsedObj && typeof parsedObj === 'object') {
    if (parsedObj.data && typeof parsedObj.data === 'object' && !Array.isArray(parsedObj.data)) {
      parsedObj = parsedObj.data;
    } else if (parsedObj.metadata && typeof parsedObj.metadata === 'object' && !Array.isArray(parsedObj.metadata)) {
      parsedObj = parsedObj.metadata;
    } else if (parsedObj.result && typeof parsedObj.result === 'object' && !Array.isArray(parsedObj.result)) {
      parsedObj = parsedObj.result;
    }
  }

  let rawTitle = "";
  let rawKeywords: any[] = [];
  let extractedCategory: number | undefined = undefined;

  if (parsedObj && typeof parsedObj === 'object') {
    // Extract title supporting varied naming conventions
    const candidateTitle = parsedObj.title || parsedObj.titulo || parsedObj.título || 
                           parsedObj.name || parsedObj.headline || parsedObj.caption || 
                           parsedObj.description || parsedObj.summary;
    if (typeof candidateTitle === 'string' && candidateTitle.trim()) {
      rawTitle = candidateTitle.trim();
    }

    // Extract keywords supporting varied naming conventions
    const candidateKeywords = parsedObj.keywords || parsedObj.palavras_chave || parsedObj.palavrasChave || 
                              parsedObj.palavras_chaves || parsedObj['palavras-chave'] || 
                              parsedObj.tags || parsedObj.tag || parsedObj.tagList || parsedObj.key_words;
    if (Array.isArray(candidateKeywords)) {
      rawKeywords = candidateKeywords;
    } else if (typeof candidateKeywords === 'string' && candidateKeywords.trim()) {
      rawKeywords = candidateKeywords.split(/[,;\n]/).map((k: string) => k.trim()).filter(Boolean);
    }

    // Extract Adobe Stock category (1-21)
    let candidateCategory = parsedObj.category || parsedObj.categoria || parsedObj.categoryId || parsedObj.category_id;
    if (typeof candidateCategory === 'string') {
      const match = candidateCategory.match(/\d+/);
      if (match) candidateCategory = parseInt(match[0], 10);
    }
    if (typeof candidateCategory === 'number' && candidateCategory >= 1 && candidateCategory <= 21) {
      extractedCategory = candidateCategory;
    }
  }

  // Fallback 1: Regex extraction for JSON / key-value patterns
  if (!rawTitle || rawKeywords.length === 0 || !extractedCategory) {
    const titleMatch = text.match(/"(?:title|titulo|título|headline|name)"\s*:\s*"((?:[^"\\]|\\.)*)"/i) ||
                       text.match(/(?:\*\*|\b)(?:Title|Título|Titulo|Headline)(?:\*\*|:)\s*["']?([^\n\r"]+)["']?/i);
    if (!rawTitle && titleMatch) {
      rawTitle = titleMatch[1].replace(/\\"/g, '"').trim();
    }

    const keywordsMatch = text.match(/"(?:keywords|palavras_chave|palavrasChave|tags)"\s*:\s*\[([\s\S]*?)\]/i) ||
                          text.match(/(?:\*\*|\b)(?:Keywords|Palavras-chave|Palavras Chave|Tags)(?:\*\*|:)\s*\[?([^\n\r\]]+)\]?/i);
    if (rawKeywords.length === 0 && keywordsMatch) {
      rawKeywords = keywordsMatch[1]
        .split(/[,;\n]/)
        .map(k => k.replace(/["'\[\]\r\n\t]/g, '').trim())
        .filter(k => k.length > 0);
    }

    if (!extractedCategory) {
      const catMatch = text.match(/"(?:category|categoria|category_id|categoryId)"\s*:\s*(\d+)/i) ||
                       text.match(/(?:categoria|category)\s*:\s*(\d+)/i);
      if (catMatch) {
        const val = parseInt(catMatch[1], 10);
        if (val >= 1 && val <= 21) extractedCategory = val;
      }
    }
  }

  // Fallback 2: Text-line heuristic scanner
  if (!rawTitle || rawKeywords.length === 0) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!rawTitle && (line.toLowerCase().startsWith('title:') || line.toLowerCase().startsWith('título:'))) {
        rawTitle = line.replace(/^(?:title|título):\s*/i, '').replace(/^["']|["']$/g, '').trim();
      }
      if (rawKeywords.length === 0 && (line.toLowerCase().startsWith('keywords:') || line.toLowerCase().startsWith('palavras-chave:'))) {
        rawKeywords = line
          .replace(/^(?:keywords|palavras-chave):\s*/i, '')
          .split(/[,;]/)
          .map(k => k.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean);
      }
    }
  }

  // Normalize keywords array
  const cleanKeywords: string[] = [];
  for (const item of rawKeywords) {
    if (typeof item === 'string') {
      const parts = item.split(/[,;]/).map(p => p.trim().toLowerCase().replace(/^["']|["']$/g, '')).filter(Boolean);
      cleanKeywords.push(...parts);
    } else if (item && typeof item === 'object') {
      const val = item.name || item.keyword || item.tag || item.value || '';
      if (val && typeof val === 'string') {
        cleanKeywords.push(val.trim().toLowerCase());
      }
    }
  }

  let finalTitle = rawTitle.replace(/^["']|["']$/g, '').trim();
  // Limite estrito de 200 caracteres exigido pelo Adobe Stock
  if (finalTitle.length > 200) {
    const sliced = finalTitle.slice(0, 197);
    const lastSpace = sliced.lastIndexOf(' ');
    finalTitle = (lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim();
  }

  // Limite máximo de 49 palavras-chave suportadas pelo Adobe Stock
  let uniqueKeywords = Array.from(new Set(cleanKeywords)).filter(k => k.length > 0);
  if (uniqueKeywords.length > 49) {
    uniqueKeywords = uniqueKeywords.slice(0, 49);
  }

  // Categoria padrão caso a IA não tenha retornado um número de 1 a 21
  const finalCategory = extractedCategory || 8; // 8 = Recursos Gráficos
  const finalCategoryName = ADOBE_STOCK_CATEGORY_MAP[finalCategory] || "Recursos Gráficos";

  // Se ainda estiver faltando título ou palavras-chave, deriva de forma inteligente
  if (!finalTitle && uniqueKeywords.length > 0) {
    const derivedTitle = uniqueKeywords.slice(0, 5).join(' ');
    return {
      title: derivedTitle.charAt(0).toUpperCase() + derivedTitle.slice(1),
      keywords: uniqueKeywords,
      category: finalCategory,
      categoryName: finalCategoryName,
    };
  }

  if (finalTitle && uniqueKeywords.length === 0) {
    const derivedKeywords = finalTitle
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter(w => w.length > 2 && !['para', 'com', 'que', 'uma', 'dos', 'das', 'and', 'the', 'for', 'with'].includes(w));
    return {
      title: finalTitle,
      keywords: Array.from(new Set(derivedKeywords)).slice(0, 20),
      category: finalCategory,
      categoryName: finalCategoryName,
    };
  }

  if (!finalTitle && uniqueKeywords.length === 0) {
    console.error("Texto bruto recebido da IA que não continha metadados identificáveis:", text);
    return {
      title: "Commercial High-Resolution Stock Creative Media",
      keywords: ["commercial", "stock", "high quality", "creative", "design", "media", "illustration", "photo"],
      category: 8,
      categoryName: "Recursos Gráficos",
    };
  }

  return {
    title: finalTitle,
    keywords: uniqueKeywords.length > 0 ? uniqueKeywords : ["stock", "commercial", "high quality", "media"],
    category: finalCategory,
    categoryName: finalCategoryName,
  };
}

const STOCK_SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];

function getResponseText(response: any): string {
  if (!response) return "";

  // 1. Acesso direto à propriedade/getter .text do GenerateContentResponse
  try {
    if (typeof response.text === 'string' && response.text.trim()) {
      return response.text.trim();
    }
    if (typeof response.text === 'function') {
      const res = response.text();
      if (typeof res === 'string' && res.trim()) return res.trim();
    }
  } catch (e) {}

  // 2. Extração profunda inspecionando candidates e parts
  try {
    const candidates = response.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
      for (const candidate of candidates) {
        const parts = candidate?.content?.parts;
        if (Array.isArray(parts) && parts.length > 0) {
          // A) Prioriza partes de texto fora do bloco de pensamento
          const nonThought = parts
            .filter((p: any) => !p.thought && typeof p?.text === 'string' && p.text.trim())
            .map((p: any) => p.text.trim());
          if (nonThought.length > 0) {
            return nonThought.join("\n").trim();
          }

          // B) Partes de texto com thought se for a única disponível
          const anyText = parts
            .map((p: any) => (typeof p?.text === 'string' ? p.text.trim() : (typeof p === 'string' ? p.trim() : '')))
            .filter((t: string) => t.length > 0);
          if (anyText.length > 0) {
            return anyText.join("\n").trim();
          }
        }
      }
    }
  } catch (e) {
    console.error("Erro ao inspecionar candidates:", e);
  }

  // 3. Verificação em wrapper aninhado
  try {
    if (response.response) {
      const nested = getResponseText(response.response);
      if (nested) return nested;
    }
  } catch (e) {}

  return "";
}

const FALLBACK_CHAIN: Record<string, string> = {
  'gemini-3.8-flash': 'gemini-flash-latest',
  'gemini-flash-latest': 'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite': 'gemini-3.8-flash',
  'gemini-3.7-flash': 'gemini-3.8-flash'
};

async function generateContentWithRetry(
  geminiAi: GoogleGenAI,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<any> {
  let attempt = 0;
  let currentModel = params.model;
  let currentConfig: any = {
    ...params.config,
    safetySettings: STOCK_SAFETY_SETTINGS
  };

  while (true) {
    try {
      const configToSend = { ...currentConfig };
      if (!currentModel.startsWith('gemini-3')) {
        delete configToSend.thinkingConfig;
      }

      const currentParams = { ...params, model: currentModel, config: configToSend };
      const response = await geminiAi.models.generateContent(currentParams);
      const text = getResponseText(response);
      
      if (!text) {
        const candidate = response?.candidates?.[0];
        const finishReason = candidate?.finishReason || 'EMPTY_OUTPUT';
        console.warn(`[Gemini API] Resposta sem texto direto (${finishReason}) no modelo ${currentModel}.`);
        
        // Se responseSchema estava ativo e retornou vazio, tenta com JSON puro sem schema estrito
        if (currentConfig.responseSchema) {
          console.warn(`[Gemini API] Tentando sem responseSchema no modelo ${currentModel}...`);
          const { responseSchema, ...restConfig } = currentConfig;
          currentConfig = {
            ...restConfig,
            responseMimeType: "application/json"
          };
          attempt++;
          await new Promise(r => setTimeout(r, 300));
          continue;
        }

        if (attempt < maxRetries) {
          const fallback = FALLBACK_CHAIN[currentModel] || 'gemini-flash-latest';
          console.warn(`[Gemini API] Alternando para modelo alternativo: ${fallback}...`);
          currentModel = fallback;
          attempt++;
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
        
        throw new Error(`A Inteligência Artificial retornou uma resposta sem conteúdo textual (${finishReason}).`);
      }
      return response;
    } catch (err: any) {
      const errStr = err.message || "";
      const isDailyQuotaExceeded = errStr.includes("RequestsPerDay") || 
                                   errStr.includes("limit: 20") || 
                                   errStr.includes("GenerateRequestsPerDay");
                                   
      const isRateLimit = err.status === 429 || 
                          errStr.includes("429") || 
                          errStr.includes("Quota exceeded") ||
                          errStr.includes("RESOURCE_EXHAUSTED");
                          
      const isTransient = err.status === 503 || err.status === 500 ||
                          errStr.includes("503") ||
                          errStr.includes("500") ||
                          errStr.includes("UNAVAILABLE") ||
                          errStr.includes("temporary") ||
                          errStr.includes("high demand") ||
                          errStr.includes("sem conteúdo textual");

      if (isDailyQuotaExceeded || (isRateLimit && errStr.includes("limit: 20"))) {
        const fallback = FALLBACK_CHAIN[currentModel] || 'gemini-flash-latest';
        if (fallback && fallback !== currentModel) {
          console.warn(`[Gemini API] Limite de cota atingido em ${currentModel}. Mudando para ${fallback}...`);
          currentModel = fallback;
          attempt = 0;
          continue;
        }
      }

      attempt++;
      
      if ((isRateLimit || isTransient) && attempt <= maxRetries) {
        if (attempt === maxRetries) {
          const fallback = FALLBACK_CHAIN[currentModel] || 'gemini-flash-latest';
          if (fallback && fallback !== currentModel) {
            console.warn(`[Gemini API] Falhas consecutivas no modelo ${currentModel}. Tentando modelo reserva: ${fallback}...`);
            currentModel = fallback;
            attempt = 0;
            continue;
          }
        }
        
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`[Gemini API] Quota ou erro temporário (${err.status || 'erro'}) no modelo ${currentModel}. Tentativa ${attempt}/${maxRetries} em ${Math.round(delay)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      if (isDailyQuotaExceeded || isRateLimit) {
        throw new Error(
          `Limite de requisições do Gemini atingido. Detalhes: ${err.message}. ` +
          `Dica: Insira sua própria Chave de API (API Key) do Gemini no painel de configurações (Settings > Secrets) para obter limites de uso muito mais altos.`
        );
      }
      throw err;
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Aumenta o limite de payload para suportar o upload de imagens/vídeos em Base64
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API de health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route para proxy do Gemini ou DeepSeek
  app.post("/api/generate", async (req, res) => {
    try {
      const { base64Data, mimeType, fileName, options = {}, geminiKey, deepseekKey } = req.body || {};

      if (!base64Data) {
        return res.status(400).json({ error: "Dados da mídia em base64 não fornecidos." });
      }

      const safeOptions = {
        provider: options?.provider || "gemini",
        language: options?.language || "pt-BR",
        keywordCount: typeof options?.keywordCount === 'number' && options.keywordCount > 0 ? options.keywordCount : 30,
        titleLength: options?.titleLength || "medium",
        includeTransparentBackground: Boolean(options?.includeTransparentBackground),
        includeWhiteBackground: Boolean(options?.includeWhiteBackground)
      };

      const cleanBase64 = typeof base64Data === 'string' && base64Data.includes(',')
        ? base64Data.split(',')[1].trim()
        : String(base64Data || '').trim();

      const normalizedMimeType = getValidMimeType(fileName || '', mimeType);

      const useDeepSeek = safeOptions.provider === "deepseek";

      // Adota a chave do cliente se fornecida, ou assume os fallbacks do servidor / variáveis de ambiente
      const geminiApiKeyToUse = geminiKey || process.env.GEMINI_API_KEY;
      const deepseekApiKeyToUse = deepseekKey || process.env.DEEPSEEK_API_KEY;

      if (!geminiApiKeyToUse) {
        return res.status(401).json({ 
          error: "Chave de API do Google Gemini não fornecida. É necessário possuir uma chave do Gemini ativa (seja sua própria inserida no Gerenciador de Chaves ou a padrão do servidor) para realizar a descrição e análise visual do arquivo de mídia." 
        });
      }

      if (useDeepSeek && !deepseekApiKeyToUse) {
        return res.status(401).json({
          error: "Chave de API do DeepSeek não fornecida. Insira sua chave do DeepSeek no painel de configurações para utilizar este motor de IA."
        });
      }

      const geminiAi = new GoogleGenAI({
        apiKey: geminiApiKeyToUse,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const isVideo = normalizedMimeType.startsWith('video/');
      const isSVG = (fileName || '').toLowerCase().endsWith('.svg');
      
      let mediaTypeInstruction = "esta imagem";
      let specificKeywordsInstruction = "";

      if (isSVG) {
        mediaTypeInstruction = "esta pré-visualização de um arquivo gráfico vetorial (SVG). O arquivo original é escalável.";
        specificKeywordsInstruction = "OBRIGATÓRIO incluir as seguintes palavras-chave de vetor: 'vector', 'svg', 'illustration', 'graphic', 'design', 'art', 'scalable', 'drawing'.";
      } else if (isVideo) {
        mediaTypeInstruction = "este arquivo de vídeo (footage/clip)";
        specificKeywordsInstruction = "Inclua palavras-chave técnicas de vídeo se aplicável: '4k', 'HD', 'motion', 'video', 'clip', 'footage', 'animation'.";
      }

      let backgroundInstruction = "";
      if (safeOptions.includeTransparentBackground) {
        backgroundInstruction = ' OBRIGATÓRIO: A imagem está isolada em fundo transparente. Você DEVE adicionar a expressão "isolado em fundo transparente" (ou a tradução literal para o idioma solicitado, como "isolated on transparent background") exatamente no FINAL do título. Além disso, as palavras-chave devem conter termos relacionados como "isolado", "fundo transparente" e "recorte".';
      } else if (safeOptions.includeWhiteBackground) {
        backgroundInstruction = ' OBRIGATÓRIO: A imagem é um elemento isolado sobre fundo branco puro. Você DEVE adicionar a expressão "isolado em fundo branco" (ou a tradução literal para o idioma solicitado, como "isolated on white background") exatamente no FINAL do título. Além disso, as palavras-chave devem conter termos relacionados como "isolado", "fundo branco", "isolado em fundo branco" e "recorte".';
      }

      const titleLengthMap: Record<string, string> = {
        short: 'curto e direto (até 50 caracteres)',
        medium: 'descritivo de comprimento médio (até 100 caracteres)',
        long: 'detalhado e otimizado para SEO, com o máximo de 200 caracteres, que é o limite do Adobe Stock',
      };

      const titleLenInstruction = titleLengthMap[safeOptions.titleLength] || titleLengthMap.medium;

      if (useDeepSeek) {
        // --- FLUXO HÍBRIDO DE CONVERSÃO: GEMINI VISION + DEEPSEEK COPYWRITING ---
        const visionPrompt = `Describe this stock resource objectively in detail for an SEO tagging system. Keep it short (2-3 sentences), mentioning the subjects, styles, lighting, concept, background and main details. Do not use advertising slogans, subjective praise, or pricing words. Just describe what is visible.`;

        let visionResponse;
        try {
          visionResponse = await generateContentWithRetry(geminiAi, {
            model: 'gemini-3.8-flash',
            contents: {
              parts: [
                { inlineData: { mimeType: normalizedMimeType, data: cleanBase64 } },
                { text: visionPrompt }
              ],
            }
          });
        } catch (visionErr: any) {
          console.error("Erro na extração visual de suporte com Gemini Flash:", visionErr);
          throw new Error("Falha na etapa de visão e segmentação visual com o Gemini: " + (visionErr.message || visionErr));
        }

        const visualDescription = getResponseText(visionResponse).trim() || "Unknown objects";

        const deepseekPrompt = `Você é um especialista em SEO de imagens e recursos de stock comerciais para agências de publicidade e design.
Gere metadados comerciais excepcionais otimizados para Adobe Stock no idioma "${safeOptions.language}".

Descrição visual exata dos dados do arquivo lida pelo sensor óptico: "${visualDescription}".
Contexto e tipo do arquivo original enviado: ${mediaTypeInstruction}.

Requisitos do Adobe Stock:
1. Título: ${titleLenInstruction}. Deve ser comercial, chamativo e descrever o conteúdo principal com precisão de termos procurados para SEO. Limite rígido: NUNCA ultrapasse 200 caracteres.
2. Palavras-chave: Gere exatamente ${safeOptions.keywordCount} tags únicas (máximo 49). Ordene estritamente por relevância de alcance comercial (da mais importante para a menos importante).
3. Categoria Oficial do Adobe Stock: Classifique a imagem atribuindo o número inteiro correspondente de 1 a 21 dentre a lista oficial:
   1: Animais | 2: Edifícios e Arquitetura | 3: Negócios | 4: Bebidas | 5: Meio ambiente | 6: Estados de espírito e pessoas | 7: Comida | 8: Recursos Gráficos | 9: Hobbies e lazer | 10: Indústria | 11: Paisagens | 12: Estilo de vida | 13: Pessoas | 14: Plantas e flores | 15: Cultura e religião | 16: Ciência | 17: Questões sociais | 18: Esportes | 19: Tecnologia | 20: Transporte | 21: Viagens.
4. ANTI-REJEIÇÃO & PROPRIEDADE INTELECTUAL: NUNCA mencione marcas registradas, produtos comerciais protegidos ou empresas (ex: Apple, iPhone, Nike, Disney, Marvel, Ferrari, etc.). Sempre use termos genéricos de mercado.
5. ${backgroundInstruction}
6. ${specificKeywordsInstruction}

IMPORTANTE: Não use aspas duplas (") dentro das strings de título ou palavras-chave para evitar quebrar a estrutura do JSON. Se for necessário usar aspas ou destacar algo, use apenas aspas simples (').

Você DEVE retornar a resposta estritamente formatada como um objeto JSON válido, sem tags markdown, sem comentários, no esquema a seguir:
{
  "title": "sua string de título",
  "keywords": ["tag1", "tag2", "tag3"],
  "category": 8
}`;

        let dsResponse;
        try {
          dsResponse = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepseekApiKeyToUse}`
            },
            body: JSON.stringify({
              model: "deepseek-v4-flash",
              messages: [
                { 
                  role: "system", 
                  content: "Você é um robô de metadados de stock profissional. Retorne exatamente o JSON solicitado contendo 'title', 'keywords' e 'category'." 
                },
                { 
                  role: "user", 
                  content: deepseekPrompt 
                }
              ],
              response_format: { type: "json_object" },
              temperature: 0.35,
              max_tokens: 1500
            })
          });
        } catch (dsErr: any) {
          console.error("Erro de rede na API DeepSeek:", dsErr);
          throw new Error("Erro de conexão na transmissão para o DeepSeek: " + (dsErr.message || dsErr));
        }

        if (!dsResponse.ok) {
          const errMsg = await dsResponse.text();
          console.error("Erro HTTP retornado pela API do DeepSeek:", dsResponse.status, errMsg);
          throw new Error(`O servidor do DeepSeek retornou o erro ${dsResponse.status}: ${errMsg}`);
        }

        const dsResult = await dsResponse.json();
        const dsText = dsResult.choices?.[0]?.message?.content || "";
        const parsedData = parseRobustJson(dsText);
        return res.json(parsedData);

      } else {
        // --- FLUXO INTEGRADO: GOOGLE GEMINI 3.7 FLASH MULTIMODAL ---
        const prompt = `Gere metadados (título de alta qualidade, palavras-chave comerciais e categoria oficial) otimizados para Adobe Stock no idioma "${safeOptions.language}".
  
Contexto do arquivo: ${mediaTypeInstruction}.

Requisitos:
1. Título: ${titleLenInstruction}. Limite estrito de no máximo 200 caracteres (requisito de aprovação da Adobe). Deve ser comercial, descritivo e sem pontuação excessiva.
2. Palavras-chave: Gere exatamente ${safeOptions.keywordCount} tags únicas (máximo 49 tags). Ordene estritamente por relevância comercial (da mais importante para a menos importante).
3. Categoria Oficial do Adobe Stock: Identifique a melhor categoria numérica oficial de 1 a 21:
   1: Animais | 2: Edifícios e Arquitetura | 3: Negócios | 4: Bebidas | 5: Meio ambiente | 6: Estados de espírito e pessoas | 7: Comida | 8: Recursos Gráficos | 9: Hobbies e lazer | 10: Indústria | 11: Paisagens | 12: Estilo de vida | 13: Pessoas | 14: Plantas e flores | 15: Cultura e religião | 16: Ciência | 17: Questões sociais | 18: Esportes | 19: Tecnologia | 20: Transporte | 21: Viagens.
4. ANTI-REJEIÇÃO & COMPLIANCE: NUNCA inclua marcas registradas ou nomes comerciais protegidos (ex: Apple, iPhone, Nike, Disney, Marvel, Ferrari). Use sempre termos genéricos.
5. ${backgroundInstruction}
6. ${specificKeywordsInstruction}

IMPORTANTE: Não use aspas duplas (") dentro das strings de título ou palavras-chave para evitar quebrar a estrutura do JSON. Se for necessário usar aspas ou destacar algo, use apenas aspas simples (').

Saída apenas em JSON puro com chaves "title", "keywords" e "category".`;

        const parts: any[] = [
          { inlineData: { mimeType: normalizedMimeType, data: cleanBase64 } },
          { text: prompt }
        ];

        const responseSchema = {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "O título comercial otimizado da imagem/vídeo para Adobe Stock (máximo de 200 caracteres, sem marcas registradas).",
            },
            keywords: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Lista de tags/palavras-chave comerciais ordenadas por maior relevância.",
            },
            category: {
              type: Type.INTEGER,
              description: "O número da categoria oficial do Adobe Stock de 1 a 21 correspondente ao tema da imagem.",
            },
          },
          required: ["title", "keywords", "category"],
        };

        const response = await generateContentWithRetry(geminiAi, {
          model: 'gemini-3.8-flash',
          contents: {
            parts: parts,
          },
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.4,
          },
        });

        const rawText = getResponseText(response);
        const parsedData = parseRobustJson(rawText);
        return res.json(parsedData);
      }

    } catch (e: any) {
      console.error("Erro no processamento da IA no backend:", e);
      let message = "Falha ao processar metadados com Inteligência Artificial.";
      if (e.message) {
        message = e.message;
      }
      return res.status(500).json({ error: message });
    }
  });

  // API Route para Gerador de Prompts Comerciais para Adobe Stock
  app.post("/api/generate-prompts", async (req, res) => {
    try {
      const {
        idea,
        tool = 'midjourney',
        genre = 'photo',
        aspectRatio = '16:9',
        lighting = '',
        composition = '',
        copySpace = false,
        isolatedWhite = false,
        variationCount = 3,
        customInstructions = '',
        geminiKey,
        deepseekKey
      } = req.body || {};

      if (!idea || typeof idea !== 'string' || !idea.trim()) {
        return res.status(400).json({ error: "Por favor, informe a ideia ou tema do prompt a ser gerado." });
      }

      const geminiApiKeyToUse = geminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKeyToUse) {
        return res.status(401).json({ 
          error: "Chave de API do Google Gemini não fornecida. Insira sua chave no painel de configurações ou utilize a chave do servidor." 
        });
      }

      const geminiAi = new GoogleGenAI({
        apiKey: geminiApiKeyToUse,
        httpOptions: {
          timeout: 45000,
        }
      });

      const count = Math.min(Math.max(Number(variationCount) || 3, 1), 20);

      const systemPrompt = `Você é um Diretor de Arte e Engenheiro de Prompts sênior especializado em microstock comercial para o Adobe Stock, Shutterstock e Getty Images.
Sua missão é gerar exatamente ${count} variações de prompts de altíssimo valor comercial e prontos para geração em IA com base nas palavras-chave e ideia do usuário.
Cada uma das ${count} variações deve explorar um ângulo, iluminação, enquadramento ou abordagem comercial DIFERENTE a partir dessas palavras, oferecendo variedade real para o colaborador do Adobe Stock.

REGRAS DE OURO PARA MICROSTOCK (ADOBE STOCK):
1. UTILIDADE COMERCIAL: Compradores de stock procuram imagens para anúncios, sites, apresentações corporativas, banners e embalagens. Os prompts devem priorizar iluminação profissional, nitidez, apelo comercial e storytelling autêntico.
2. ZERO MARCAS REGISTRADAS (COMPLIANCE RIGOROSO): NUNCA mencione marcas como Apple, iPhone, Nike, Starbucks, Tesla, Sony, Windows, etc. Use descrições genéricas como "modern sleek smartphone with blank screen", "generic modern laptop", "branded minimalist athletic shoes".
3. ESPAÇO PARA TEXTO (COPY SPACE): ${copySpace ? 'OBRIGATÓRIO: O usuário ativou Copy Space. A composição DEVE deixar amplo espaço limpo (negativo) na lateral ou no topo para que designers coloquem títulos publicitários.' : 'Incorpore composições comerciais equilibradas com boa respiração visual.'}
4. FUNDO ISOLADO: ${isolatedWhite ? 'OBRIGATÓRIO: O usuário ativou Fundo Branco Puro. O prompt DEVE especificar "isolated on pure solid white background, high-key studio strobe lighting, crisp clean edges, soft natural drop shadow".' : 'Ambiente e iluminação devem harmonizar com o contexto comercial.'}
5. FERRAMENTA DE DESTINO (${tool.toUpperCase()}):
   - Se Midjourney: Prompt descritivo em inglês + parâmetros ao final: "--ar ${aspectRatio} --style raw --v 6.1 --stylize 100".
   - Se Flux: Prompt descritivo detalhado em inglês em linguagem natural, focando em texturas fotorrealistas e iluminação precisa.
   - Se Nando Banana / Nano Banana: Prompt descritivo em inglês com texturas de alta definição fotográfica, iluminação de estúdio comercial ou luz natural de janela, foco nítido e composição profissional de stock, além dos parâmetros ao final "--aspect ${aspectRatio} --style photorealistic".
   - Se ChatGPT / DALL-E 3: Prompt descritivo completo em inglês em prosa cinematográfica detalhada (estilo DALL-E 3 / ChatGPT), especificando estilo fotográfico fotorrealista comercial de banco de imagens, composição, iluminação e proporção ${aspectRatio} ("Photorealistic commercial stock photo, aspect ratio ${aspectRatio}").
   - Se Firefly: Prompt com descritores de fotografia de estúdio comercial, paleta harmônica e enquadramento limpo.
   - Se Stable Diffusion (SDXL): Prompt positivo em inglês com tags de alta qualidade + prompt negativo detalhado (ex: "blurry, low quality, deformed anatomy, bad hands, watermark, signature, oversaturated, amateur").
6. CATEGORIAS OFICIAIS DO ADOBE STOCK (1 a 21): Associe cada variação à categoria oficial correspondente:
1-Animais, 2-Edifícios e Arquitetura, 3-Negócios, 4-Bebidas, 5-Meio ambiente, 6-Estados de espírito e pessoas, 7-Comida, 8-Recursos Gráficos, 9-Hobbies e lazer, 10-Indústria, 11-Paisagens, 12-Estilo de vida, 13-Natureza, 14-Pessoas, 15-Plantas e flores, 16-Cultura e religião, 17-Ciência, 18-Questões sociais, 19-Tecnologia, 20-Transporte, 21-Viagens.

DADOS DA SOLICITAÇÃO:
- Palavras-chave / Ideia do Usuário: "${idea}"
- Quantidade Solicitada: Exatamente ${count} variações
- Gênero Visual: "${genre}"
- Ferramenta: "${tool}"
- Proporção (Aspect Ratio): "${aspectRatio}"
${lighting ? `- Iluminação Desejada: "${lighting}"` : ''}
${composition ? `- Composição Desejada: "${composition}"` : ''}
${customInstructions ? `- Instruções Adicionais: "${customInstructions}"` : ''}

Retorne SEMPRE e EXCLUSIVAMENTE um objeto JSON válido no formato:
{
  "variations": [
    {
      "id": "var-1",
      "titlePt": "Título comercial explicativo em Português",
      "promptEn": "Prompt principal em inglês com detalhes visuais e cinematográficos",
      "fullPromptWithParams": "Prompt completo com parâmetros de ferramenta incluídos ao final (se aplicável)",
      "tool": "${tool}",
      "aspectRatio": "${aspectRatio}",
      "negativePrompt": "Prompt negativo detalhado (especialmente para SDXL)",
      "category": 3,
      "categoryName": "Negócios",
      "commercialHook": "Explicação em 1 frase de por que essa imagem converte e vende bem no Adobe Stock",
      "hasCopySpace": ${copySpace},
      "isIsolatedWhite": ${isolatedWhite},
      "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8"]
    }
  ]
}`;

      const promptResponse = await generateContentWithRetry(geminiAi, {
        model: 'gemini-3.8-flash',
        contents: {
          parts: [{ text: systemPrompt }]
        },
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const rawText = getResponseText(promptResponse);
      let parsedJson: any = null;
      try {
        const cleaned = repairJson(rawText);
        parsedJson = JSON.parse(cleaned);
      } catch (err) {
        // Fallback regex match para array ou objeto
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedJson = JSON.parse(repairJson(match[0]));
          } catch (e2) {}
        }
      }

      if (!parsedJson || (!Array.isArray(parsedJson.variations) && !Array.isArray(parsedJson))) {
        throw new Error("Não foi possível formatar os prompts gerados em estrutura válida. Tente novamente.");
      }

      const variationsList = Array.isArray(parsedJson.variations) ? parsedJson.variations : parsedJson;

      const sanitizedVariations = variationsList.map((v: any, idx: number) => {
        const catId = typeof v.category === 'number' && v.category >= 1 && v.category <= 21 ? v.category : 8;
        const catName = ADOBE_STOCK_CATEGORY_MAP[catId] || "Recursos Gráficos";
        const promptEn = String(v.promptEn || idea).trim();
        let fullPromptWithParams = String(v.fullPromptWithParams || '').trim();

        if (!fullPromptWithParams) {
          if (tool === 'midjourney') {
            fullPromptWithParams = `${promptEn} --ar ${aspectRatio} --style raw --v 6.1 --stylize 100`;
          } else if (tool === 'nanobanana') {
            fullPromptWithParams = `${promptEn} --aspect ${aspectRatio} --style photorealistic`;
          } else if (tool === 'chatgpt') {
            fullPromptWithParams = `${promptEn} [Aspect ratio: ${aspectRatio}, commercial stock style]`;
          } else {
            fullPromptWithParams = promptEn;
          }
        }

        return {
          id: `var-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          titlePt: String(v.titlePt || `Variação Comercial ${idx + 1}`).trim(),
          promptEn,
          fullPromptWithParams,
          tool: (['midjourney', 'flux', 'nanobanana', 'chatgpt', 'firefly', 'stablediffusion'].includes(v.tool) ? v.tool : tool) as any,
          aspectRatio: v.aspectRatio || aspectRatio,
          negativePrompt: v.negativePrompt || 'blurry, low quality, distorted, extra limbs, bad anatomy, watermark, text, signature',
          category: catId,
          categoryName: catName,
          commercialHook: String(v.commercialHook || "Excelente potencial comercial para campanhas publicitárias e banners.").trim(),
          hasCopySpace: Boolean(v.hasCopySpace ?? copySpace),
          isIsolatedWhite: Boolean(v.isIsolatedWhite ?? isolatedWhite),
          suggestedKeywords: Array.isArray(v.suggestedKeywords) ? v.suggestedKeywords.slice(0, 15) : ["commercial", "stock", "high quality"],
          createdAt: Date.now(),
          isFavorite: false
        };
      });

      return res.json({ variations: sanitizedVariations });
    } catch (e: any) {
      console.error("Erro ao gerar prompts comerciais:", e);
      return res.status(500).json({ error: e.message || "Falha ao gerar prompts com a Inteligência Artificial." });
    }
  });

  // API 404 Handler - garante que qualquer requisição /api não tratada retorne estritamente JSON
  app.use("/api", (req, res) => {
    res.status(404).json({ error: `Endpoint de API não encontrado: ${req.method} ${req.originalUrl || req.path}` });
  });

  // API Error Handler - captura erros de parsing (ex.: PayloadTooLargeError) e formata em JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestUrl = req.originalUrl || req.url || req.path || '';
    if (requestUrl.startsWith('/api')) {
      console.error("Express API error:", err);
      if (res.headersSent) return next(err);
      if (err?.type === 'entity.too.large') {
        return res.status(413).json({ error: "O arquivo enviado excede o limite suportado pelo servidor. Tente reduzir o tamanho ou resolução da imagem." });
      }
      return res.status(err.status || 500).json({ error: err.message || "Erro interno no servidor de API." });
    }
    next(err);
  });

  // Configuração do Vite middleware em desenvolvimento, ou arquivos estáticos em produção
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
