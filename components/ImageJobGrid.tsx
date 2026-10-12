import React, { useRef } from 'react';
import { X, RefreshCw, AlertTriangle, Video, Image as ImageIcon, FolderOpen, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { ImageJob, GeneratedData } from '../types';
import { Loader } from './Loader';
import { GeneratedContent } from './GeneratedContent';

interface ImageJobGridProps {
  jobs: ImageJob[];
  onRemoveJob: (id: string) => void;
  onRegenerateJob: (id: string) => void;
  onUpdateJobData: (id: string, newData: GeneratedData) => void;
  isProcessing: boolean;
}

export const ImageJobGrid: React.FC<ImageJobGridProps> = ({ jobs, onRemoveJob, onRegenerateJob, onUpdateJobData, isProcessing }) => {
  if (jobs.length === 0) {
    return (
      <div className="w-full py-20 bg-slate-900/30 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-inner">
        <div className="bg-slate-900/60 p-4.5 rounded-2xl border border-slate-800/60 text-slate-600 mb-4 shadow-md">
          <FolderOpen className="w-10 h-10 text-slate-500" />
        </div>
        <span className="text-slate-300 font-extrabold text-lg font-display">Galeria de Metadados Vazia</span>
        <p className="text-slate-500 text-xs mt-1.5 max-w-sm leading-relaxed">
          Arraste e solte fotos ou vídeos acima para que a inteligência artificial gere títulos, palavras-chave e categorias oficiais para o Adobe Stock.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {jobs.map((job) => (
        <JobCard 
          key={job.id} 
          job={job}
          onRemove={onRemoveJob}
          onRegenerate={onRegenerateJob}
          onUpdate={onUpdateJobData}
          isProcessing={isProcessing}
        />
      ))}
    </div>
  );
};

interface JobCardProps {
  job: ImageJob;
  onRemove: (id: string) => void;
  onRegenerate: (id: string) => void;
  onUpdate: (id: string, newData: GeneratedData) => void;
  isProcessing: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onRemove, onRegenerate, onUpdate, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = job.file.type.startsWith('video/');
  
  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) videoRef.current.play().catch(() => {});
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const StatusBadge = () => {
    switch (job.status) {
      case 'processing':
        return (
          <span className="absolute top-3 right-3 bg-indigo-600/90 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full shadow-lg z-20 border border-white/10 backdrop-blur-md animate-pulse">
            PROCESSANDO
          </span>
        );
      case 'completed':
        return (
          <span className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full shadow-lg z-20 border border-white/10 backdrop-blur-md">
            PRONTO
          </span>
        );
      case 'error':
        return (
          <span className="absolute top-3 right-3 bg-rose-500/90 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full shadow-lg z-20 border border-white/10 backdrop-blur-md">
            FALHOU
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-glow-brand hover:border-slate-750 hover:-translate-y-1">
      {/* File Info Header Bar */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-850/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[200px] font-medium text-slate-300" title={job.file.name}>
          {job.file.name}
        </span>
        {job.resolution && !isVideo && (
          <span 
            className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded ${
              job.resolution.isCompliant
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20'
                : 'text-rose-400 bg-rose-950/40 border border-rose-500/20 font-bold'
            }`}
            title={
              job.resolution.isCompliant
                ? `Resolução aprovada: ${job.resolution.width}x${job.resolution.height} (${job.resolution.megapixels} MP)`
                : `Resolução insuficiente para o Adobe Stock: ${job.resolution.width}x${job.resolution.height} (${job.resolution.megapixels} MP). Mínimo exigido: 4.0 MP.`
            }
          >
            {job.resolution.isCompliant ? '✓ ' : '⚠️ '}
            {job.resolution.megapixels} MP
          </span>
        )}
      </div>

      {/* Header / Preview */}
      <div className="relative h-56 bg-slate-950 border-b border-slate-850/80 overflow-hidden">
        {/* Background noise grid */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Float Action Controls */}
        <div className="absolute top-3 left-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {!isProcessing && (
            <button 
              onClick={() => onRemove(job.id)} 
              className="bg-slate-900/95 hover:bg-rose-500 hover:text-white text-slate-400 p-2 rounded-xl shadow-md border border-slate-800 transition-all transform hover:scale-105 cursor-pointer"
              title="Remover arquivo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {(job.status === 'completed' || job.status === 'error') && !isProcessing && (
            <button 
              onClick={() => onRegenerate(job.id)} 
              className="bg-slate-900/95 hover:bg-indigo-500 hover:text-white text-slate-400 p-2 rounded-xl shadow-md border border-slate-800 transition-all transform hover:scale-105 cursor-pointer"
              title="Gerar novamente"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <StatusBadge />

        <div 
          className="w-full h-full flex items-center justify-center p-4 relative z-10"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {!job.previewUrl ? (
            <div className="flex flex-col items-center justify-center text-slate-550 gap-2 text-center p-4">
              {isVideo ? (
                <Video className="w-10 h-10 text-slate-600 animate-pulse" />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-600 animate-pulse" />
              )}
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Mídia Omitida pela Sessão</span>
            </div>
          ) : isVideo ? (
            <video 
              ref={videoRef}
              src={job.previewUrl || undefined} 
              className="max-w-full max-h-full object-contain rounded-lg drop-shadow-xl" 
              muted 
              loop
              playsInline
            />
          ) : (
            <img 
              src={job.previewUrl || undefined} 
              alt={job.file?.name || 'Stock asset'} 
              className="max-w-full max-h-full object-contain rounded-lg drop-shadow-xl" 
            />
          )}
          {job.status === 'processing' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center">
              <Loader large />
            </div>
          )}
        </div>

        {isVideo && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/80 border border-white/10 text-white text-[9px] font-bold tracking-widest rounded-lg flex items-center gap-1 z-20 backdrop-blur-md">
            <Video className="h-3 w-3 text-indigo-400" /> VIDEO
          </div>
        )}

        {/* Resolution details badge on image */}
        {job.resolution && !isVideo && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/85 border border-white/10 text-[9px] font-mono text-slate-300 rounded-lg z-20 backdrop-blur-md shadow-md">
            {job.resolution.width} × {job.resolution.height} px
          </div>
        )}
      </div>

      {/* Warning banner for low resolution (<4MP) */}
      {job.resolution && !job.resolution.isCompliant && !isVideo && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-3.5 py-2 flex items-center gap-2 text-rose-300 text-[10.5px]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>
            <strong>Abaixo do Mínimo:</strong> {job.resolution.megapixels} MP. O Adobe Stock exige no mínimo <strong>4.0 MP</strong> para fotos.
          </span>
        </div>
      )}

      {/* Body Content */}
      <div className="flex-grow flex flex-col min-h-[220px] bg-slate-900/80">
        {job.status === 'completed' && job.data ? (
          <GeneratedContent 
            data={job.data} 
            resolution={job.resolution}
            onUpdate={(newData) => onUpdate(job.id, newData)}
          />
        ) : job.status === 'error' ? (
          <div className="p-6 flex-grow flex items-center justify-center text-center">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500 shadow-glow-rose">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-rose-400 font-extrabold text-sm font-display mb-1">Processamento Falhou</p>
                <p className="text-slate-500 text-xs max-w-[220px] mx-auto leading-relaxed">{job.error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 flex-grow flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-[140px] h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4 relative shadow-inner">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 w-1/2 animate-pulse rounded-full"></div>
            </div>
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Aguardando no Processador...</span>
          </div>
        )}
      </div>
    </div>
  );
};
