import React, { useState } from 'react';
import { Type, Tag, GripVertical, Plus, X, Layers, ShieldAlert, ShieldCheck, Wand2, AlertCircle } from 'lucide-react';
import type { GeneratedData, ImageResolution } from '../types';
import { CopyButton } from './CopyButton';
import { 
  ADOBE_STOCK_CATEGORIES, 
  detectFlaggedBrands, 
  sanitizeContentFromBrands 
} from '../services/complianceService';

interface GeneratedContentProps {
  data: GeneratedData;
  resolution?: ImageResolution;
  onUpdate: (newData: GeneratedData) => void;
}

export const GeneratedContent: React.FC<GeneratedContentProps> = ({ data, resolution, onUpdate }) => {
  const [newKeyword, setNewKeyword] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Análise de conformidade em tempo real
  const flaggedBrands = detectFlaggedBrands(`${data.title} ${data.keywords.join(' ')}`);
  const isTitleOverLimit = data.title.length > 200;
  const isKeywordsOverLimit = data.keywords.length > 49;
  const hasComplianceIssues = flaggedBrands.length > 0 || isTitleOverLimit || isKeywordsOverLimit;

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...data, title: e.target.value });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = parseInt(e.target.value, 10);
    const catObj = ADOBE_STOCK_CATEGORIES.find(c => c.id === categoryId);
    onUpdate({ 
      ...data, 
      category: categoryId,
      categoryName: catObj ? catObj.namePt : data.categoryName
    });
  };

  const handleAutoTrimTitle = () => {
    if (data.title.length <= 200) return;
    const sliced = data.title.slice(0, 197);
    const lastSpace = sliced.lastIndexOf(' ');
    const trimmedTitle = (lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim();
    onUpdate({ ...data, title: trimmedTitle });
  };

  const handleAutoTrimKeywords = () => {
    if (data.keywords.length <= 49) return;
    onUpdate({ ...data, keywords: data.keywords.slice(0, 49) });
  };

  const handleSanitizeBrands = () => {
    const result = sanitizeContentFromBrands(data.title, data.keywords);
    onUpdate({
      ...data,
      title: result.sanitizedTitle,
      keywords: result.sanitizedKeywords
    });
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    const updatedKeywords = data.keywords.filter((_, index) => index !== indexToRemove);
    onUpdate({ ...data, keywords: updatedKeywords });
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (trimmed && !data.keywords.includes(trimmed)) {
      onUpdate({ ...data, keywords: [...data.keywords, trimmed] });
      setNewKeyword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  // --- Lógica de Drag and Drop ---
  const onDragStart = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent<HTMLSpanElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const onDragLeave = () => {
    setDragOverIndex(null);
  };

  const onDrop = (e: React.DragEvent<HTMLSpanElement>, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newKeywords = [...data.keywords];
    const itemToMove = newKeywords[draggedIndex];

    newKeywords.splice(draggedIndex, 1);
    newKeywords.splice(dropIndex, 0, itemToMove);

    onUpdate({ ...data, keywords: newKeywords });
    setDraggedIndex(null);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const keywordsAsString = data.keywords.join(', ');
  const categoryLabel = data.category ? `${data.category} - ${data.categoryName || 'Adobe Stock'}` : 'Não definida';
  const allContentAsString = `Título: ${data.title}\nCategoria: ${categoryLabel}\nPalavras-chave: ${keywordsAsString}`;

  return (
    <div className="flex flex-col h-full text-sm bg-slate-900/60 rounded-b-2xl">
      {/* Category Bar */}
      <div className="px-4 py-2.5 border-b border-slate-850 bg-slate-950/40 flex items-center justify-between gap-3">
        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-display shrink-0">
          <Layers className="h-3.5 w-3.5 text-indigo-400" /> Categoria Adobe
        </label>
        <div className="flex-grow max-w-[240px]">
          <select
            value={data.category || 8}
            onChange={handleCategoryChange}
            className="w-full bg-slate-900 text-slate-200 text-[11px] font-medium border border-slate-800 rounded-lg px-2.5 py-1 focus:border-indigo-500 focus:outline-none cursor-pointer"
          >
            {ADOBE_STOCK_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.id}. {cat.namePt} ({cat.nameEn})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance Checker Alert Box */}
      {flaggedBrands.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[11px] font-bold text-rose-300 block">
                Risco de Rejeição: Marca comercial detectada
              </span>
              <p className="text-[10.5px] text-rose-300/80 mt-0.5 leading-relaxed">
                Termos identificados: <strong className="text-rose-200">{flaggedBrands.join(', ')}</strong>. O Adobe Stock rejeita arquivos que mencionam marcas registradas.
              </p>
            </div>
          </div>
          <button
            onClick={handleSanitizeBrands}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[11px] font-semibold rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
          >
            <Wand2 className="h-3 w-3" /> Substituir por termos genéricos seguros
          </button>
        </div>
      )}

      {/* Title Section */}
      <div className="p-4 border-b border-slate-850 space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
            <Type className="h-3.5 w-3.5 text-slate-500" /> Título
          </label>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
              isTitleOverLimit
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20 font-bold' 
                : 'bg-slate-950 text-slate-400 border border-slate-850'
            }`}>
              {data.title.length} / 200
            </span>
            {isTitleOverLimit && (
              <button
                onClick={handleAutoTrimTitle}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
                title="Ajustar título para o limite máximo de 200 caracteres"
              >
                Ajustar limite
              </button>
            )}
            <CopyButton textToCopy={data.title} label="Copiar Título" minimal />
          </div>
        </div>
        <textarea
          value={data.title}
          onChange={handleTitleChange}
          className={`w-full bg-slate-950 text-slate-100 p-3 rounded-xl border focus:bg-slate-950 focus:ring-1 focus:outline-none outline-none resize-none text-[12px] leading-relaxed transition-all shadow-inner ${
            isTitleOverLimit 
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500' 
              : 'border-slate-850 focus:border-indigo-500/80 focus:ring-indigo-500'
          }`}
          rows={3}
          placeholder="Insira o título otimizado..."
        />
        {isTitleOverLimit && (
          <p className="text-[10px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Título ultrapassa o limite de 200 caracteres do Adobe Stock.
          </p>
        )}
      </div>

      {/* Keywords Section */}
      <div className="flex-grow flex flex-col p-4 space-y-3 min-h-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
              <Tag className="h-3.5 w-3.5 text-slate-500" /> Tags ({data.keywords.length})
            </label>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              isKeywordsOverLimit 
                ? 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20' 
                : 'text-slate-500 bg-slate-950'
            }`}>
              máx. 49
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isKeywordsOverLimit && (
              <button
                onClick={handleAutoTrimKeywords}
                className="text-[10px] text-rose-400 hover:text-rose-300 underline font-medium cursor-pointer"
                title="Manter apenas as 49 primeiras tags mais relevantes"
              >
                Limitar a 49
              </button>
            )}
            <CopyButton textToCopy={keywordsAsString} label="Copiar Tags" minimal />
          </div>
        </div>

        <div className="flex-grow bg-slate-950 rounded-xl border border-slate-850 p-2.5 overflow-y-auto max-h-[160px] custom-scrollbar">
          <div className="flex flex-wrap gap-1.5 font-sans">
            {data.keywords.map((keyword, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const isKeywordFlagged = detectFlaggedBrands(keyword).length > 0;
              const isOverRank = index >= 49;
              
              return (
                <span 
                  key={`${keyword}-${index}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={onDragEnd}
                  className={`
                    inline-flex items-center text-[10.5px] px-2.5 py-1 rounded-lg select-none transition-all group shadow-sm cursor-grab active:cursor-grabbing border font-medium
                    ${isKeywordFlagged
                      ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                      : isOverRank
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300/80 line-through'
                        : isDragging 
                          ? 'opacity-40 border-dashed border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                          : isDragOver
                            ? 'border-indigo-400 bg-indigo-500/20 text-indigo-200 translate-x-1'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-indigo-500/40 hover:text-indigo-300 hover:bg-slate-900/80'
                    }
                  `}
                >
                  <GripVertical className="h-3 w-3 mr-1 text-slate-600 group-hover:text-slate-400 cursor-grab opacity-30 group-hover:opacity-100 transition-opacity" />
                  <span>{keyword}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveKeyword(index);
                    }}
                    className="ml-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 p-0.5 rounded transition-all cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>

        {/* Add Input */}
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Adicionar tag SEO manual..."
            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all pr-10 shadow-inner placeholder-slate-600"
          />
          <button 
            onClick={handleAddKeyword}
            disabled={!newKeyword.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-indigo-500 hover:bg-indigo-400 disabled:opacity-0 disabled:pointer-events-none text-white rounded-lg flex items-center justify-center transition-all cursor-pointer shadow shadow-indigo-500/15"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span>💡 Arraste para definir as top 10 tags mais comerciais</span>
          {!hasComplianceIssues && (
            <span className="text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="h-3 w-3" /> Metadados Conformes
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-850 bg-slate-900/40 rounded-b-2xl">
        <CopyButton textToCopy={allContentAsString} label="Copiar Todos os Metadados" fullWidth />
      </div>
    </div>
  );
};
