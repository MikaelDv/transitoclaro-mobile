import type { StatusLinha } from '@/constants/theme';
import type { Linha, NivelLotacao, RelatoApi, StatusLinhaApi, TipoOcorrencia } from '@/types';

/**
 * Dados de EXEMPLO (simulados) usados quando a API nao responde (sem internet, servidor desligado,
 * navegador sem CORS). As linhas sao as mesmas da migracao V3 do backend.
 * Nenhum dado pessoal: relatos sao anonimos.
 */
export const LINHAS_EXEMPLO: Linha[] = [
  { id: 1, nome: 'Linha 1-Azul', tipo: 'METRO', operadora: 'Metrô SP', cor: 'Azul' },
  { id: 2, nome: 'Linha 2-Verde', tipo: 'METRO', operadora: 'Metrô SP', cor: 'Verde' },
  { id: 3, nome: 'Linha 3-Vermelha', tipo: 'METRO', operadora: 'Metrô SP', cor: 'Vermelha' },
  { id: 4, nome: 'Linha 11-Coral', tipo: 'TREM', operadora: 'CPTM', cor: 'Coral' },
  { id: 5, nome: 'Linha 9-Esmeralda', tipo: 'TREM', operadora: 'ViaMobilidade', cor: 'Esmeralda' },
  { id: 6, nome: 'Corredor Expresso Tiradentes', tipo: 'BRT', operadora: 'SPTrans', cor: null },
];

type Semente = [linhaId: number, tipo: TipoOcorrencia, minutosAtras: number, extra: number | NivelLotacao | null, descricao: string | null];
const SEMENTES: Semente[] = [
  [4, 'ATRASO', 5, 18, 'Trem parado entre Guaianases e Itaquera'],
  [4, 'ATRASO', 12, 22, null],
  [4, 'LOTACAO', 20, 'LOTADO', 'Plataforma cheia em Tatuapé'],
  [3, 'LOTACAO', 8, 'CHEIO', 'Muito cheio na Sé'],
  [3, 'ATRASO', 15, 7, null],
  [3, 'LOTACAO', 30, 'LOTADO', null],
  [6, 'FALHA_OPERACIONAL', 10, null, 'Ônibus quebrado no corredor'],
  [2, 'LOTACAO', 25, 'TRANQUILO', null],
  [1, 'LOTACAO', 40, 'TRANQUILO', 'Fluindo bem'],
];

export function relatosExemplo(): RelatoApi[] {
  const agora = Date.now();
  return SEMENTES.map(([linhaId, tipo, minAtras, extra, descricao], i) => ({
    id: 900 + i,
    linha_id: linhaId,
    linha_nome: LINHAS_EXEMPLO.find((l) => l.id === linhaId)!.nome,
    tipo,
    minutos_atraso: tipo === 'ATRASO' ? (extra as number) : null,
    nivel_lotacao: tipo === 'LOTACAO' ? (extra as NivelLotacao) : null,
    descricao,
    criado_em: new Date(agora - minAtras * 60_000).toISOString(),
  }));
}

/** Mesmas regras do ClassificadorPorRelatos do backend, para o modo offline ser coerente. */
export function classificar(relatos: RelatoApi[]): { status: StatusLinha; atrasoMedio: number; lotacao: NivelLotacao | null } {
  const atrasos = relatos.filter((r) => r.tipo === 'ATRASO' && r.minutos_atraso != null).map((r) => r.minutos_atraso!);
  const atrasoMedio = atrasos.length ? atrasos.reduce((a, b) => a + b, 0) / atrasos.length : 0;
  const lot = relatos.filter((r) => r.tipo === 'LOTACAO' && r.nivel_lotacao).map((r) => r.nivel_lotacao!);
  const pctLotado = lot.length ? lot.filter((n) => n === 'LOTADO').length / lot.length : 0;
  const pctCheio = lot.length ? lot.filter((n) => n === 'CHEIO' || n === 'LOTADO').length / lot.length : 0;
  const falhas = relatos.filter((r) => r.tipo === 'FALHA_OPERACIONAL').length;

  const contagem = new Map<NivelLotacao, number>();
  lot.forEach((n) => contagem.set(n, (contagem.get(n) ?? 0) + 1));
  const lotacao = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  let status: StatusLinha = 'NORMAL';
  if (atrasoMedio >= 15 || pctLotado >= 0.5 || falhas >= 3) status = 'CRITICO';
  else if (atrasoMedio >= 5 || pctCheio >= 0.5 || falhas >= 1) status = 'MODERADO';
  return { status, atrasoMedio, lotacao };
}

const MENSAGEM: Record<StatusLinha, string> = {
  NORMAL: 'Linha operando normalmente.',
  MODERADO: 'Linha com lentidão ou lotação. Saia com antecedência.',
  CRITICO: 'Problemas graves na linha. Considere outra rota.',
};

export function statusExemplo(extras: RelatoApi[] = [], janelaMinutos = 60): StatusLinhaApi[] {
  const limite = Date.now() - janelaMinutos * 60_000;
  const todos = [...relatosExemplo(), ...extras].filter((r) => new Date(r.criado_em).getTime() >= limite);
  const ordem: Record<StatusLinha, number> = { CRITICO: 0, MODERADO: 1, NORMAL: 2 };
  return LINHAS_EXEMPLO.map((l) => {
    const daLinha = todos.filter((r) => r.linha_id === l.id);
    const c = classificar(daLinha);
    return {
      linha_id: l.id,
      linha: l.nome,
      tipo: l.tipo,
      status: c.status,
      atraso_medio_minutos: Math.round(c.atrasoMedio * 10) / 10,
      lotacao_predominante: c.lotacao,
      total_relatos: daLinha.length,
      janela_minutos: janelaMinutos,
      mensagem: MENSAGEM[c.status],
    };
  }).sort((a, b) => ordem[a.status] - ordem[b.status]);
}
