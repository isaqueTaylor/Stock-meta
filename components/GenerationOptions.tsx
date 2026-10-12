
import React from 'react';
import { Globe, FileText, Tag, Layers, ChevronDown, Sparkles, BrainCircuit, Square } from 'lucide-react';
import type { GenerationOptions as GenerationOptionsType, TitleLength, AIProvider } from '../types';

interface GenerationOptionsProps {
  options: GenerationOptionsType;
  setOptions: React.Dispatch<React.SetStateAction<GenerationOptionsType>>;
  disabled: boolean;
}

export const GenerationOptions: React.FC<GenerationOptionsProps> = ({ options, setOptions, disabled }) => {
  const handleOptionChange = (field: keyof GenerationOptionsType, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleTransparent = (checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      includeTransparentBackground: checked,
      ...(checked ? { includeWhiteBackground: false } : {})
    }));
  };

  const handleToggleWhite = (checked: boolean) => {
    setOptions(prev => ({
      ...prev,
      includeWhiteBackground: checked,
      ...(checked ? { includeTransparentBackground: false } : {})
    }));
  };

  return (
    <div className="space-y-6 h-full flex flex-col justify-center py-2">
      {/* AI Engine Choice */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
          <BrainCircuit className="h-4 w-4 text-indigo-400" /> Motor de Inteligência Artificial
        </label>
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-855">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOptionChange('provider', 'gemini')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              options.provider === 'gemini'
                ? 'bg-gradient-to-r from-indigo-500 to-pink-500 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            Google Gemini
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOptionChange('provider', 'deepseek')}
            className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              options.provider === 'deepseek'
                ? 'bg-indigo-500 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            DeepSeek Chat
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label htmlFor="language" className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
          <Globe className="h-4 w-4 text-slate-500" /> Idioma de Saída
        </label>
        <div className="relative group">
          <select
            id="language"
            name="language"
            value={options.language}
            onChange={(e) => handleOptionChange('language', e.target.value)}
            disabled={disabled}
            className="w-full appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:bg-slate-900/40 cursor-pointer"
          >
            <option>Português (Brasil)</option>
            <option>English (US)</option>
            <option>Español</option>
            <option>Français</option>
            <option>Deutsch</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500 group-hover:text-slate-400 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Title Length */}
      <div className="space-y-2">
        <label htmlFor="titleLength" className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
          <FileText className="h-4 w-4 text-slate-500" /> Estilo do Título
        </label>
        <div className="relative group">
          <select
            id="titleLength"
            name="titleLength"
            value={options.titleLength}
            onChange={(e) => handleOptionChange('titleLength', e.target.value as TitleLength)}
            disabled={disabled}
            className="w-full appearance-none bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl py-3 pl-4 pr-10 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:bg-slate-900/40 cursor-pointer"
          >
            <option value="short">Curto (Conciso - Direct)</option>
            <option value="medium">Médio (Descritivo - Recomendado)</option>
            <option value="long">Longo (SEO Otimizado - Máximo)</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-500 group-hover:text-slate-400 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Keyword Count */}
      <div className="space-y-3 pt-1">
        <div className="flex justify-between items-center">
          <label htmlFor="keywordCount" className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
            <Tag className="h-4 w-4 text-slate-500" /> Quantidade de Tags
          </label>
          <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg shadow-glow-brand">
            {options.keywordCount} tags
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-600">10</span>
          <input
            id="keywordCount"
            type="range"
            min="10"
            max="50"
            step="1"
            value={options.keywordCount}
            onChange={(e) => handleOptionChange('keywordCount', parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50 accent-indigo-500 hover:accent-indigo-400"
          />
          <span className="text-xs font-semibold text-slate-600">50</span>
        </div>
      </div>

      {/* Background Isolation Options */}
      <div className="space-y-2.5 pt-1">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
          <Layers className="h-4 w-4 text-slate-500" /> Isolamento de Fundo
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fundo Transparente */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
            options.includeTransparentBackground 
              ? 'bg-indigo-500/10 border-indigo-500/30 shadow-glow-brand ring-1 ring-indigo-500/20' 
              : 'bg-slate-900/50 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
          }`}>
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={options.includeTransparentBackground}
                onChange={(e) => handleToggleTransparent(e.target.checked)}
                disabled={disabled}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-700 bg-slate-950 checked:border-indigo-500 checked:bg-indigo-500 transition-all focus:ring-0 focus:outline-none"
              />
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                options.includeTransparentBackground ? 'text-indigo-300' : 'text-slate-300'
              }`}>
                <Layers className="h-3.5 w-3.5 text-slate-400" /> Fundo Transparente
              </span>
              <span className="text-[11px] text-slate-400 leading-snug block">
                Adiciona "isolado em fundo transparente" ao final do título e tags de PNG/recorte.
              </span>
            </div>
          </label>

          {/* Fundo Branco */}
          <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
            options.includeWhiteBackground 
              ? 'bg-indigo-500/10 border-indigo-500/30 shadow-glow-brand ring-1 ring-indigo-500/20' 
              : 'bg-slate-900/50 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
          }`}>
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={options.includeWhiteBackground}
                onChange={(e) => handleToggleWhite(e.target.checked)}
                disabled={disabled}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border-2 border-slate-700 bg-slate-950 checked:border-indigo-500 checked:bg-indigo-500 transition-all focus:ring-0 focus:outline-none"
              />
              <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="flex-1 space-y-1 min-w-0">
              <span className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                options.includeWhiteBackground ? 'text-indigo-300' : 'text-slate-300'
              }`}>
                <Square className="h-3.5 w-3.5 text-slate-200 fill-white" /> Fundo Branco
              </span>
              <span className="text-[11px] text-slate-400 leading-snug block">
                Adiciona "isolado em fundo branco" ao final do título e tags de isolamento.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

