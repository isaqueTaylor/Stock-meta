
import React, { useRef, useState } from 'react';
import { UploadCloud, Image, Video, FileCode, Check } from 'lucide-react';

interface ImageUploaderProps {
  onFilesSelect: (files: File[]) => void;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFilesSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelect(Array.from(event.target.files));
      event.target.value = '';
    }
  };

  const handleButtonClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
        setIsDragging(dragging);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelect(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="w-full h-full relative group">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp, image/svg+xml, video/mp4, video/webm, video/quicktime"
        multiple
        disabled={disabled}
      />
      <div 
        className={`relative w-full h-full min-h-[300px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-500 text-center p-8 overflow-hidden
            ${disabled 
                ? 'bg-slate-900/20 border-slate-900 cursor-not-allowed opacity-40' 
                : isDragging 
                    ? 'bg-indigo-500/10 border-indigo-500 shadow-glow-brand ring-1 ring-indigo-500/20' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-900/80 hover:shadow-glow-brand cursor-pointer'
            } 
        `}
        onClick={handleButtonClick}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={handleDrop}
      >
        {/* Decorative Grid Pattern Background */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className={`p-4.5 rounded-2xl mb-4 transition-all duration-500 shadow-lg ${
          isDragging 
            ? 'bg-indigo-500 text-white scale-110 rotate-3' 
            : 'bg-slate-800 text-indigo-400 border border-slate-700/60 group-hover:scale-105 group-hover:text-indigo-300'
        }`}>
          <UploadCloud className="h-8 w-8" />
        </div>
        
        <h3 className="text-base font-bold text-slate-200 mb-1.5 font-display">
          {isDragging ? 'Solte seus arquivos aqui para carregar' : 'Arraste suas imagens ou vídeos aqui'}
        </h3>
        <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
          ou clique para procurar registros locais em seu computador
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 relative z-10">
          <Badge icon={<Image className="h-3 w-3 text-emerald-400" />} text="JPG, PNG, WEBP" />
          <Badge icon={<FileCode className="h-3 w-3 text-cyan-400" />} text="SVG Vetor" />
          <Badge icon={<Video className="h-3 w-3 text-rose-400" />} text="MP4, MOV, WEBM" />
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text, icon }: { text: string; icon?: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800/80 px-2.5 py-1.5 rounded-lg shadow-sm">
    {icon}
    <span className="tracking-wide">{text}</span>
  </span>
);

