import type { 
  PromptGenerationRequest, 
  StockPromptVariation 
} from '../types';

export async function generateCommercialPrompts(
  request: PromptGenerationRequest,
  geminiKey: string | null,
  deepseekKey: string | null
): Promise<StockPromptVariation[]> {
  const payload = {
    ...request,
    geminiKey,
    deepseekKey
  };

  const response = await fetch('/api/generate-prompts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    let errorMsg = `Erro do servidor ao gerar prompts (Código ${response.status}).`;
    if (contentType.includes('application/json')) {
      const errorBody = await response.json().catch(() => null);
      if (errorBody?.error) errorMsg = errorBody.error;
    } else {
      const rawText = await response.text().catch(() => '');
      if (rawText && !rawText.includes('<!DOCTYPE') && rawText.length < 300) {
        errorMsg = rawText.trim();
      }
    }
    throw new Error(errorMsg);
  }

  const result = await response.json();
  if (result?.error) {
    throw new Error(result.error);
  }

  if (Array.isArray(result?.variations)) {
    return result.variations as StockPromptVariation[];
  }

  if (Array.isArray(result)) {
    return result as StockPromptVariation[];
  }

  throw new Error("Formato inválido de resposta do gerador de prompts.");
}
