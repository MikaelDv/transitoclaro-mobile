// Paleta de alto contraste (WCAG AA) pensada para uso na rua, com sol na tela.
export const Cores = {
  fundo: '#F4F5F7',
  cartao: '#FFFFFF',
  texto: '#14161A',
  textoSecundario: '#4A505C',
  borda: '#D5D9E0',
  primaria: '#B00D47', // magenta FIAP escurecido para contraste 4.5:1 com branco
  primariaTexto: '#FFFFFF',
  normal: '#0B7A3E',
  normalFundo: '#E3F5EA',
  moderado: '#8A5A00',
  moderadoFundo: '#FFF2D6',
  critico: '#B3261E',
  criticoFundo: '#FDE4E2',
  aviso: '#7A4B00',
  avisoFundo: '#FFF4D6',
};

export type StatusLinha = 'NORMAL' | 'MODERADO' | 'CRITICO';

// Status nunca e comunicado so por cor: sempre icone + palavra.
export const STATUS_VISUAL: Record<StatusLinha, { cor: string; fundo: string; icone: string; rotulo: string }> = {
  NORMAL: { cor: Cores.normal, fundo: Cores.normalFundo, icone: '✓', rotulo: 'Normal' },
  MODERADO: { cor: Cores.moderado, fundo: Cores.moderadoFundo, icone: '!', rotulo: 'Atenção' },
  CRITICO: { cor: Cores.critico, fundo: Cores.criticoFundo, icone: '✕', rotulo: 'Problema grave' },
};

export const Espaco = { xs: 4, sm: 8, md: 16, lg: 24 };
export const TOQUE_MINIMO = 48; // area minima de toque recomendada (Android/WCAG)
