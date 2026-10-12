import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Star, 
  Trash2, 
  Flame, 
  Sliders, 
  Bookmark, 
  Wand2, 
  Layers, 
  Camera, 
  Sun, 
  Maximize2, 
  ShieldCheck, 
  Info, 
  ExternalLink,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  Tag,
  Plus,
  X,
  Download
} from 'lucide-react';
import type { 
  StockPromptVariation, 
  ImageGeneratorTool, 
  PromptAspectRatio, 
  PromptVisualGenre,
  PromptGenerationRequest
} from '../types';
import { 
  BEST_SELLER_PRESETS, 
  BUILDER_OPTIONS, 
  getSavedPrompts, 
  savePromptToStorage, 
  togglePromptFavorite, 
  deleteSavedPrompt,
  type CommercialPreset
} from '../services/promptPresets';
import { generateCommercialPrompts } from '../services/promptService';

interface PromptGeneratorProps {
  geminiKey: string | null;
  deepseekKey: string | null;
  onOpenSettings?: () => void;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({
  geminiKey,
  deepseekKey,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'builder' | 'bestsellers' | 'history'>('ai');

  // Estado do Gerador IA
  const [idea, setIdea] = useState('');
  const [tool, setTool] = useState<ImageGeneratorTool>('midjourney');
  const [genre, setGenre] = useState<PromptVisualGenre>('photo');
  const [aspectRatio, setAspectRatio] = useState<PromptAspectRatio>('16:9');
  const [copySpace, setCopySpace] = useState(true);
  const [isolatedWhite, setIsolatedWhite] = useState(false);
  const [lighting, setLighting] = useState('');
  const [composition, setComposition] = useState('');
  const [variationCount, setVariationCount] = useState<number>(3);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Estados de execução
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<StockPromptVariation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Palavras identificadas a partir do texto do usuário
  const parsedWords = idea
    .split(/[,;\n]+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);

  const handleRemoveWord = (wordToRemove: string) => {
    const remaining = parsedWords.filter(w => w.toLowerCase() !== wordToRemove.toLowerCase());
    setIdea(remaining.join(', '));
  };

  const handleAddWord = (newWord: string) => {
    if (parsedWords.some(w => w.toLowerCase() === newWord.toLowerCase())) return;
    const updated = parsedWords.length > 0 ? `${idea.trim()}, ${newWord}` : newWord;
    setIdea(updated);
  };

  const handleClearWords = () => {
    setIdea('');
  };

  const handleCopyAll = () => {
    if (generatedVariations.length === 0) return;
    const allText = generatedVariations.map((v, i) => {
      return `// Prompt ${i + 1} (${v.tool.toUpperCase()}) - ${v.titlePt} [Cat. ${v.category}: ${v.categoryName}]\n${v.fullPromptWithParams}${v.negativePrompt ? `\nPrompt Negativo: ${v.negativePrompt}` : ''}\nTags: ${v.suggestedKeywords.join(', ')}`;
    }).join('\n\n========================================\n\n');

    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => {
      setCopiedAll(false);
    }, 2500);
  };

  const handleExportTxt = () => {
    if (generatedVariations.length === 0) return;
    const text = `# PROMPTS COMERCIAIS PARA ADOBE STOCK\n# Termos / Palavras-chave: ${idea}\n# Quantidade de Prompts: ${generatedVariations.length}\n# Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n` + 
      generatedVariations.map((v, i) => {
        return `----------------------------------------\nPROMPT #${i + 1}: ${v.titlePt}\nFerramenta: ${v.tool.toUpperCase()} | Proporção: ${v.aspectRatio}\nCategoria Adobe Stock: ${v.category} - ${v.categoryName}\nPotencial Comercial: ${v.commercialHook}\n\n[PROMPT PARA GERAR]:\n${v.fullPromptWithParams}\n\n${v.negativePrompt ? `[PROMPT NEGATIVO]:\n${v.negativePrompt}\n\n` : ''}[PALAVRAS-CHAVE SUGERIDAS]:\n${v.suggestedKeywords.join(', ')}\n`;
      }).join('\n========================================\n\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adobe-stock-prompts-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Histórico local
  const [savedPrompts, setSavedPrompts] = useState<StockPromptVariation[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'favorites'>('all');

  // Estado do Builder Interativo
  const [builderNiche, setBuilderNiche] = useState(BUILDER_OPTIONS.niches[0].value);
  const [builderSubject, setBuilderSubject] = useState('');
  const [builderStyle, setBuilderStyle] = useState(BUILDER_OPTIONS.visualGenres[0].value);
  const [builderLighting, setBuilderLighting] = useState(BUILDER_OPTIONS.lightingOptions[0].value);
  const [builderCamera, setBuilderCamera] = useState(BUILDER_OPTIONS.cameraAngles[0].value);
  const [builderAspect, setBuilderAspect] = useState<PromptAspectRatio>('16:9');
  const [builderTool, setBuilderTool] = useState<ImageGeneratorTool>('midjourney');
  const [builderCopySpace, setBuilderCopySpace] = useState(true);
  const [builderWhiteBg, setBuilderWhiteBg] = useState(false);

  useEffect(() => {
    setSavedPrompts(getSavedPrompts());
  }, []);

  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedIds(prev => new Set(prev).add(id));
    setTimeout(() => {
      setCopiedId(null);
    }, 4000);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!idea.trim()) {
      setError("Por favor, digite uma ideia, tema ou nicho para gerar os prompts.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const request: PromptGenerationRequest = {
      idea: idea.trim(),
      tool,
      genre: isolatedWhite ? 'isolated_white' : genre,
      aspectRatio,
      copySpace,
      isolatedWhite,
      lighting: lighting.trim() || undefined,
      composition: composition.trim() || undefined,
      variationCount
    };

    try {
      const results = await generateCommercialPrompts(request, geminiKey, deepseekKey);
      setGeneratedVariations(results);

      // Salva automaticamente a primeira variação no histórico para conveniência
      if (results.length > 0) {
        results.forEach(res => {
          savePromptToStorage(res);
        });
        setSavedPrompts(getSavedPrompts());
      }
    } catch (err: any) {
      console.error("Erro na geração de prompts:", err);
      setError(err.message || "Falha ao gerar os prompts. Verifique sua chave de API nas configurações.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = (variation: StockPromptVariation) => {
    const updated = togglePromptFavorite(variation.id);
    setSavedPrompts(updated);
    
    // Atualiza também nas variações visíveis
    setGeneratedVariations(prev => 
      prev.map(v => v.id === variation.id ? { ...v, isFavorite: !v.isFavorite } : v)
    );
  };

  const handleDeleteSaved = (id: string) => {
    const updated = deleteSavedPrompt(id);
    setSavedPrompts(updated);
  };

  // Carrega um preset de best-seller direto no gerador IA
  const handleUsePresetInGenerator = (preset: CommercialPreset) => {
    setIdea(preset.titlePt);
    setTool(preset.tool);
    setAspectRatio(preset.aspectRatio);
    setCopySpace(preset.hasCopySpace);
    setIsolatedWhite(preset.isIsolatedWhite);
    setActiveTab('ai');
  };

  // Monta o prompt do Builder dinâmico
  const assembleBuilderPrompt = () => {
    const parts: string[] = [];
    if (builderSubject.trim()) {
      parts.push(builderSubject.trim());
    } else {
      parts.push(`Commercial scene representing ${builderNiche}`);
    }

    if (builderWhiteBg) {
      parts.push('isolated on pure solid white background, high-key studio strobe lighting, crisp edges, subtle drop shadow');
    } else {
      parts.push(builderStyle);
    }

    if (builderCopySpace) {
      parts.push('composed with ample negative copy space for headline typography');
    }

    parts.push(builderLighting);
    parts.push(builderCamera);
    parts.push('commercial stock photography, high resolution, no logos');

    const baseText = parts.join(', ');

    if (builderTool === 'midjourney') {
      return `${baseText} --ar ${builderAspect} --style raw --v 6.1 --stylize 100`;
    }
    if (builderTool === 'nanobanana') {
      return `${baseText} --aspect ${builderAspect} --style photorealistic`;
    }
    if (builderTool === 'chatgpt') {
      return `${baseText}, high resolution commercial stock photo, aspect ratio ${builderAspect}, natural crisp lighting`;
    }
    return baseText;
  };

  const quickIdeas = [
    { label: '💼 Reunião Tech & IA', value: 'Equipe diversa em escritório moderno colaborando com computadores e gráficos holográficos sutis' },
    { label: '🥗 Comida Saudável', value: 'Bowl gourmet de alimentação saudável com frutas frescas e ingredientes orgânicos' },
    { label: '🩺 Saúde & Medicina', value: 'Médica especialista atenciosa em clínica moderna com iluminação natural suave' },
    { label: '💎 Ícones 3D Isolados', value: 'Conjunto de ícones 3D modernos de finanças e investimentos isolados em fundo branco puro' },
    { label: '🌱 Sustentabilidade ESG', value: 'Engenheira com tablet inspecionando parque de energia solar ao pôr do sol' },
    { label: '🎨 Background Abstrato', value: 'Textura abstrata fluida em gradientes suaves com amplo espaço vazio central para texto' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner do Gerador de Prompts */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/50 to-slate-900/80 border border-indigo-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Gerador de Prompts para Adobe Stock</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
              Crie Imagens que <span className="bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">Realmente Vendem</span> no Stock
            </h2>
            <p className="text-sm text-slate-300/80 leading-relaxed">
              Prompts calibrados para <strong>Midjourney, Flux, Nando Banana, ChatGPT, Firefly e SDXL</strong> com enquadramento comercial, <strong>Copy Space</strong> para anúncios publicitários, fundo branco isolado e <strong>zero risco de marcas registradas</strong>.
            </p>
          </div>

          {/* Navegação entre Sub-abas */}
          <div className="flex flex-wrap sm:flex-nowrap p-1 bg-slate-950/80 border border-slate-800 rounded-2xl gap-1 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Gerador IA</span>
            </button>
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'builder'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Construtor Rápido</span>
            </button>
            <button
              onClick={() => setActiveTab('bestsellers')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'bestsellers'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Best-Sellers</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer relative ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Salvos</span>
              {savedPrompts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-500 text-white text-[10px] rounded-full font-mono font-bold">
                  {savedPrompts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: GERADOR INTELIGENTE COM IA */}
      {activeTab === 'ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Formulário de Configuração (5 colunas) - Fixa no topo sem rolagem */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-900/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* PASSO 1: PALAVRAS-CHAVE DA IMAGEM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Digite suas Palavras-chave / Termos</span>
                </label>
                {parsedWords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearWords}
                    className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Limpar termos</span>
                  </button>
                )}
              </div>

              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Digite palavras ou termos... Ex: médico, hospital, tecnologia, moderno, estetoscópio ou café, manhã, mesa de madeira rústica, notebook..."
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none transition-all shadow-inner"
              />

              {/* Tags Visuais das Palavras Digitadas */}
              {parsedWords.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block mb-1.5">
                    Termos identificados ({parsedWords.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedWords.map((word, wIdx) => (
                      <span
                        key={wIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/25 rounded-lg text-xs font-medium text-indigo-300 group"
                      >
                        <span>{word}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWord(word)}
                          className="text-indigo-400/60 hover:text-rose-400 ml-0.5 cursor-pointer"
                          title={`Remover "${word}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões Rápidas de Ideias com 1 Clique */}
              <div className="mt-3">
                <span className="text-[10px] text-slate-500 font-medium block mb-1.5">
                  + Adicionar termos com 1 clique:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '🩺 Médico & Saúde', word: 'médico, saúde, hospital, moderna' },
                    { label: '💼 Fintech & Negócios', word: 'negócios, tecnologia, escritório, gráficos' },
                    { label: '🤖 Inteligência Artificial', word: 'inteligência artificial, inovação, digital' },
                    { label: '🥗 Comida Gourmet', word: 'comida gourmet, culinária, ingredientes frescos' },
                    { label: '☀️ Energia Solar', word: 'energia solar, sustentabilidade, painéis' },
                    { label: '☕ Café & Trabalho', word: 'café, mesa rústica, notebook, manhã' },
                    { label: '📦 Fundo Branco', word: 'fundo branco puro, estúdio, recorte' },
                  ].map((qi, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddWord(qi.word)}
                      className="text-[11px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border border-slate-800/80 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{qi.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* PASSO 2: QUANTIDADE DE PROMPTS DESEJADA */}
            <div className="p-4 bg-slate-950/70 border border-purple-500/20 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>2. Quantidade de Prompts Desejada</span>
                </label>
                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  {variationCount} {variationCount === 1 ? 'Prompt' : 'Prompts'}
                </span>
              </div>

              {/* Botões Rápidos de Quantidade */}
              <div>
                <span className="text-[10px] text-slate-500 block mb-1.5">Escolha rápida:</span>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {[1, 2, 3, 5, 8, 10, 15, 20].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setVariationCount(cnt)}
                      className={`py-2 px-1 text-center rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                        variationCount === cnt
                          ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-lg shadow-purple-600/20 ring-1 ring-purple-500/50 scale-102'
                          : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      {cnt}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Stepper Manual Personalizado (1 a 20) */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-medium">Ajuste qualquer valor (1 a 20):</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVariationCount(Math.max(1, variationCount - 1))}
                    disabled={variationCount <= 1}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={variationCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setVariationCount(Math.min(20, Math.max(1, val)));
                    }}
                    className="w-12 text-center bg-slate-900 border border-slate-700 rounded-lg py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setVariationCount(Math.min(20, variationCount + 1))}
                    disabled={variationCount >= 20}
                    className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>
                  Serão gerados <strong>{variationCount} prompts comerciais exclusivos</strong> explorando ângulos diferentes a partir das suas palavras.
                </span>
              </p>
            </div>

            {/* Seleção de Ferramenta Alvo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>3. Motor Gerador de Imagens</span>
                </label>
                <span className="text-[11px] text-indigo-400 font-semibold hidden sm:inline">
                  {BUILDER_OPTIONS.tools.find(t => t.id === tool)?.name}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUILDER_OPTIONS.tools.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTool(t.id)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      tool === t.id
                        ? 'bg-indigo-600/25 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/15 ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <span className="truncate pr-1 text-left">{t.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 font-mono text-slate-400 shrink-0">
                      {t.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Proporção da Imagem (Aspect Ratio) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Proporção (Aspect Ratio)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {BUILDER_OPTIONS.aspectRatios.map((ar) => (
                  <button
                    key={ar.value}
                    type="button"
                    onClick={() => setAspectRatio(ar.value)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      aspectRatio === ar.value
                        ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    title={ar.label}
                  >
                    {ar.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles Especiais para Adobe Stock */}
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Otimizações Oficiais de Microstock
              </span>

              {/* Toggle Copy Space */}
              <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={copySpace}
                  onChange={(e) => setCopySpace(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Incluir Copy Space (Espaço Vazio para Designers)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Composição com área limpa para aplicação de texto e logos publicitários (fator #1 de vendas).
                  </p>
                </div>
              </label>

              {/* Toggle Fundo Branco Puro */}
              <label className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={isolatedWhite}
                  onChange={(e) => setIsolatedWhite(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Isolado em Fundo Branco Puro (Estúdio Cutout)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Instrução rigorosa de fundo branco contínuo para recorte direto por designers gráficos.
                  </p>
                </div>
              </label>
            </div>

            {/* Configurações Avançadas Colapsáveis */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer py-1"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                <span>Opções Avançadas (Iluminação e Enquadramento)</span>
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-4 p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Preferência de Iluminação:
                    </label>
                    <select
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Automática / Harmoniosa com a Cena</option>
                      {BUILDER_OPTIONS.lightingOptions.map((lo, i) => (
                        <option key={i} value={lo.value}>{lo.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Enquadramento Fotográfico:
                    </label>
                    <select
                      value={composition}
                      onChange={(e) => setComposition(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Automático / Padrão Comercial</option>
                      {BUILDER_OPTIONS.cameraAngles.map((ca, i) => (
                        <option key={i} value={ca.value}>{ca.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Botão de Geração */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isLoading || !idea.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transform active:scale-98"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gerando {variationCount} {variationCount === 1 ? 'Prompt Comercial' : 'Prompts Comerciais'}...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Gerar {variationCount} {variationCount === 1 ? 'Prompt' : 'Prompts'} com Essas Palavras</span>
                </>
              )}
            </button>
          </div>

          {/* Coluna Direita: Variações Geradas (7 colunas) - Área com Rolagem Dedicada */}
          <div className="lg:col-span-7 flex flex-col space-y-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)]">
            {isLoading && (
              <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-sm">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 animate-spin flex items-center justify-center blur-sm opacity-60"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <Sparkles className="w-8 h-8 animate-pulse text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Consultando Modelos Especializados em Stock
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Criando variações visuais com iluminação comercial, parâmetros de enquadramento e conformidade anti-rejeição para o Adobe Stock.
                  </p>
                </div>
              </div>
            )}

            {!isLoading && generatedVariations.length === 0 && (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                  <Wand2 className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-slate-300 font-display">
                  Nenhum prompt gerado ainda
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Digite sua ideia ao lado e clique em "Gerar Prompts" para receber variações prontas em inglês formatadas para Midjourney, Flux ou Firefly.
                </p>
              </div>
            )}

            {!isLoading && generatedVariations.length > 0 && (
              <div className="flex flex-col space-y-3 min-h-0 flex-1">
                {/* Barra de Ações Fixa no Topo da Área dos Prompts */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-900/80 border border-slate-800/80 rounded-xl backdrop-blur-sm shrink-0 shadow-md">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{generatedVariations.length} {generatedVariations.length === 1 ? 'Prompt Comercial Gerado' : 'Prompts Comerciais Gerados'}</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 truncate max-w-xs block">
                      Palavras: <strong className="text-indigo-300 font-semibold">{parsedWords.length > 0 ? parsedWords.join(', ') : idea}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAll}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                        copiedAll
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                          : 'bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 border-indigo-500/30'
                      }`}
                      title="Copiar todos os prompts de uma única vez"
                    >
                      {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAll ? 'Todos Copiados!' : `Copiar Todos (${generatedVariations.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportTxt}
                      className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                      title="Baixar todos os prompts e tags em arquivo .txt"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Exportar TXT</span>
                    </button>
                  </div>
                </div>

                {/* Lista Exclusiva de Prompts com Rolagem (Área de Prompts com scroll interno) */}
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[calc(100vh-8.5rem)]">
                  {generatedVariations.map((variation, index) => (
                  <div
                    key={variation.id}
                    className="bg-slate-900/60 border border-slate-850 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-3 group"
                  >
                    {/* Cabeçalho do Card */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                            Variação {index + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/20 text-[10px] font-bold">
                            {BUILDER_OPTIONS.tools.find(t => t.id === variation.tool)?.name || variation.tool.toUpperCase()}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                            Cat. {variation.category}: {variation.categoryName}
                          </span>
                          {variation.isIsolatedWhite && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-bold">
                              Fundo Branco Puro
                            </span>
                          )}
                          {variation.hasCopySpace && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] font-bold">
                              Copy Space
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white font-display">
                          {variation.titlePt}
                        </h4>
                      </div>

                      {/* Botão Favoritar */}
                      <button
                        type="button"
                        onClick={() => handleToggleFavorite(variation)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          variation.isFavorite
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-amber-400'
                        }`}
                        title={variation.isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
                      >
                        <Star className={`w-4 h-4 ${variation.isFavorite ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Explicação da Venda Comercial */}
                    <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/15 rounded-xl flex items-start gap-2 text-indigo-200/90 text-xs">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Potencial Comercial:</strong> {variation.commercialHook}
                      </span>
                    </div>

                    {/* Bloco de Código do Prompt Principal */}
                    <div className="relative">
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 pr-24 font-mono text-xs text-slate-200 leading-relaxed break-words selection:bg-indigo-500/40">
                        {variation.fullPromptWithParams}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(variation.fullPromptWithParams, `main-${variation.id}`)}
                        className={`absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                          copiedIds.has(`main-${variation.id}`)
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                        title={copiedIds.has(`main-${variation.id}`) ? "Prompt já copiado" : "Copiar prompt"}
                      >
                        {copiedIds.has(`main-${variation.id}`) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Prompt Negativo (se houver, especialmente para SDXL) */}
                    {variation.negativePrompt && (
                      <div className="flex items-center justify-between text-xs bg-slate-950/60 border border-slate-800/80 px-3 py-2 rounded-xl text-slate-400">
                        <span className="truncate pr-2">
                          <strong className="text-slate-300">Prompt Negativo:</strong> {variation.negativePrompt}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(variation.negativePrompt || '', `neg-${variation.id}`)}
                          className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                            copiedIds.has(`neg-${variation.id}`)
                              ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-500'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                          }`}
                        >
                          {copiedIds.has(`neg-${variation.id}`) ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <span>Copiar Negativo</span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Tags Sugeridas para o Adobe Stock */}
                    {variation.suggestedKeywords && variation.suggestedKeywords.length > 0 && (
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-1">
                          <Tag className="w-3 h-3" /> Tags:
                        </span>
                        {variation.suggestedKeywords.slice(0, 8).map((kw, kwIdx) => (
                          <span
                            key={kwIdx}
                            className="text-[10px] px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800/80 rounded-md"
                          >
                            {kw}
                          </span>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleCopy(variation.suggestedKeywords.join(', '), `tags-${variation.id}`)}
                          className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold ml-1 transition-all cursor-pointer flex items-center gap-1 border ${
                            copiedIds.has(`tags-${variation.id}`)
                              ? 'bg-emerald-600/90 text-white border-emerald-500'
                              : 'text-indigo-400 hover:text-indigo-300 border-transparent hover:bg-indigo-500/10'
                          }`}
                        >
                          {copiedIds.has(`tags-${variation.id}`) ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-white" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <span>Copiar Todas</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: CONSTRUTOR DE PROMPT INTERATIVO (PROMPT BUILDER) */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Seletor Visual de Blocos (7 colunas) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-900/80 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white font-display mb-1">
                Construtor Visual Modular
              </h3>
              <p className="text-xs text-slate-400">
                Selecione os ingredientes para compor um prompt de alto calibre instantaneamente sem gastar tokens.
              </p>
            </div>

            {/* Sujeito Principal */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                1. Sujeito ou Ação Central (Opcional)
              </label>
              <input
                type="text"
                value={builderSubject}
                onChange={(e) => setBuilderSubject(e.target.value)}
                placeholder="Ex: Confident businesswoman holding tablet in sunlit open-plan office"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Nicho Comercial */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Nicho / Tema Comercial
              </label>
              <select
                value={builderNiche}
                onChange={(e) => setBuilderNiche(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {BUILDER_OPTIONS.niches.map((n, i) => (
                  <option key={i} value={n.value}>{n.label}</option>
                ))}
              </select>
            </div>

            {/* Estilo e Suporte de Fundo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  3. Estilo Visual
                </label>
                <select
                  value={builderStyle}
                  onChange={(e) => setBuilderStyle(e.target.value)}
                  disabled={builderWhiteBg}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
                >
                  {BUILDER_OPTIONS.visualGenres.map((g, i) => (
                    <option key={i} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  4. Iluminação
                </label>
                <select
                  value={builderLighting}
                  onChange={(e) => setBuilderLighting(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {BUILDER_OPTIONS.lightingOptions.map((l, i) => (
                    <option key={i} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Câmera e Enquadramento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  5. Lente / Câmera
                </label>
                <select
                  value={builderCamera}
                  onChange={(e) => setBuilderCamera(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {BUILDER_OPTIONS.cameraAngles.map((c, i) => (
                    <option key={i} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  6. Ferramenta & Parâmetros
                </label>
                <select
                  value={builderTool}
                  onChange={(e) => setBuilderTool(e.target.value as ImageGeneratorTool)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {BUILDER_OPTIONS.tools.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes de Otimização */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={builderCopySpace}
                  onChange={(e) => setBuilderCopySpace(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-300">
                  Com Copy Space (Espaço de Texto)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={builderWhiteBg}
                  onChange={(e) => setBuilderWhiteBg(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-300">
                  Isolado em Fundo Branco Puro
                </span>
              </label>
            </div>
          </div>

          {/* Saída em Tempo Real (5 colunas) - Fixa no topo */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/60 border border-slate-900/80 rounded-2xl p-6 shadow-xl space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Prompt Construído em Tempo Real</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                  {BUILDER_OPTIONS.tools.find(t => t.id === builderTool)?.name}
                </span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed min-h-[180px] break-words selection:bg-indigo-500/40">
                {assembleBuilderPrompt()}
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleCopy(assembleBuilderPrompt(), 'builder-prompt')}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  copiedIds.has('builder-prompt')
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                {copiedIds.has('builder-prompt') ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Prompt Completo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdea(assembleBuilderPrompt());
                  setActiveTab('ai');
                }}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Enviar para Refinar com o Gerador IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: BEST-SELLERS DO ADOBE STOCK */}
      {activeTab === 'bestsellers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Biblioteca de Prompts Mais Vendidos no Adobe Stock</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fórmulas testadas com histórico comprovado de downloads recorrentes no mercado de microstock.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BEST_SELLER_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="bg-slate-900/60 border border-slate-850 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] font-bold">
                      {preset.niche}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      Cat. {preset.category}: {preset.categoryName}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white font-display">
                    {preset.titlePt}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {preset.descriptionPt}
                  </p>

                  {/* Prompt Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                    {preset.promptEn} {preset.parameters}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(`${preset.promptEn} ${preset.parameters}`, preset.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      copiedIds.has(preset.id)
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copiedIds.has(preset.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Prompt</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUsePresetInGenerator(preset)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Carregar este tema no Gerador de Prompts IA"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Personalizar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 4: HISTÓRICO & SALVOS */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span>Prompts Salvos & Favoritos ({savedPrompts.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Seus prompts gerados ficam salvos automaticamente na memória do seu navegador.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    historyFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({savedPrompts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('favorites')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                    historyFilter === 'favorites'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Star className="w-3 h-3 text-amber-400" />
                  <span>Favoritos ({savedPrompts.filter(p => p.isFavorite).length})</span>
                </button>
              </div>

              {savedPrompts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Deseja limpar todo o histórico de prompts salvos?")) {
                      localStorage.removeItem('stockmeta_saved_prompts');
                      setSavedPrompts([]);
                    }
                  }}
                  className="p-2 text-slate-500 hover:text-rose-400 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {savedPrompts.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-300">Nenhum prompt salvo ainda</h4>
              <p className="text-xs text-slate-500 mt-1">
                Gere prompts na aba "Gerador IA" para que eles apareçam aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPrompts
                .filter(p => historyFilter === 'all' || p.isFavorite)
                .map((prompt) => (
                  <div
                    key={prompt.id}
                    className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4.5 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-bold">
                              {BUILDER_OPTIONS.tools.find(t => t.id === prompt.tool)?.badge || prompt.tool}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Cat. {prompt.category}: {prompt.categoryName}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white">
                            {prompt.titlePt}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(prompt)}
                            className="p-1.5 text-slate-500 hover:text-amber-400 cursor-pointer"
                            title="Favoritar"
                          >
                            <Star className={`w-3.5 h-3.5 ${prompt.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSaved(prompt.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                            title="Deletar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 leading-relaxed max-h-28 overflow-y-auto">
                        {prompt.fullPromptWithParams}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(prompt.fullPromptWithParams, `history-${prompt.id}`)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        copiedIds.has(`history-${prompt.id}`)
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                          : 'bg-slate-950 hover:bg-slate-850 text-indigo-300 border border-slate-800'
                      }`}
                    >
                      {copiedIds.has(`history-${prompt.id}`) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
