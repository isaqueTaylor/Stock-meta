import React, { useState, useEffect } from 'react';
import { Key, CheckCircle2, Trash2, ExternalLink, Eye, EyeOff, Sparkles } from 'lucide-react';

interface ApiKeyManagerProps {
  geminiKey: string | null;
  deepseekKey: string | null;
  onGeminiKeyChange: (key: string | null) => void;
  onDeepseekKeyChange: (key: string | null) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  geminiKey,
  deepseekKey,
  onGeminiKeyChange,
  onDeepseekKeyChange
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'deepseek'>('gemini');
  
  // Gemini inputs
  const [geminiInput, setGeminiInput] = useState('');
  const [geminiFocused, setGeminiFocused] = useState(false);
  const [geminiShow, setGeminiShow] = useState(false);

  // DeepSeek inputs
  const [deepseekInput, setDeepseekInput] = useState('');
  const [deepseekFocused, setDeepseekFocused] = useState(false);
  const [deepseekShow, setDeepseekShow] = useState(false);

  useEffect(() => {
    if (geminiKey) {
      setGeminiInput('****************************************');
    } else {
      setGeminiInput('');
    }
  }, [geminiKey]);

  useEffect(() => {
    if (deepseekKey) {
      setDeepseekInput('****************************************');
    } else {
      setDeepseekInput('');
    }
  }, [deepseekKey]);

  const handleSaveGemini = () => {
    if (geminiInput.trim() !== '') {
      onGeminiKeyChange(geminiInput.trim());
    }
  };

  const handleClearGemini = () => {
    onGeminiKeyChange(null);
    setGeminiInput('');
    setGeminiShow(false);
  };

  const handleSaveDeepseek = () => {
    if (deepseekInput.trim() !== '') {
      onDeepseekKeyChange(deepseekInput.trim());
    }
  };

  const handleClearDeepseek = () => {
    onDeepseekKeyChange(null);
    setDeepseekInput('');
    setDeepseekShow(false);
  };

  return (
    <div className="w-full space-y-5">
      {/* Tab Switcher Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
          <Key className="h-4 w-4 text-slate-500" /> Gerenciador de Chaves de API
        </label>
        
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850/80">
          <button
            onClick={() => setActiveTab('gemini')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'gemini'
                ? 'bg-indigo-500 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google Gemini
          </button>
          <button
            onClick={() => setActiveTab('deepseek')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'deepseek'
                ? 'bg-indigo-500 text-white shadow-glow-brand'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DeepSeek API
          </button>
        </div>
      </div>

      {/* Tab Contents: Gemini */}
      {activeTab === 'gemini' && (
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between w-full">
          <div className="flex-grow w-full space-y-3">
            <div className={`relative transition-all duration-300 rounded-xl p-[1px] ${
              geminiFocused ? 'bg-gradient-to-r from-indigo-500 to-pink-500 shadow-glow-brand' : 'bg-slate-800'
            }`}>
              <div className="relative bg-slate-900 border border-transparent rounded-[11px] flex items-center overflow-hidden h-12">
                <input
                  id="gemini-api-key"
                  type={geminiShow ? "text" : "password"}
                  value={geminiInput}
                  onChange={(e) => setGeminiInput(e.target.value)}
                  onFocus={() => setGeminiFocused(true)}
                  onBlur={() => setGeminiFocused(false)}
                  placeholder="Cole sua API Key do Gemini personalizada (opcional)..."
                  disabled={!!geminiKey}
                  className="block w-full pl-4 pr-32 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all disabled:text-slate-500"
                />
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent pl-8">
                  {!geminiKey && geminiInput.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => setGeminiShow(!geminiShow)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
                      title={geminiShow ? "Ocultar Chave" : "Mostrar Chave"}
                    >
                      {geminiShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                  {geminiKey ? (
                    <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-glow-emerald">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Ativa
                    </span>
                  ) : (
                    <span className="text-indigo-400 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/15">
                      <CheckCircle2 className="h-3 w-3 text-indigo-400" /> Workspace
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-md">✓ Gemini ativo no servidor seguro.</span>
              <span className="text-[11px] text-slate-500">Se preferir usar sua própria cota ou faturamento:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
              >
                Obter Chave no AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full md:w-auto md:pt-1 flex justify-end">
            {geminiKey ? (
              <button
                onClick={handleClearGemini}
                className="w-full md:w-auto text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-glow-rose"
              >
                <Trash2 className="h-4 w-4" /> Desconectar Token
              </button>
            ) : (
              <button
                onClick={handleSaveGemini}
                disabled={geminiInput.trim() === ''}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                Salvar Chave
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab Contents: DeepSeek */}
      {activeTab === 'deepseek' && (
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between w-full">
          <div className="flex-grow w-full space-y-3">
            <div className={`relative transition-all duration-300 rounded-xl p-[1px] ${
              deepseekFocused ? 'bg-gradient-to-r from-indigo-500 to-pink-500 shadow-glow-brand' : 'bg-slate-800'
            }`}>
              <div className="relative bg-slate-900 border border-transparent rounded-[11px] flex items-center overflow-hidden h-12">
                <input
                  id="deepseek-api-key"
                  type={deepseekShow ? "text" : "password"}
                  value={deepseekInput}
                  onChange={(e) => setDeepseekInput(e.target.value)}
                  onFocus={() => setDeepseekFocused(true)}
                  onBlur={() => setDeepseekFocused(false)}
                  placeholder="Cole sua API Key do DeepSeek integrada (opcional)..."
                  disabled={!!deepseekKey}
                  className="block w-full pl-4 pr-32 py-3 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-all disabled:text-slate-500"
                />
                
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent pl-8">
                  {!deepseekKey && deepseekInput.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => setDeepseekShow(!deepseekShow)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
                      title={deepseekShow ? "Ocultar Chave" : "Mostrar Chave"}
                    >
                      {deepseekShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  )}
                  {deepseekKey ? (
                    <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-glow-emerald">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Ativa
                    </span>
                  ) : (
                    <span className="text-indigo-400 text-[9px] uppercase tracking-widest font-bold flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/15">
                      <CheckCircle2 className="h-3 w-3 text-indigo-400" /> Workspace
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 px-2 py-0.5 rounded-md">✓ Modelos DeepSeek Chat / V3 para SEO.</span>
              <span className="text-[11px] text-slate-500">Crie seu saldo ou chave na plataforma:</span>
              <a
                href="https://platform.deepseek.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 transition-colors"
              >
                Obter Chave na DeepSeek <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-full md:w-auto md:pt-1 flex justify-end">
            {deepseekKey ? (
              <button
                onClick={handleClearDeepseek}
                className="w-full md:w-auto text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-glow-rose"
              >
                <Trash2 className="h-4 w-4" /> Desconectar Token
              </button>
            ) : (
              <button
                onClick={handleSaveDeepseek}
                disabled={deepseekInput.trim() === ''}
                className="w-full md:w-auto bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all font-display disabled:opacity-40 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                Salvar Chave
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
