import type { GeneratedData, GenerationOptions } from '../types';

// Otimiza e redimensiona imagens no cliente para acelerar o envio e garantir compatibilidade perfeita com a IA
const prepareImageForAI = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const isSvg = file.type.includes('svg') || file.name.toLowerCase().endsWith('.svg');
    if (isSvg) {
      // SVGs são tratados pelo renderizador Canvas dedicado
      svgToPngBase64(file)
        .then(base64 => resolve({ base64, mimeType: 'image/png' }))
        .catch(reject);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Limita a 1280px máx - resolução ideal para visão computacional rápida e nítida
        const MAX_DIMENSION = 1280;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          fileToBase64(file).then(b64 => resolve({ base64: b64, mimeType: file.type || 'image/png' })).catch(reject);
          return;
        }

        // Desenha a imagem no canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Verifica se a imagem possui transparência real
        let hasTransparency = false;
        if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
          try {
            // Amostragem rápida de pixels para detectar canal alfa
            const sampleData = ctx.getImageData(0, 0, Math.min(width, 100), Math.min(height, 100)).data;
            for (let i = 3; i < sampleData.length; i += 4) {
              if (sampleData[i] < 250) {
                hasTransparency = true;
                break;
              }
            }
          } catch (e) {
            // Se falhar leitura de pixels, mantém seguro
          }
        }

        // Se tiver transparência real, exporta PNG; caso contrário, exporta JPEG otimizado
        const exportMime = hasTransparency ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(exportMime, 0.88);
        
        URL.revokeObjectURL(url);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: exportMime });
      } catch (err) {
        URL.revokeObjectURL(url);
        fileToBase64(file).then(b64 => resolve({ base64: b64, mimeType: file.type || 'image/png' })).catch(reject);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      fileToBase64(file).then(b64 => resolve({ base64: b64, mimeType: file.type || 'image/png' })).catch(reject);
    };

    img.src = url;
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      if (result && result.includes(',')) {
        resolve(result.split(',')[1]);
      } else {
        resolve(result || '');
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

// Converte SVG para PNG Base64 renderizando em um Canvas
const svgToPngBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      let width = img.width && img.width > 0 ? img.width : 1600;
      let height = img.height && img.height > 0 ? img.height : 1600;

      if (width < 1024 && height < 1024) {
          const scale = Math.min(1600 / width, 1600 / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
         URL.revokeObjectURL(url);
         reject(new Error("Não foi possível processar a imagem do vetor (erro de contexto Canvas)."));
         return;
      }

      // Preenche o fundo com branco para garantir que linhas fiquem nítidas para a IA
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/png');
      URL.revokeObjectURL(url);
      resolve(dataUrl.split(',')[1]);
    };

    img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Erro ao renderizar o arquivo SVG para leitura da IA. Verifique se o arquivo é válido."));
    };

    img.src = url;
  });
};

// Extrai um frame chave de vídeos para análise visual precisa
const extractVideoFrame = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      // Pula para 1 segundo ou 20% do vídeo para capturar um frame representativo
      video.currentTime = Math.min(1.0, video.duration / 4);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 1280, 1600);
        canvas.height = Math.min(video.videoHeight || 720, 1600);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          URL.revokeObjectURL(url);
          resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
          return;
        }
      } catch (e) {
        console.warn("Falha ao extrair frame de vídeo via canvas:", e);
      }
      URL.revokeObjectURL(url);
      fileToBase64(file).then(b64 => resolve({ base64: b64, mimeType: file.type || 'video/mp4' })).catch(reject);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      fileToBase64(file).then(b64 => resolve({ base64: b64, mimeType: file.type || 'video/mp4' })).catch(reject);
    };

    video.src = url;
  });
};

export async function generateStockMetadata(file: File, options: GenerationOptions, geminiKey: string | null, deepseekKey: string | null): Promise<GeneratedData> {
  let initialMime = file.type;
  if (!initialMime || initialMime === 'application/octet-stream') {
    const ext = (file.name || '').toLowerCase().split('.').pop() || '';
    if (ext === 'png') initialMime = 'image/png';
    else if (ext === 'jpg' || ext === 'jpeg') initialMime = 'image/jpeg';
    else if (ext === 'webp') initialMime = 'image/webp';
    else if (ext === 'gif') initialMime = 'image/gif';
    else if (ext === 'svg') initialMime = 'image/svg+xml';
    else if (ext === 'mp4') initialMime = 'video/mp4';
    else if (ext === 'mov') initialMime = 'video/quicktime';
    else initialMime = 'image/png';
  }

  const isVideo = initialMime.startsWith('video/');
  let base64Data = "";
  let finalMimeType = initialMime;

  // Processa a mídia otimizada para visão computacional
  try {
    if (isVideo) {
      const vidResult = await extractVideoFrame(file);
      base64Data = vidResult.base64;
      finalMimeType = vidResult.mimeType;
    } else {
      const imgResult = await prepareImageForAI(file);
      base64Data = imgResult.base64;
      finalMimeType = imgResult.mimeType;
    }
  } catch (error) {
    console.error("Erro ao preparar arquivo no cliente:", error);
    try {
      base64Data = await fileToBase64(file);
      finalMimeType = initialMime;
    } catch (fallbackErr) {
      throw new Error("Falha ao preparar o arquivo para envio.");
    }
  }

  // Faz a requisição para a nossa API segura no backend com retentativa automática em caso de oscilações
  const payload = JSON.stringify({
    base64Data,
    mimeType: finalMimeType,
    fileName: file.name,
    options: options || {},
    geminiKey,
    deepseekKey
  });

  const MAX_ATTEMPTS = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: payload
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let errorMsg = `Erro do servidor ao gerar metadados (Código ${response.status}).`;
        if (contentType.includes('application/json')) {
          const errorBody = await response.json().catch(() => null);
          if (errorBody?.error) errorMsg = errorBody.error;
        } else {
          const rawText = await response.text().catch(() => '');
          if (rawText && !rawText.includes('<!DOCTYPE') && !rawText.includes('<html') && rawText.length < 300) {
            errorMsg = rawText.trim();
          }
        }
        
        // Se for um erro 502/503 ou erro recuperável e ainda tivermos tentativas, tenta novamente
        if ((response.status === 502 || response.status === 503 || response.status === 504) && attempt < MAX_ATTEMPTS) {
          await new Promise(res => setTimeout(res, 1200 * attempt));
          continue;
        }

        throw new Error(errorMsg);
      }

      // Tenta ler como JSON diretamente
      try {
        const result = await response.json();
        if (result?.error) {
          throw new Error(result.error);
        }
        if (result && typeof result === 'object' && (result.title || Array.isArray(result.keywords))) {
          return result as GeneratedData;
        }
      } catch (jsonErr: any) {
        if (jsonErr.message && !jsonErr.message.includes('JSON')) {
          throw jsonErr;
        }
        // Se a resposta retornou OK mas o corpo não pôde ser lido como JSON na 1ª tentativa
        if (attempt < MAX_ATTEMPTS) {
          await new Promise(res => setTimeout(res, 1000));
          continue;
        }
        throw new Error("O servidor respondeu, mas os dados retornados não estavam no formato esperado. Tente novamente.");
      }

      throw new Error("Formato de metadados não identificado na resposta.");
    } catch (err: any) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS && !err.message?.includes('Chave de API')) {
        await new Promise(res => setTimeout(res, 1000 * attempt));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error("Falha na comunicação com o servidor de inteligência artificial.");
}
