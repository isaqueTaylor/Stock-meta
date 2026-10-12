import React from 'react';
import { Sparkles, HelpCircle, Activity, Wand2, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  activeView: 'metadata' | 'prompts';
  onSelectView: (view: 'metadata' | 'prompts') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onSelectView }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/80">
      <div className="container mx-auto max-w-7xl h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center bg-gradient-to-tr from-indigo-500 to-pink-500 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white font-display leading-none flex items-center gap-1.5">
              Stock<span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Meta</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5">Suíte Adobe Stock IA</p>
          </div>
        </div>

        {/* View Navigation Switcher */}
        <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => onSelectView('metadata')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'metadata'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Metadados & CSV</span>
            <span className="sm:hidden">Metadados</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectView('prompts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeView === 'prompts'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-pink-400" />
            <span>Gerador de Prompts</span>
            <span className="hidden min-[480px]:inline px-1.5 py-0.2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-sm">
              NOVO
            </span>
          </button>
        </div>
        
        {/* Right Info */}
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href="https://helpx.adobe.com/br/stock/contributor/user-guide.html" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hidden md:flex text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-all items-center gap-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 px-3 py-1.5 rounded-lg"
          >
            <HelpCircle className="h-3 w-3" />
            <span>Guia Adobe Stock</span>
          </a>
          
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shadow-glow-emerald">
            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 tracking-wider">ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
};
