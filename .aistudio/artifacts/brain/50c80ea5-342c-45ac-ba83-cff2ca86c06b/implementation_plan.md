# Adobe Stock AI Contributor Compliance & Quality Suite

Transformação do StockMeta em uma plataforma de preparação e validação profissional para colaboradores do Adobe Stock, adicionando classificação de categorias oficiais (1 a 21), verificação de resolução técnica (4MP), validador anti-rejeição de propriedade intelectual/marcas e controle estrito de limites do Adobe Stock.

> [!IMPORTANT]
> **Decisões Críticas de Produto & Políticas do Adobe Stock:**
> - **Classificação Oficial (1 a 21)**: A IA identificará o tema da imagem e atribuirá automaticamente o código e nome da categoria oficial do Adobe Stock. O valor será exibido no card de cada imagem (com seletor manual para ajuste se desejado) e exportado na coluna `category` da planilha CSV oficial.
> - **Validador de Resolução Técnica (4 Megapixels)**: Ao carregar a imagem no navegador, o sistema lê as dimensões nativas (`naturalWidth * naturalHeight`). Imagens com menos de 4.000.000 pixels recebem um alerta preventivo em vermelho/âmbar no grid, indicando a resolução exata e aviso de que o Adobe Stock rejeitará arquivos abaixo de 4MP.
> - **Detector Anti-Rejeição de Marcas (Compliance Checker)**: Verificação contínua no título e palavras-chave contra um catálogo abrangente de marcas comerciais, tecnologias e nomes protegidos (Apple, iPhone, Nike, Disney, Marvel, Photoshop, Coca-Cola, etc.). Os termos infratores são destacados com aviso e opção de remoção/substituição com 1 clique.
> - **Trava de Limites Oficiais**: O sistema limita o título aos 200 caracteres máximos permitidos pelo Adobe Stock com contador visual dinâmico e avisa caso a contagem de tags exceda 49 palavras-chave.

---

## 1. Visão Geral e Conceito Central

- **O que faz**: O sistema analisa as imagens e gera metadados rigorosamente alinhados aos critérios de aceitação do Adobe Stock, alertando o colaborador antes do upload sobre potenciais motivos de rejeição (resolução insuficiente, marcas registradas, limites de caracteres e contagem de tags) e gerando o arquivo CSV pronto no padrão oficial da plataforma.
- **Público-Alvo**: Criadores e artistas de IA generativa (Midjourney, Flux, Stable Diffusion, Ideogram) que vendem pacotes e séries de imagens no Adobe Stock e necessitam de aprovação rápida e sem atritos de moderação.
- **Valor Principal**: Eliminar rejeições de lote causadas por infrações de marca registrada, resolução abaixo de 4MP ou erros de formatação de CSV, aumentando a velocidade de aceitação e as vendas do portfólio.

---

## 2. Experiência do Usuário e Design Visual

### Fluxos Principais
1. **Upload & Análise Inicial de Dimensões**: Ao soltar as imagens no uploader, o sistema inspeciona imediatamente as dimensões do arquivo. Imagens válidas (≥ 4.0 MP) recebem indicador de conformidade técnica; arquivos com resolução inferior (< 4.0 MP) recebem aviso explicativo com cálculo de megapixels (ex: *2.8 MP — Adobe Stock exige mín. 4 MP*).
2. **Geração com Categoria Oficial**: Durante o processamento por IA (Gemini ou DeepSeek), o modelo analisa a composição e infere uma das 21 categorias numéricas do Adobe Stock (ex: `8 - Recursos Gráficos`, `3 - Negócios`, `19 - Tecnologia`).
3. **Painel de Compliance & Auditoria Anti-Rejeição**:
   - Cada card exibe o status de conformidade: resolução, categoria atribuída, contagem de caracteres do título (0–200) e contagem de palavras-chave (0–49).
   - Se uma marca registrada for detectada (ex: menção a *iPad*, *Lego*, *Ferrari*), um painel de alerta surge com o botão *"Substituir por termo genérico"* ou *"Remover termo"*.
4. **Exportação CSV Oficial Adobe Stock**: O botão de exportação gera a planilha formatada com as colunas padrão aceitas pelo portal do colaborador: `Filename`, `Title`, `Keywords`, `Category`.

### Identidade Visual e Estilo
- **Ambiente Profissional Escuro/Refinado**: Mantendo a consistência do tema escuro moderno do StockMeta (`slate-950` a `slate-900`) com acentos em índigo e violeta.
- **Tipografia & Numerais Tabulares**: Contadores de caracteres, megapixels e dimensões formatados com numerais monoespaçados (`font-mono tabular-nums`) para leitura precisa e sem oscilações.
- **Feedback Semântico Claro**:
  - *Verde Esmeralda*: Imagem com resolução aprovada, título dentro dos limites e sem marcas detectadas.
  - *Âmbar / Amarelo*: Alertas não-bloqueantes (ex: 48 palavras-chave, título próximo de 200 caracteres).
  - *Vermelho Rosa*: Violações críticas (abaixo de 4MP ou presença confirmada de marca registrada protegida).

---

## 3. Decisões de Produto e Trade-Offs

- **Leitura de Resolução no Cliente (Browser)**:
  - *Abordagem*: Utilizar o objeto `Image()` nativo no navegador no momento do upload para extrair `naturalWidth` e `naturalHeight` de forma instantânea em 0ms, sem sobrecarregar o backend com decodificação pesada de imagem.
  - *Vantagem*: Feedback instantâneo para o usuário antes mesmo de gastar tokens de IA em imagens que seriam rejeitadas pelo Adobe Stock.
- **Catálogo de Marcas em Duas Camadas (Frontend + Prompt de IA)**:
  - *Abordagem*: No prompt da IA, instruir explicitamente a proibição de nomes comerciais e marcas registradas. No frontend, manter um validador regex/dicionário em tempo real (mais de 100 marcas e termos frequentes) que verifica tanto o retorno da IA quanto edições manuais feitas pelo usuário.
- **Categorias Oficiais do Adobe Stock**:
  - *Abordagem*: Mapeamento estrito das 21 categorias canônicas do Adobe Stock no schema de retorno da IA e no gerador de CSV, garantindo que a coluna numérica seja válida de 1 a 21.

---

## 4. Arquitetura Técnica e Estratégia de Dados

```
┌────────────────────────────────────────────────────────────────────────┐
│                          FLUXO DO SISTEMA                              │
└────────────────────────────────────────────────────────────────────────┘

    [ Arquivo de Imagem ]
            │
            ├────► Validação de Resolução no Cliente (HTML Image)
            │      └─► Largura x Altura ──► Megapixels (>= 4.0 MP)
            │
            ▼
    [ API /api/generate ] (Gemini 3.7 Flash / DeepSeek)
            │
            ├─► Extração Visual + Instrução de Categorização (1 a 21)
            ├─► Bloqueio de Marcas no Prompt
            │
            ▼
    [ Resposta Estruturada ]
            ├─► title (max 200 chars)
            ├─► keywords (max 49 tags)
            └─► category (1 a 21)
            │
            ▼
    [ Validador de Compliance Frontend ]
            ├─► Análise Léxica de Marcas Registradas (Dicionário de IP)
            ├─► Validação de Tamanho de Título (<= 200 chars)
            ├─► Validação de Tags (<= 49 tags)
            └─► Alertas Visuais com Botão de Limpeza Rápida
            │
            ▼
    [ Exportador CSV Adobe Stock ]
            └─► Colunas: Filename, Title, Keywords, Category
```

### Entidades e Extensão de Tipos (`types.ts`)
```ts
export interface ImageResolution {
  width: number;
  height: number;
  megapixels: number;
  isCompliant: boolean; // >= 4.0 MP
}

export interface ComplianceReport {
  isResolutionCompliant: boolean;
  isTitleLengthCompliant: boolean;
  isKeywordCountCompliant: boolean;
  flaggedBrands: string[];
  hasWarnings: boolean;
}

export interface GeneratedData {
  title: string;
  keywords: string[];
  category?: number; // Categoria oficial de 1 a 21
  categoryName?: string;
}

export interface ImageJob {
  id: string;
  file: File;
  previewUrl: string;
  status: ImageJobStatus;
  data: GeneratedData | null;
  error: string | null;
  resolution?: ImageResolution;
  compliance?: ComplianceReport;
}
```

### Categorias Oficiais do Adobe Stock (1 a 21)
1. Animais
2. Edifícios e Arquitetura
3. Negócios
4. Bebidas
5. Meio ambiente
6. Estados de espírito e pessoas
7. Comida
8. Recursos Gráficos
9. Hobbies e lazer
10. Indústria
11. Paisagens
12. Estilo de vida
13. Pessoas
14. Plantas e flores
15. Cultura e religião
16. Ciência
17. Questões sociais
18. Esportes
19. Tecnologia
20. Transporte
21. Viagens
