import type { StatusLinha } from '@/constants/theme';
import type { NivelLotacao, TipoOcorrencia } from '@/types';

/** Relato enviado pelo proprio usuario (historico local + fila de sincronizacao offline). */
export interface RelatoLocal {
  id: number;
  linha_id: number;
  linha_nome: string;
  tipo: TipoOcorrencia;
  nivel_lotacao: NivelLotacao | null;
  minutos_atraso: number | null;
  descricao: string | null;
  criado_em: string;
  sincronizado: number; // 0 = aguardando internet, 1 = enviado para a API
  remoto_id: number | null;
}

export interface Trajeto {
  id: number;
  nome: string;
  horario_saida: string; // HH:MM
  linha_ids: number[];
  criado_em: string;
}

export interface AlertaLocal {
  id: number;
  trajeto_id: number;
  status: StatusLinha;
  mensagem: string;
  linha_mais_afetada: string | null;
  criado_em: string;
}

export type NovoRelatoLocal = Omit<RelatoLocal, 'id' | 'criado_em' | 'sincronizado' | 'remoto_id'>;
