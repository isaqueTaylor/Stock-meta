import type { 
  StockPromptVariation, 
  ImageGeneratorTool, 
  PromptAspectRatio, 
  PromptVisualGenre 
} from '../types';

export interface CommercialPreset {
  id: string;
  niche: string;
  titlePt: string;
  descriptionPt: string;
  category: number;
  categoryName: string;
  promptEn: string;
  tool: ImageGeneratorTool;
  aspectRatio: PromptAspectRatio;
  parameters: string;
  negativePrompt?: string;
  hasCopySpace: boolean;
  isIsolatedWhite: boolean;
  suggestedKeywords: string[];
}

export const BEST_SELLER_PRESETS: CommercialPreset[] = [
  {
    id: 'preset-isolated-fintech-3d',
    niche: 'Finanças & Tecnologia 3D',
    titlePt: 'Ícones 3D de Banco Digital e Finanças Isolados',
    descriptionPt: 'Alta conversão para campanhas de fintech, apps de banco, investimentos e landing pages.',
    category: 3, // Negócios
    categoryName: 'Negócios',
    promptEn: 'Collection of modern 3D financial icons including floating credit card, golden shield security, glowing growth chart arrow and coins, smooth claymorphism texture, pastel corporate blue and emerald gradient tones, pure solid white background, clean studio lighting with soft diffused shadows, high resolution commercial stock rendering',
    tool: 'midjourney',
    aspectRatio: '16:9',
    parameters: '--ar 16:9 --style raw --v 6.1 --stylize 120',
    negativePrompt: 'busy background, dark background, complex patterns, text, watermark, bad anatomy',
    hasCopySpace: true,
    isIsolatedWhite: true,
    suggestedKeywords: ['3d icon', 'finance', 'banking app', 'credit card', 'investment', 'savings', 'fintech', 'isolated on white', 'crypto', 'claymorphism', 'commercial stock']
  },
  {
    id: 'preset-healthcare-doctor-copyspace',
    niche: 'Saúde & Medicina',
    titlePt: 'Médica Confiante com Estetoscópio e Amplo Copy Space',
    descriptionPt: 'Top download para convênios médicos, hospitais, farmácias e anúncios de telemedicina.',
    category: 6, // Estados de espírito e pessoas
    categoryName: 'Estados de espírito e pessoas',
    promptEn: 'Empathetic female healthcare physician in crisp clean white medical coat holding stethoscope, warm authentic smile looking towards camera, positioned on the right third of the frame leaving clean negative copy space on the left, bright minimalist clinic interior with soft natural window daylight, shallow depth of field, shot on Sony A7R V with 85mm f/1.4 lens, ultra photorealistic commercial stock photography',
    tool: 'flux',
    aspectRatio: '16:9',
    parameters: '--ar 16:9',
    negativePrompt: 'deformed hands, distorted face, fake smile, scary clinic, gloomy lighting, clutter',
    hasCopySpace: true,
    isIsolatedWhite: false,
    suggestedKeywords: ['doctor', 'healthcare', 'physician', 'medical professional', 'telemedicine', 'clinic', 'hospital', 'copy space', 'authentic smile', 'wellness', 'female doctor']
  },
  {
    id: 'preset-isolated-fresh-food',
    niche: 'Gastronomia & Alimentos',
    titlePt: 'Smoothie Bowl Tropical Gourmet com Frutas Isolado',
    descriptionPt: 'Perfeito para cardápios, blogs fitness, embalagens e campanhas de alimentação saudável.',
    category: 7, // Comida
    categoryName: 'Comida',
    promptEn: 'Vibrant organic acai smoothie bowl topped with sliced fresh dragonfruit, blueberries, chia seeds, sliced kiwi and edible flower petals, ceramic artisan bowl isolated on pure crisp white background, studio high-key illumination with subtle natural cast shadow, water droplets on fresh berries, sharp macro photography focus, 4k commercial culinary photography',
    tool: 'midjourney',
    aspectRatio: '3:2',
    parameters: '--ar 3:2 --style raw --v 6.1',
    negativePrompt: 'dirty background, blur, artificial looking, dull colors, oversaturated, messy studio',
    hasCopySpace: true,
    isIsolatedWhite: true,
    suggestedKeywords: ['smoothie bowl', 'acai', 'healthy food', 'superfood', 'isolated on white', 'clean eating', 'organic', 'vegan', 'breakfast', 'culinary', 'fresh fruit']
  },
  {
    id: 'preset-green-energy-tech',
    niche: 'Sustentabilidade & Energia',
    titlePt: 'Engenheira com Tablet em Usina Solar com Copy Space',
    descriptionPt: 'Busca massiva no Adobe Stock para ESG, relatórios anuais e transição energética.',
    category: 10, // Indústria
    categoryName: 'Indústria',
    promptEn: 'Professional renewable energy engineer in safety vest and white hardhat reviewing data on digital tablet standing in expansive modern solar panel farm, golden hour sunset backlight creating warm cinematic rim light, wide angle perspective with clean open sky copy space on upper left, authentic documentary style, high-end commercial corporate photography',
    tool: 'midjourney',
    aspectRatio: '16:9',
    parameters: '--ar 16:9 --style raw --v 6.1 --stylize 100',
    negativePrompt: 'trademark logos, pollution, smoke, blurry, distorted tablet screen, low resolution',
    hasCopySpace: true,
    isIsolatedWhite: false,
    suggestedKeywords: ['solar energy', 'renewable power', 'engineer', 'sustainability', 'green technology', 'solar farm', 'clean energy', 'esg', 'copy space', 'golden hour']
  },
  {
    id: 'preset-abstract-tech-background',
    niche: 'Backgrounds & IA',
    titlePt: 'Textura Abstrata Fluida de IA com Espaço para Texto',
    descriptionPt: 'Essencial para apresentações corporativas, banners de software e posts de redes sociais.',
    category: 8, // Recursos Gráficos
    categoryName: 'Recursos Gráficos',
    promptEn: 'Elegant fluid wave typography background with iridescent indigo, cyan and violet gradients, smooth flowing curves with subtle glowing micro-particles, expansive clean minimalist negative space in center for typography and branding, soft diffused studio glow, 8k resolution premium wallpaper abstract background',
    tool: 'firefly',
    aspectRatio: '16:9',
    parameters: 'Photographic / Graphic, 16:9',
    negativePrompt: 'busy center, noisy, grain, dirty textures, chaotic lines, text artifacts',
    hasCopySpace: true,
    isIsolatedWhite: false,
    suggestedKeywords: ['abstract background', 'fluid waves', 'technology background', 'copy space', 'digital wave', 'gradient mesh', 'modern wallpaper', 'graphic resource', 'presentation slide']
  },
  {
    id: 'preset-isolated-pet-dog',
    niche: 'Animais de Estimação',
    titlePt: 'Filhote Golden Retriever Feliz Isolado em Fundo Branco',
    descriptionPt: 'Um dos temas mais baixados para pet shops, clínicas veterinárias e marcas de ração.',
    category: 1, // Animais
    categoryName: 'Animais',
    promptEn: 'Adorable golden retriever puppy sitting attentively looking curious and happy into lens with head tilted, fluffy clean coat, glistening expressive eyes, isolated on pure solid white background, commercial pet studio strobe lighting, crisp detail from nose to ears, high resolution stock photo',
    tool: 'stablediffusion',
    aspectRatio: '1:1',
    parameters: 'Steps: 30, Sampler: DPM++ 2M Karras, CFG: 7',
    negativePrompt: 'extra paws, deformed ears, dirty fur, red eye, dark studio, shadows on background, leash, collar brand',
    hasCopySpace: true,
    isIsolatedWhite: true,
    suggestedKeywords: ['golden retriever puppy', 'cute dog', 'pet care', 'puppy isolated on white', 'veterinary', 'dog food', 'playful dog', 'commercial animal photography']
  },
  {
    id: 'preset-nanobanana-startup-coworking',
    niche: 'Tecnologia & Startups',
    titlePt: 'Equipe de Tecnologia em Coworking com Amplo Copy Space',
    descriptionPt: 'Alta conversão para campanhas de software, landing pages de SaaS e artigos de negócios.',
    category: 19, // Tecnologia
    categoryName: 'Tecnologia',
    promptEn: 'Diverse enthusiastic tech startup founders brainstorming in sunlit modern industrial loft coworking space, natural joyful interaction around standing wooden desk with laptops and transparent glass planning board, left side composed with clean airy copy space, soft morning window light, shot with 35mm prime f/1.8 lens, authentic stock photography with natural realistic skin textures',
    tool: 'nanobanana',
    aspectRatio: '16:9',
    parameters: '--aspect 16:9 --style photorealistic --quality high',
    negativePrompt: 'plastic skin, distorted hands, brand logos, watermark, gloomy office, overprocessed, artificial blur',
    hasCopySpace: true,
    isIsolatedWhite: false,
    suggestedKeywords: ['startup', 'coworking', 'technology', 'teamwork', 'innovation', 'brainstorming', 'office lifestyle', 'copy space', 'digital nomads', 'modern business']
  },
  {
    id: 'preset-chatgpt-clean-workspace',
    niche: 'Home Office & Minimalismo',
    titlePt: 'Mesa de Trabalho Minimalista com Café e Amplo Espaço de Texto',
    descriptionPt: 'Top download constante para banners de produtividade, finanças pessoais e blogs de tecnologia.',
    category: 12, // Estilo de vida
    categoryName: 'Estilo de vida',
    promptEn: 'An aesthetic and serene minimalist workspace photographed from an eye-level angle. On the light-toned solid oak desk sits an open clean notebook with an elegant metal pen, a ceramic cup of black coffee with gentle steam, and a small potted succulent. Warm morning sunlight filters through sheer linen curtains casting soft architectural shadows, leaving generous negative copy space in the upper portion for advertising typography. Commercial microstock photography, tack sharp focus and inviting atmosphere.',
    tool: 'chatgpt',
    aspectRatio: '16:9',
    parameters: 'Photorealistic commercial stock style, 16:9 wide aspect ratio, natural lighting',
    negativePrompt: 'tangled cords, clutter, messy desk, plastic looking elements, fake corporate smiles, logos on mugs',
    hasCopySpace: true,
    isIsolatedWhite: false,
    suggestedKeywords: ['minimalist desk', 'home office', 'workspace', 'coffee cup', 'productivity', 'copy space', 'morning light', 'notebook', 'freelancer', 'calm aesthetic']
  }
];

export const BUILDER_OPTIONS = {
  niches: [
    { label: 'Negócios & Corporativo', value: 'Business & Corporate leadership, diverse professionals' },
    { label: 'Tecnologia, IA & Cyber', value: 'High-tech innovation, cloud computing, cybersecurity, modern devices' },
    { label: 'Saúde, Medicina & Telemedicina', value: 'Healthcare, wellness, hospital care, empathy, medical science' },
    { label: 'Gastronomia & Alimentos', value: 'Culinary gourmet food, fresh organic ingredients, artisan kitchen' },
    { label: 'Sustentabilidade & ESG', value: 'Renewable energy, ecology, sustainable lifestyle, recycling' },
    { label: 'Educação & Aprendizado', value: 'Students, digital e-learning, classrooms, university research' },
    { label: 'Família, Lifestyle & Hobbies', value: 'Authentic modern lifestyle, fitness, family moments, outdoor leisure' },
    { label: 'Renders 3D & Recursos Gráficos', value: 'Modern 3D isometric icons, claymorphism, abstract graphic assets' },
    { label: 'Animais & Natureza', value: 'Pets, wildlife, domestic animals in natural authentic settings' }
  ],
  visualGenres: [
    { label: 'Fotografia Comercial Autêntica', value: 'ultra photorealistic commercial stock photography, shot on Sony A7R V with prime lens' },
    { label: 'Isolado em Fundo Branco Puro', value: 'isolated on pure solid white studio background with soft natural drop shadow' },
    { label: 'Render 3D Moderno / Claymorphism', value: 'premium 3D render, smooth matte claymorphism texture, studio octane render quality' },
    { label: 'Ilustração Vetorial Comercial', value: 'modern flat vector illustration, clean lines, scalable aesthetic, trendy corporate palette' },
    { label: 'Cena com Amplo Espaço de Texto (Copy Space)', value: 'composition intentionally framed with wide empty negative copy space for text and banner layout' },
    { label: 'Cena de Mockup Minimalista', value: 'aesthetic minimalist mockup scene with natural soft sunlight and clean negative space' }
  ],
  lightingOptions: [
    { label: 'Luz Natural de Janela (Suave)', value: 'bright diffuse natural window daylight, soft flattering shadows' },
    { label: 'Estúdio Profissional (Strobe/Softbox)', value: 'clean professional studio lighting with dual softboxes and subtle rim light' },
    { label: 'Golden Hour (Luz Dourada)', value: 'warm golden hour sunbeams, lens flare, magical evening backlight' },
    { label: 'High-Key Iluminado & Limpo', value: 'crisp high-key lighting, bright airy atmospheric clarity' },
    { label: 'Cinematográfico com Luz de Borda (Rim Light)', value: 'cinematic atmospheric lighting with subtle rim light and rich contrast' }
  ],
  cameraAngles: [
    { label: 'Lente Retrato 85mm (Bokeh Suave)', value: 'shot on 85mm f/1.4 lens, shallow depth of field, creamy blurred bokeh background' },
    { label: 'Plano Médio Comercial (Regra dos Terços)', value: 'medium shot adhering to rule of thirds, subject on side third' },
    { label: 'Close-up Detalhado (Macro)', value: 'detailed close-up macro shot with tack-sharp focus on primary texture' },
    { label: 'Vista Superior (Flat Lay)', value: 'top-down flat lay perspective, meticulously arranged composition' },
    { label: 'Ângulo Aberto (Wide Cinematic)', value: 'wide angle 24mm architectural lens, expansive depth and perspective' }
  ],
  aspectRatios: [
    { label: '16:9 (Horizontal / Web Banner)', value: '16:9' as PromptAspectRatio },
    { label: '3:2 (Fotografia Clássica)', value: '3:2' as PromptAspectRatio },
    { label: '1:1 (Quadrado / Ícones / Redes)', value: '1:1' as PromptAspectRatio },
    { label: '4:5 (Vertical Comercial)', value: '4:5' as PromptAspectRatio },
    { label: '9:16 (Story / Banner Vertical)', value: '9:16' as PromptAspectRatio }
  ],
  tools: [
    { id: 'midjourney' as ImageGeneratorTool, name: 'Midjourney v6.1', badge: 'MJ v6.1', defaultParams: '--ar 16:9 --style raw --v 6.1 --stylize 100' },
    { id: 'flux' as ImageGeneratorTool, name: 'Flux.1 (Schnell / Dev)', badge: 'Flux.1', defaultParams: 'hyper-realistic, high detail' },
    { id: 'nanobanana' as ImageGeneratorTool, name: 'Nando Banana (Nano Banana)', badge: 'Banana AI', defaultParams: 'ultra-realistic, 4K commercial stock' },
    { id: 'chatgpt' as ImageGeneratorTool, name: 'ChatGPT (DALL-E 3)', badge: 'ChatGPT', defaultParams: 'vivid, commercial stock photo style' },
    { id: 'firefly' as ImageGeneratorTool, name: 'Adobe Firefly', badge: 'Firefly', defaultParams: 'Photo, Studio Lighting, 16:9' },
    { id: 'stablediffusion' as ImageGeneratorTool, name: 'Stable Diffusion SDXL', badge: 'SDXL', defaultParams: 'Steps: 30, CFG: 7' }
  ]
};

// --- Funções de Histórico e Favoritos no LocalStorage ---

const PROMPTS_STORAGE_KEY = 'stockmeta_saved_prompts';

export function getSavedPrompts(): StockPromptVariation[] {
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar prompts salvos:', e);
    return [];
  }
}

export function savePromptToStorage(prompt: StockPromptVariation): StockPromptVariation[] {
  try {
    const existing = getSavedPrompts();
    const filtered = existing.filter(p => p.id !== prompt.id);
    const updated = [prompt, ...filtered].slice(0, 50); // Mantém até 50 no histórico
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Falha ao salvar prompt:', e);
    return [];
  }
}

export function togglePromptFavorite(id: string): StockPromptVariation[] {
  try {
    const existing = getSavedPrompts();
    const updated = existing.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Falha ao atualizar favorito:', e);
    return [];
  }
}

export function deleteSavedPrompt(id: string): StockPromptVariation[] {
  try {
    const existing = getSavedPrompts();
    const updated = existing.filter(p => p.id !== id);
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Falha ao deletar prompt salvo:', e);
    return [];
  }
}
