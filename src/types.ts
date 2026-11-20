import type { StatusLinha } from '@/constants/theme';

// Contratos da API TransitoClaro (backend SOA, JSON em snake_case)
export type TipoTransporte = 'METRO' | 'TREM' | 'BRT';
export type TipoOcorrencia = 'ATRASO' | 'LOTACAO' | 'FALHA_OPERACIONAL';
export type NivelLotacao = 'VAZIO' | 'TRANQUILO' | 'CHEIO' | 'LOTADO';

export interface Linha {
  id: number;
  nome: string;
  tipo: TipoTransporte;
  operadora: string;
  cor: string | null;
}

export interface StatusLinhaApi {
  linha_id: number;
  linha: string;
  tipo: TipoTransporte;
  status: StatusLinha;
  atraso_medio_minutos: number;
  lotacao_predominante: NivelLotacao | null;
  total_relatos: number;
  janela_minutos: number;
  mensagem: string;
}

export interface RelatoApi {
  id: number;
  linha_id: number;
  linha_nome: string;
  tipo: TipoOcorrencia;
  nivel_lotacao: NivelLotacao | null;
  minutos_atraso: number | null;
  descricao: string | null;
  criado_em: string;
}

export interface NovoRelato {
  linha_id: number;
  tipo: TipoOcorrencia;
  nivel_lotacao?: NivelLotacao | null;
  minutos_atraso?: number | null;
  descricao?: string | null;
}

/** De onde veio o dado mostrado na tela: API real ou dados de exemplo (offline). */
export type Origem = 'api' | 'exemplo';
export interface Resultado<T> {
  dados: T;
  origem: Origem;
}
