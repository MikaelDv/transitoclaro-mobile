import type { AlertaLocal, NovoRelatoLocal, RelatoLocal, Trajeto } from './tipos';

/**
 * Versao WEB do banco (usada so na pre-visualizacao no navegador).
 * No celular (Android/iOS) o app usa SQLite real: ver database.ts.
 * Mesma interface, persistida em localStorage.
 */
type Tabelas = { meus_relatos: RelatoLocal[]; trajetos: Trajeto[]; alertas: AlertaLocal[]; config: Record<string, string> };
const CHAVE = 'transitoclaro.db';

function ler(): Tabelas {
  try {
    const raw = globalThis.localStorage?.getItem(CHAVE);
    if (raw) return JSON.parse(raw) as Tabelas;
  } catch {
    // armazenamento indisponivel (aba anonima): segue com banco vazio em memoria
  }
  return { meus_relatos: [], trajetos: [], alertas: [], config: {} };
}
let mem = ler();
function gravar() {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(mem));
  } catch {
    // ignora: os dados continuam em memoria nesta sessao
  }
}
const proxId = (l: { id: number }[]) => l.reduce((m, x) => Math.max(m, x.id), 0) + 1;

export async function salvarRelato(r: NovoRelatoLocal, sincronizado: boolean, remotoId: number | null) {
  const id = proxId(mem.meus_relatos);
  mem.meus_relatos.push({ ...r, id, criado_em: new Date().toISOString(), sincronizado: sincronizado ? 1 : 0, remoto_id: remotoId });
  gravar();
  return id;
}
export async function listarRelatos() {
  return [...mem.meus_relatos].sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}
export async function relatosPendentes() {
  return mem.meus_relatos.filter((r) => r.sincronizado === 0);
}
export async function marcarSincronizado(id: number, remotoId: number) {
  mem.meus_relatos = mem.meus_relatos.map((r) => (r.id === id ? { ...r, sincronizado: 1, remoto_id: remotoId } : r));
  gravar();
}
export async function apagarHistorico() {
  mem.meus_relatos = [];
  gravar();
}
export async function salvarTrajeto(nome: string, horario: string, linhaIds: number[]) {
  const id = proxId(mem.trajetos);
  mem.trajetos.push({ id, nome, horario_saida: horario, linha_ids: linhaIds, criado_em: new Date().toISOString() });
  gravar();
  return id;
}
export async function listarTrajetos() {
  return [...mem.trajetos].sort((a, b) => a.horario_saida.localeCompare(b.horario_saida));
}
export async function removerTrajeto(id: number) {
  mem.trajetos = mem.trajetos.filter((t) => t.id !== id);
  mem.alertas = mem.alertas.filter((a) => a.trajeto_id !== id);
  gravar();
}
export async function salvarAlerta(a: Omit<AlertaLocal, 'id' | 'criado_em'>) {
  mem.alertas.push({ ...a, id: proxId(mem.alertas), criado_em: new Date().toISOString() });
  gravar();
}
export async function ultimosAlertas() {
  const ultimo = new Map<number, AlertaLocal>();
  for (const a of mem.alertas) ultimo.set(a.trajeto_id, a);
  return [...ultimo.values()];
}
export async function lerConfig(chave: string) {
  return mem.config[chave] ?? null;
}
export async function gravarConfig(chave: string, valor: string) {
  mem.config[chave] = valor;
  gravar();
}
