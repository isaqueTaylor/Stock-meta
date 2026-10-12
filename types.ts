export interface AdobeStockCategory {
  id: number;
  namePt: string;
  nameEn: string;
}

export interface ImageResolution {
  width: number;
  height: number;
  megapixels: number;
  isCompliant: boolean; // >= 4.0 Megapixels
}

export interface ComplianceReport {
  isResolutionCompliant: boolean;
  isTitleLengthCompliant: boolean;
  isKeywordCountCompliant: boolean;
  flaggedBrands: string[];
  hasWarnings: boolean;
}

export interface GeneratedData {
  title: string;
  keywords: string[];
  category?: number; // 1 to 21
  categoryName?: string;
}

export type TitleLength = 'short' | 'medium' | 'long';
export type AIProvider = 'gemini' | 'deepseek';

export interface GenerationOptions {
  provider: AIProvider;
  language: string;
  keywordCount: number;
  titleLength: TitleLength;
  includeTransparentBackground: boolean;
  includeWhiteBackground: boolean;
}

export type ImageJobStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface ImageJob {
  id: string;
  file: File;
  previewUrl: string;
  status: ImageJobStatus;
  data: GeneratedData | null;
  error: string | null;
  resolution?: ImageResolution;
  compliance?: ComplianceReport;
}

// --- Tipos para o Gerador de Prompts do Adobe Stock ---

export type ImageGeneratorTool = 'midjourney' | 'flux' | 'nanobanana' | 'chatgpt' | 'firefly' | 'stablediffusion';

export type PromptAspectRatio = '16:9' | '3:2' | '1:1' | '4:5' | '9:16' | '21:9';

export type PromptVisualGenre = 
  | 'photo'
  | 'isolated_white'
  | 'render3d'
  | 'vector_illustration'
  | 'texture_background'
  | 'mockup_scene'
  | 'editorial_lifestyle';

export interface StockPromptVariation {
  id: string;
  titlePt: string;
  promptEn: string;
  fullPromptWithParams: string;
  tool: ImageGeneratorTool;
  aspectRatio: PromptAspectRatio;
  negativePrompt?: string;
  category: number;
  categoryName: string;
  commercialHook: string;
  hasCopySpace: boolean;
  isIsolatedWhite: boolean;
  suggestedKeywords: string[];
  createdAt: number;
  isFavorite?: boolean;
}

export interface PromptGenerationRequest {
  idea: string;
  tool: ImageGeneratorTool;
  genre: PromptVisualGenre;
  aspectRatio: PromptAspectRatio;
  lighting?: string;
  composition?: string;
  copySpace: boolean;
  isolatedWhite: boolean;
  variationCount: number;
  customInstructions?: string;
}
