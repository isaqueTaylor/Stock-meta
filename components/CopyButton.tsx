import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  fullWidth?: boolean;
  minimal?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, label = 'Copiar', fullWidth = false, minimal = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (minimal) {
    return (
      <button
        onClick={handleCopy}
        className={`text-[10px] font-bold transition-all duration-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border hover:scale-105 active:scale-95 ${
          copied 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-emerald' 
            : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-700 hover:text-slate-300'
        }`}
        title="Copiar texto"
      >
        {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
        <span>{copied ? 'Copiado' : label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      className={`
        text-xs font-bold py-3 px-4 rounded-xl border transition-all duration-500 flex items-center justify-center gap-2 relative overflow-hidden group hover:scale-[1.01] active:scale-[0.99]
        ${fullWidth ? 'w-full' : ''}
        ${copied 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-glow-emerald' 
            : 'bg-slate-950 border-slate-850 text-slate-300 hover:bg-slate-900/80 hover:border-indigo-500/40 hover:text-indigo-300 shadow-sm'
        }
      `}
    >
      <div className={`flex items-center gap-2 relative z-10 transform transition-transform duration-300 ${copied ? 'scale-105' : ''}`}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{copied ? 'Copiado!' : label}</span>
      </div>
    </button>
  );
};
