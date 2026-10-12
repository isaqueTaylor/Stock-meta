import type { AdobeStockCategory, ImageResolution, ComplianceReport, GeneratedData } from '../types';

export const ADOBE_STOCK_CATEGORIES: AdobeStockCategory[] = [
  { id: 1, namePt: "Animais", nameEn: "Animals" },
  { id: 2, namePt: "Edifícios e Arquitetura", nameEn: "Buildings and Architecture" },
  { id: 3, namePt: "Negócios", nameEn: "Business" },
  { id: 4, namePt: "Bebidas", nameEn: "Drinks" },
  { id: 5, namePt: "Meio ambiente", nameEn: "The Environment" },
  { id: 6, namePt: "Estados de espírito e pessoas", nameEn: "States of Mind and People" },
  { id: 7, namePt: "Comida", nameEn: "Food" },
  { id: 8, namePt: "Recursos Gráficos", nameEn: "Graphic Resources" },
  { id: 9, namePt: "Hobbies e lazer", nameEn: "Hobbies and Leisure" },
  { id: 10, namePt: "Indústria", nameEn: "Industry" },
  { id: 11, namePt: "Paisagens", nameEn: "Landscapes" },
  { id: 12, namePt: "Estilo de vida", nameEn: "Lifestyle" },
  { id: 13, namePt: "Pessoas", nameEn: "People" },
  { id: 14, namePt: "Plantas e flores", nameEn: "Plants and Flowers" },
  { id: 15, namePt: "Cultura e religião", nameEn: "Culture and Religion" },
  { id: 16, namePt: "Ciência", nameEn: "Science" },
  { id: 17, namePt: "Questões sociais", nameEn: "Social Issues" },
  { id: 18, namePt: "Esportes", nameEn: "Sports" },
  { id: 19, namePt: "Tecnologia", nameEn: "Technology" },
  { id: 20, namePt: "Transporte", nameEn: "Transport" },
  { id: 21, namePt: "Viagens", nameEn: "Travel" },
];

export function getCategoryById(id?: number): AdobeStockCategory | undefined {
  if (!id) return undefined;
  return ADOBE_STOCK_CATEGORIES.find(c => c.id === id);
}

// Catálogo de marcas registradas, nomes protegidos e propriedade intelectual que causam rejeição
export const PROTECTED_BRANDS: { brand: string; genericAlternative: string }[] = [
  // Tecnologia & Dispositivos
  { brand: 'iPhone', genericAlternative: 'smartphone' },
  { brand: 'iPad', genericAlternative: 'tablet' },
  { brand: 'MacBook', genericAlternative: 'laptop moderno' },
  { brand: 'Apple Watch', genericAlternative: 'smartwatch' },
  { brand: 'Apple', genericAlternative: 'empresa de tecnologia' },
  { brand: 'iOS', genericAlternative: 'sistema operacional móvel' },
  { brand: 'Android', genericAlternative: 'dispositivo móvel' },
  { brand: 'Samsung', genericAlternative: 'dispositivo eletrônico' },
  { brand: 'PlayStation', genericAlternative: 'console de videogame' },
  { brand: 'Xbox', genericAlternative: 'console de jogos' },
  { brand: 'Nintendo', genericAlternative: 'console portátil' },
  { brand: 'Microsoft', genericAlternative: 'software corporativo' },
  { brand: 'Windows', genericAlternative: 'computador desktop' },
  { brand: 'Google', genericAlternative: 'motor de busca' },
  { brand: 'Instagram', genericAlternative: 'rede social' },
  { brand: 'Facebook', genericAlternative: 'mídia social' },
  { brand: 'TikTok', genericAlternative: 'plataforma de vídeo' },
  { brand: 'WhatsApp', genericAlternative: 'aplicativo de mensagens' },
  { brand: 'Twitter', genericAlternative: 'rede social' },
  { brand: 'Photoshop', genericAlternative: 'software de edição' },
  { brand: 'Lightroom', genericAlternative: 'editor de fotografia' },
  { brand: 'Illustrator', genericAlternative: 'software vetorial' },
  { brand: 'Midjourney', genericAlternative: 'arte de inteligência artificial' },
  { brand: 'ChatGPT', genericAlternative: 'inteligência artificial' },
  { brand: 'OpenAI', genericAlternative: 'modelo de IA' },

  // Moda & Calçados
  { brand: 'Nike', genericAlternative: 'tênis esportivo' },
  { brand: 'Adidas', genericAlternative: 'roupa esportiva' },
  { brand: 'Puma', genericAlternative: 'calçado atlético' },
  { brand: 'Jordan', genericAlternative: 'tênis de basquete' },
  { brand: 'Gucci', genericAlternative: 'marca de luxo' },
  { brand: 'Prada', genericAlternative: 'moda de alta costura' },
  { brand: 'Chanel', genericAlternative: 'perfume elegante' },
  { brand: 'Louis Vuitton', genericAlternative: 'bolsa de couro de luxo' },
  { brand: 'Rolex', genericAlternative: 'relógio de pulso de luxo' },
  { brand: 'Ray-Ban', genericAlternative: 'óculos de sol escuros' },

  // Automóveis & Veículos
  { brand: 'Tesla', genericAlternative: 'carro elétrico moderno' },
  { brand: 'Ferrari', genericAlternative: 'carro superesportivo vermelho' },
  { brand: 'Lamborghini', genericAlternative: 'supercarro exótico' },
  { brand: 'Porsche', genericAlternative: 'veículo esportivo veloz' },
  { brand: 'BMW', genericAlternative: 'automóvel executivo' },
  { brand: 'Mercedes', genericAlternative: 'carro de luxo premium' },
  { brand: 'Harley-Davidson', genericAlternative: 'motocicleta estradeira' },

  // Entretenimento, Brinquedos & Personagens
  { brand: 'Disney', genericAlternative: 'fantasia mágica' },
  { brand: 'Mickey Mouse', genericAlternative: 'personagem lúdico' },
  { brand: 'Marvel', genericAlternative: 'super-herói' },
  { brand: 'Spider-Man', genericAlternative: 'herói mascarado' },
  { brand: 'Batman', genericAlternative: 'justiceiro urbano' },
  { brand: 'Star Wars', genericAlternative: 'guerra espacial fictícia' },
  { brand: 'Harry Potter', genericAlternative: 'mago e bruxaria' },
  { brand: 'Pokemon', genericAlternative: 'monstrinho de fantasia' },
  { brand: 'Pikachu', genericAlternative: 'criatura animada' },
  { brand: 'Lego', genericAlternative: 'blocos de montar coloridos' },
  { brand: 'Barbie', genericAlternative: 'boneca elegante' },

  // Alimentos & Bebidas
  { brand: 'Coca-Cola', genericAlternative: 'refrigerante de cola' },
  { brand: 'Coke', genericAlternative: 'bebida gaseificada' },
  { brand: 'Pepsi', genericAlternative: 'refrigerante gelado' },
  { brand: 'Red Bull', genericAlternative: 'bebida energética' },
  { brand: 'Starbucks', genericAlternative: 'copo de café viagem' },
  { brand: 'McDonald', genericAlternative: 'hambúrguer fast food' },
  { brand: 'Nutella', genericAlternative: 'creme de avelã com cacau' },
  { brand: 'Oreo', genericAlternative: 'biscoito recheado de chocolate' },
];

/**
 * Detecta marcas comerciais registradas em um texto ou lista de termos
 */
export function detectFlaggedBrands(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  const normalized = text.toLowerCase();

  for (const item of PROTECTED_BRANDS) {
    // Escapa caracteres especiais do nome da marca
    const escaped = item.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Regex de borda de palavra
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(normalized)) {
      if (!found.includes(item.brand)) {
        found.push(item.brand);
      }
    }
  }

  return found;
}

/**
 * Remove ou substitui marcas registradas do título e palavras-chave
 */
export function sanitizeContentFromBrands(
  title: string,
  keywords: string[]
): { sanitizedTitle: string; sanitizedKeywords: string[]; cleanedCount: number } {
  let currentTitle = title;
  const currentKeywords = [...keywords];
  let cleanedCount = 0;

  for (const item of PROTECTED_BRANDS) {
    const escaped = item.brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    // Substitui no título pela alternativa genérica
    if (regex.test(currentTitle)) {
      currentTitle = currentTitle.replace(regex, item.genericAlternative);
      cleanedCount++;
    }

    // Nas palavras-chave, remove a tag de marca e opcionalmente adiciona a genérica
    const brandLower = item.brand.toLowerCase();
    for (let i = currentKeywords.length - 1; i >= 0; i--) {
      const kw = currentKeywords[i].toLowerCase();
      if (kw === brandLower || kw.includes(brandLower)) {
        currentKeywords.splice(i, 1);
        cleanedCount++;
        // Se a alternativa genérica ainda não estiver presente, inclui
        if (!currentKeywords.some(k => k.toLowerCase() === item.genericAlternative.toLowerCase())) {
          currentKeywords.push(item.genericAlternative);
        }
      }
    }
  }

  // Remove duplicatas mantendo ordem
  const uniqueKeywords = Array.from(new Set(currentKeywords)).filter(Boolean);

  return {
    sanitizedTitle: currentTitle.trim(),
    sanitizedKeywords: uniqueKeywords,
    cleanedCount
  };
}

/**
 * Executa auditoria de conformidade de uma imagem em relação aos padrões do Adobe Stock
 */
export function auditCompliance(
  data: GeneratedData | null,
  resolution?: ImageResolution
): ComplianceReport {
  let flaggedBrands: string[] = [];
  let isTitleLengthCompliant = true;
  let isKeywordCountCompliant = true;
  const isResolutionCompliant = resolution ? resolution.isCompliant : true;

  if (data) {
    // 1. Marcas registradas
    const allText = `${data.title} ${data.keywords.join(' ')}`;
    flaggedBrands = detectFlaggedBrands(allText);

    // 2. Limite de título (máximo 200 caracteres no Adobe Stock)
    if (data.title && data.title.length > 200) {
      isTitleLengthCompliant = false;
    }

    // 3. Limite de palavras-chave (Adobe Stock aceita no máximo 49-50)
    if (data.keywords && (data.keywords.length > 49 || data.keywords.length < 5)) {
      isKeywordCountCompliant = false;
    }
  }

  const hasWarnings = 
    !isResolutionCompliant || 
    !isTitleLengthCompliant || 
    !isKeywordCountCompliant || 
    flaggedBrands.length > 0;

  return {
    isResolutionCompliant,
    isTitleLengthCompliant,
    isKeywordCountCompliant,
    flaggedBrands,
    hasWarnings
  };
}

/**
 * Lê a resolução física (largura, altura e megapixels) do arquivo de imagem no navegador
 */
export function readImageResolution(file: File): Promise<ImageResolution> {
  return new Promise((resolve) => {
    // Para vídeos ou arquivos não-imagem, retorna padrão
    if (!file.type.startsWith('image/')) {
      resolve({
        width: 1920,
        height: 1080,
        megapixels: 2.07,
        isCompliant: true // vídeos possuem critérios diferentes de resolução
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      const pixels = width * height;
      const megapixels = Number((pixels / 1_000_000).toFixed(2));
      // Requisito técnico estrito do Adobe Stock: no mínimo 4 MP (4.000.000 pixels)
      const isCompliant = pixels >= 4_000_000;

      URL.revokeObjectURL(objectUrl);
      resolve({
        width,
        height,
        megapixels,
        isCompliant
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback seguro em caso de falha de leitura do blob
      resolve({
        width: 0,
        height: 0,
        megapixels: 0,
        isCompliant: true
      });
    };

    img.src = objectUrl;
  });
}
