import React, { useState, useCallback, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Loader2, 
  RefreshCw, 
  Sparkles, 
  Trash2,
  FileImage,
  Database,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wand2,
  CheckCircle2
} from 'lucide-react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { GenerationOptions } from './components/GenerationOptions';
import { ApiKeyManager } from './components/ApiKeyManager';
import { PromptGenerator } from './components/PromptGenerator';
import { generateStockMetadata } from './services/geminiService';
import { exportJobsToCSV } from './services/csvService';
import { ImageJobGrid } from './components/ImageJobGrid';
import { 
  readImageResolution, 
  auditCompliance, 
  sanitizeContentFromBrands 
} from './services/complianceService';
import type { GenerationOptions as GenOptionsType, ImageJob, GeneratedData } from './types';

// --- Helpers para persistência de sessão ---
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const TRANSPARENT_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const base64ToFile = (base64: string, filename: string, mimeType: string): Promise<File> => {
  const dataToUse = base64 || TRANSPARENT_PNG_BASE64;
  const mimeToUse = base64 ? mimeType : 'image/png';
  return fetch(`data:${mimeToUse};base64,${dataToUse}`)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], filename, { type: mimeType });
      if (!base64) {
        (file as any).isPlaceholder = true;
      }
      return file;
    });
};
// --- Fim dos Helpers ---

const App: React.FC = () => {
  const [jobs, setJobs] = useState<ImageJob[]>([]);
  const stopSignalRef = React.useRef<boolean>(false);
  const jobsRef = React.useRef<ImageJob[]>(jobs);

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  const [activeView, setActiveView] = useState<'metadata' | 'prompts'>('metadata');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [geminiKey, setGeminiKey] = useState<string | null>(null);
  const [deepseekKey, setDeepseekKey] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [options, setOptions] = useState<GenOptionsType>({
    provider: 'gemini',
    language: 'Português (Brasil)',
    keywordCount: 45,
    titleLength: 'medium',
    includeTransparentBackground: false,
    includeWhiteBackground: false,
  });

  // Carrega API Key e sessão de trabalhos do localStorage na inicialização
  useEffect(() => {
    const storedGeminiKey = localStorage.getItem('gemini_api_key');
    if (storedGeminiKey) {
      setGeminiKey(storedGeminiKey);
    }
    const storedDeepseekKey = localStorage.getItem('deepseek_api_key');
    if (storedDeepseekKey) {
      setDeepseekKey(storedDeepseekKey);
    }
    
    const loadJobsFromSession = async () => {
      const savedJobsJSON = localStorage.getItem('image_jobs_session');
      if (savedJobsJSON) {
        try {
          const serializedJobs = JSON.parse(savedJobsJSON);
          const restoredJobs: ImageJob[] = await Promise.all(
            serializedJobs.map(async (sjob: any) => {
              const file = await base64ToFile(sjob.base64, sjob.filename, sjob.filetype);
              let resolution = sjob.resolution;
              if (!resolution && !sjob.isPlaceholder) {
                resolution = await readImageResolution(file);
              }
              const compliance = auditCompliance(sjob.data, resolution);
              return {
                id: sjob.id,
                file,
                previewUrl: sjob.isPlaceholder ? '' : URL.createObjectURL(file),
                status: sjob.status,
                data: sjob.data,
                error: sjob.error,
                resolution,
                compliance,
              };
            })
          );
          setJobs(restoredJobs);
        } catch (error) {
          console.error("Falha ao restaurar a sessão de trabalhos:", error);
          localStorage.removeItem('image_jobs_session');
        }
      }
      setIsLoaded(true);
    };

    loadJobsFromSession();
  }, []);

  // Salva a sessão de trabalhos no localStorage sempre que 'jobs' mudar, com suporte resiliente contra limite de quota
  useEffect(() => {
    if (!isLoaded) return; // Só salva depois que o carregamento inicial terminar

    const saveJobsToSession = async () => {
      if (jobs.length === 0) {
        localStorage.removeItem('image_jobs_session');
        return;
      }
      try {
        const serializableJobs = await Promise.all(jobs.map(async (job) => {
          let base64 = '';
          const isPl = (job.file as any).isPlaceholder;
          if (!isPl) {
            try {
              base64 = await fileToBase64(job.file);
            } catch (e) {
              console.warn("Não foi possível gerar base64 para", job.file.name, e);
            }
          }
          return {
            id: job.id,
            base64,
            filename: job.file.name,
            filetype: job.file.type,
            status: job.status,
            data: job.data,
            error: job.error,
            resolution: job.resolution,
            isPlaceholder: isPl || !base64
          };
        }));

        try {
          localStorage.setItem('image_jobs_session', JSON.stringify(serializableJobs));
        } catch (quotaError) {
          console.warn("Cota do localStorage excedida. Salvando apenas metadados e nomes sem os binários das imagens para recuperação.");
          const fallbackJobs = serializableJobs.map(sj => ({
            ...sj,
            base64: '',
            isPlaceholder: true
          }));
          localStorage.setItem('image_jobs_session', JSON.stringify(fallbackJobs));
        }
      } catch (error) {
        console.error("Falha ao salvar a sessão de trabalhos:", error);
      }
    };
    saveJobsToSession();
  }, [jobs, isLoaded]);

  const handleGeminiKeyChange = (newKey: string | null) => {
    setGeminiKey(newKey);
    if (newKey) {
      localStorage.setItem('gemini_api_key', newKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  const handleDeepseekKeyChange = (newKey: string | null) => {
    setDeepseekKey(newKey);
    if (newKey) {
      localStorage.setItem('deepseek_api_key', newKey);
    } else {
      localStorage.removeItem('deepseek_api_key');
    }
  };

  const handleFilesSelect = (files: File[]) => {
    const newJobs: ImageJob[] = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      data: null,
      error: null,
    }));
    setJobs(prevJobs => [...prevJobs, ...newJobs]);

    // Lê a resolução em background de cada arquivo para validar o limite de 4MP da Adobe Stock
    newJobs.forEach(job => {
      readImageResolution(job.file).then(res => {
        setJobs(prev => prev.map(j => {
          if (j.id === job.id) {
            const compliance = auditCompliance(j.data, res);
            return { ...j, resolution: res, compliance };
          }
          return j;
        }));
      });
    });
  };
  
  const handleRemoveJob = (idToRemove: string) => {
    setJobs(prevJobs => {
      const jobToRemove = prevJobs.find(job => job.id === idToRemove);
      if (jobToRemove) {
        URL.revokeObjectURL(jobToRemove.previewUrl);
      }
      return prevJobs.filter(job => job.id !== idToRemove);
    });
  };

  const handleClearAll = () => {
    jobs.forEach(job => URL.revokeObjectURL(job.previewUrl));
    setJobs([]);
  };
  
  const updateJobStatus = (id: string, status: ImageJob['status'], data: any = null) => {
    setJobs(prevJobs =>
      prevJobs.map(job => (job.id === id ? { ...job, status, ...data } : job))
    );
  };

  const handleUpdateJobData = (id: string, newData: GeneratedData) => {
    setJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.id === id) {
          const compliance = auditCompliance(newData, job.resolution);
          return { ...job, data: newData, compliance };
        }
        return job;
      })
    );
  };

  // Ações de correção em lote
  const handleFixAllBrands = () => {
    setJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.data) {
          const res = sanitizeContentFromBrands(job.data.title, job.data.keywords);
          const updatedData = {
            ...job.data,
            title: res.sanitizedTitle,
            keywords: res.sanitizedKeywords,
          };
          const compliance = auditCompliance(updatedData, job.resolution);
          return { ...job, data: updatedData, compliance };
        }
        return job;
      })
    );
  };

  const handleFixAllTitleLengths = () => {
    setJobs(prevJobs =>
      prevJobs.map(job => {
        if (job.data && job.data.title.length > 200) {
          const sliced = job.data.title.slice(0, 197);
          const lastSpace = sliced.lastIndexOf(' ');
          const trimmed = (lastSpace > 120 ? sliced.slice(0, lastSpace) : sliced).trim();
          const updatedData = { ...job.data, title: trimmed };
          const compliance = auditCompliance(updatedData, job.resolution);
          return { ...job, data: updatedData, compliance };
        }
        return job;
      })
    );
  };

  const processSingleJob = useCallback(async (job: ImageJob, gKey: string | null, dsKey: string | null) => {
    try {
      updateJobStatus(job.id, 'processing');
      const generatedData = await generateStockMetadata(job.file, options, gKey, dsKey);
      const compliance = auditCompliance(generatedData, job.resolution);
      updateJobStatus(job.id, 'completed', { data: generatedData, compliance });
    } catch (err: any) {
      console.error(`Failed to process ${job.file.name}:`, err);
      let errorMessage = err.message || "Ocorreu um erro. Verifique sua conexão e tente novamente.";
      if (typeof err.message === 'string' && err.message.includes('API key not valid')) {
        errorMessage = "Chave de API inválida. Por favor, verifique sua chave e tente novamente.";
      }
      updateJobStatus(job.id, 'error', { error: errorMessage });
    }
  }, [options]);

  const runGenerationBatch = useCallback(async (jobsToProcess: ImageJob[], isAutoRetryPass = false) => {
    if (jobsToProcess.length === 0) return;

    if (!isAutoRetryPass) {
      stopSignalRef.current = false;
      setIsProcessing(true);
    }

    setProgress({ current: 0, total: jobsToProcess.length });

    const CONCURRENCY_LIMIT = 3; 
    const queue = [...jobsToProcess];

    const processJobFromQueue = async () => {
      while (queue.length > 0) {
        if (stopSignalRef.current) {
          break;
        }
        const job = queue.shift();
        if (job) {
          if (stopSignalRef.current) {
            break;
          }
          await processSingleJob(job, geminiKey, deepseekKey);
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
          
          if (queue.length > 0 && !stopSignalRef.current) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      }
    };

    const workers = Array(CONCURRENCY_LIMIT).fill(0).map(processJobFromQueue);
    await Promise.all(workers);

    // Reprocessamento automático de eventuais falhas transitórias
    if (!stopSignalRef.current && !isAutoRetryPass) {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const failedJobs = jobsRef.current.filter(j => 
        j.status === 'error' && 
        jobsToProcess.some(p => p.id === j.id)
      );

      if (failedJobs.length > 0) {
        console.log(`[Auto Retry] Encontradas ${failedJobs.length} falhas. Iniciando reprocessamento automático...`);
        await runGenerationBatch(failedJobs, true);
        return;
      }
    }

    if (!isAutoRetryPass || stopSignalRef.current) {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [geminiKey, deepseekKey, processSingleJob]);

  const handleGenerate = useCallback(async () => {
    const jobsToProcess = jobs.filter(j => j.status === 'pending' || j.status === 'error');
    if (jobsToProcess.length === 0) return;
    await runGenerationBatch(jobsToProcess, false);
  }, [jobs, runGenerationBatch]);

  const handleStop = useCallback(() => {
    stopSignalRef.current = true;
    setIsProcessing(false);
  }, []);

  const handleRegenerate = useCallback(async (jobId: string) => {
    const jobToRegenerate = jobs.find(j => j.id === jobId);
    if (!jobToRegenerate) return;

    setIsProcessing(true);
    setProgress({ current: 1, total: 1 });
    
    await processSingleJob(jobToRegenerate, geminiKey, deepseekKey);

    setIsProcessing(false);
    setProgress({ current: 0, total: 0 });
  }, [jobs, geminiKey, deepseekKey, processSingleJob]);

  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  const pendingCount = jobs.filter(j => j.status === 'pending').length;
  const errorCount = jobs.filter(j => j.status === 'error').length;
  const jobsInQueueCount = pendingCount + errorCount;
  const isActionsDisabled = isProcessing;

  // Métricas do validador de compliance
  const lowResJobs = jobs.filter(j => j.resolution && !j.resolution.isCompliant && !j.file.type.startsWith('video/'));
  const brandFlaggedJobs = jobs.filter(j => j.compliance && j.compliance.flaggedBrands.length > 0);
  const overTitleJobs = jobs.filter(j => j.data && j.data.title.length > 200);
  const hasComplianceAlerts = lowResJobs.length > 0 || brandFlaggedJobs.length > 0 || overTitleJobs.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col selection:bg-indigo-500/35 selection:text-indigo-100 overflow-x-hidden relative">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header activeView={activeView} onSelectView={setActiveView} />
        
        <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 max-w-7xl">
          {activeView === 'prompts' ? (
            <div className="space-y-6">
              {/* Seção Topo: API Key */}
              <div className="bg-slate-900/55 border border-slate-900/80 rounded-2xl p-5 shadow-xl backdrop-blur-md">
                <ApiKeyManager 
                  geminiKey={geminiKey} 
                  deepseekKey={deepseekKey} 
                  onGeminiKeyChange={handleGeminiKeyChange} 
                  onDeepseekKeyChange={handleDeepseekKeyChange} 
                />
              </div>

              <PromptGenerator 
                geminiKey={geminiKey} 
                deepseekKey={deepseekKey} 
              />
            </div>
          ) : (
            <>
              {/* Hero / Intro Layout */}
              <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white font-display">
              Suíte Completa para Criadores de IA no <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Adobe Stock</span>
            </h1>
            <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
              Gere títulos e tags SEO de alto alcance, categorize automaticamente nas 21 categorias oficiais da Adobe, valide o requisito de resolução mínima (4MP) e filtre marcas registradas antes de submeter ao portal de colaboradores.
            </p>
          </div>

          {/* Seção Topo: API Key */}
          <div className="bg-slate-900/55 border border-slate-900/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            <ApiKeyManager 
              geminiKey={geminiKey} 
              deepseekKey={deepseekKey} 
              onGeminiKeyChange={handleGeminiKeyChange} 
              onDeepseekKeyChange={handleDeepseekKeyChange} 
            />
          </div>

          {/* Painel Central: Lado a Lado (Parâmetros + Upload) */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda: Parâmetros */}
            <div className="bg-slate-900/55 border border-slate-905 rounded-2xl p-6 shadow-xl flex flex-col h-full hover:border-slate-800 transition-colors">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 font-display">
                <Settings className="h-4 w-4 text-slate-500" /> Parâmetros de Filtro & IA
              </h2>
              <GenerationOptions 
                options={options}
                setOptions={setOptions}
                disabled={isProcessing} 
              />
            </div>

            {/* Coluna Direita: Upload */}
            <div className="bg-slate-900/55 border border-slate-905 rounded-2xl p-1.5 shadow-xl flex flex-col h-full min-h-[300px] hover:border-slate-800 transition-colors">
              <div className="flex-grow rounded-xl overflow-hidden">
                <ImageUploader onFilesSelect={handleFilesSelect} disabled={isActionsDisabled} />
              </div>
            </div>
          </section>

          {/* Painel de Auditoria de Compliance (Alerta Proativo ou Sucesso) */}
          {jobs.length > 0 && (
            <div className="animate-fade-in-up">
              {hasComplianceAlerts ? (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4.5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 font-display">
                        Auditoria de Conformidade do Adobe Stock: Atenção Necessária
                      </h4>
                      <p className="text-[11px] text-amber-200/80 mt-0.5 leading-relaxed">
                        {lowResJobs.length > 0 && (
                          <span className="mr-3">
                            • <strong>{lowResJobs.length}</strong> imagem(ns) com menos de 4 Megapixels.
                          </span>
                        )}
                        {brandFlaggedJobs.length > 0 && (
                          <span className="mr-3">
                            • <strong>{brandFlaggedJobs.length}</strong> imagem(ns) contendo marcas registradas.
                          </span>
                        )}
                        {overTitleJobs.length > 0 && (
                          <span>
                            • <strong>{overTitleJobs.length}</strong> título(s) acima do limite de 200 caracteres.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                    {brandFlaggedJobs.length > 0 && (
                      <button
                        onClick={handleFixAllBrands}
                        className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold rounded-xl border border-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full md:w-auto"
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Limpar Marcas em Lote
                      </button>
                    )}
                    {overTitleJobs.length > 0 && (
                      <button
                        onClick={handleFixAllTitleLengths}
                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition-all cursor-pointer w-full md:w-auto"
                      >
                        Limitar Títulos a 200c
                      </button>
                    )}
                  </div>
                </div>
              ) : completedJobsCount > 0 ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3 text-emerald-300 text-xs">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Validação Concluída:</strong> Todas as imagens geradas cumprem 100% dos requisitos do Adobe Stock (resolução &ge; 4MP, categorias oficiais e conformidade de marcas).
                  </span>
                </div>
              ) : null}
            </div>
          )}

          {/* Barra de Ações Flutuante / Monitor de Processo */}
          <div className="bg-slate-950/70 border border-slate-900 rounded-2xl p-4.5 shadow-2xl hover:shadow-glow-brand/5 flex flex-col sm:flex-row gap-5 items-center justify-between sticky top-20 z-40 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="hidden min-[400px]:flex -space-x-2">
                <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-slate-950 ${jobsInQueueCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-800'}`} title="Pendentes na fila"></div>
                <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-slate-950 ${isProcessing ? 'bg-indigo-500 animate-pulse' : 'bg-slate-800'}`} title="Processando agora"></div>
                <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-slate-950 ${completedJobsCount > 0 ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-slate-800'}`} title="Concluídos"></div>
              </div>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-slate-500" />
                <span>Contador de Tarefas:</span> 
                <span className="text-slate-200 font-extrabold font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md">{jobsInQueueCount} na fila</span>
                <span className="text-slate-500 font-medium">&bull;</span>
                <span className="text-emerald-400 font-extrabold font-mono bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-md shadow-glow-emerald">{completedJobsCount} concluídos</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={handleClearAll}
                disabled={isProcessing || jobs.length === 0}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent hover:border-slate-800 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Limpar Canvas
              </button>

              <button
                onClick={() => exportJobsToCSV(jobs)}
                disabled={isProcessing || completedJobsCount === 0}
                className="px-5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-md cursor-pointer"
                title="Exportar planilha CSV oficial com colunas: Filename, Title, Keywords, Category"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" /> Exportar CSV Oficial (Adobe Stock)
              </button>

              {isProcessing && (
                <button
                  onClick={handleStop}
                  className="px-5 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/20 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-95 shadow-lg shadow-rose-950/20"
                >
                  <span className="h-2 w-2 rounded-sm bg-white"></span>
                  <span>Parar Geração</span>
                </button>
              )}
              
              <button
                onClick={handleGenerate}
                disabled={isActionsDisabled || jobsInQueueCount === 0}
                className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:bg-slate-900 disabled:text-slate-600 disabled:border disabled:border-slate-800 disabled:shadow-none disabled:cursor-not-allowed min-w-[190px] transform active:scale-95 cursor-pointer
                  ${errorCount > 0 && pendingCount === 0 && !isProcessing
                    ? 'bg-rose-600 hover:bg-rose-500 hover:shadow-glow-rose' 
                    : 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 hover:shadow-glow-brand/25'}
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processando ({progress.current}/{progress.total})</span>
                  </>
                ) : (
                  <>
                    {errorCount > 0 && pendingCount === 0 ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-pulse" />
                        <span>Reprocessar {errorCount} Falhas</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Gerar Metadados IA</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Galeria de Resultados */}
          <section className="animate-fade-in-up space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-[1px] flex-grow bg-slate-900"></div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display flex items-center gap-2">
                <FileImage className="h-4 w-4" /> Painel de Avaliação & Conformidade
              </h2>
              <div className="h-[1px] flex-grow bg-slate-900"></div>
            </div>
            
            <ImageJobGrid 
              jobs={jobs}
              onRemoveJob={handleRemoveJob}
              onRegenerateJob={handleRegenerate}
              onUpdateJobData={handleUpdateJobData}
              isProcessing={isProcessing}
            />
          </section>
        </>
      )}
    </main>
        
        <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center mt-auto">
          <p className="text-xs text-slate-600 font-semibold tracking-wider font-display">
            StockMeta &bull; <span className="text-slate-500">Suíte de Conformidade e Metadados para Criadores de IA no Adobe Stock</span>
          </p>
        </footer>
      </div>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
