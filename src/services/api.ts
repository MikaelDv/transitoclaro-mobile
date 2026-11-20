import { Platform } from 'react-native';

import { gravarConfig, lerConfig, listarRelatos, marcarSincronizado, relatosPendentes } from '@/db/database';
import type { Linha, NovoRelato, RelatoApi, Resultado, StatusLinhaApi } from '@/types';

import { LINHAS_EXEMPLO, relatosExemplo, statusExemplo } from './mock';

/**
 * Cliente da API TransitoClaro (backend SOA: Spring Boot, porta 8080).
 * Toda chamada tem tempo limite; se a API nao responder, o app usa dados de EXEMPLO
 * e avisa o usuario na tela (nunca fica em branco por falta de rede).
 */
const URL_PADRAO = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
const TEMPO_LIMITE_MS = 4000;

export async function urlApi(): Promise<string> {
  return (await lerConfig('api_url')) ?? URL_PADRAO;
}
export async function definirUrlApi(url: string) {
  await gravarConfig('api_url', url.trim().replace(/\/+$/, ''));
}

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const base = await urlApi();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TEMPO_LIMITE_MS);
  try {
    const res = await fetch(`${base}${caminho}`, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
    });
    if (!res.ok) {
      const problema = await res.json().catch(() => null);
      throw new ErroApi(res.status, problema?.detail ?? `Erro ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export class ErroApi extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

/** Relatos do proprio usuario ainda nao enviados entram no calculo offline. */
async function relatosLocaisComoApi(): Promise<RelatoApi[]> {
  const locais = await listarRelatos();
  return locais.map((r) => ({ ...r, id: -r.id }));
}

export async function buscarStatus(): Promise<Resultado<StatusLinhaApi[]>> {
  try {
    return { dados: await chamar<StatusLinhaApi[]>('/status?janela_minutos=60'), origem: 'api' };
  } catch {
    return { dados: statusExemplo(await relatosLocaisComoApi()), origem: 'exemplo' };
  }
}

export async function buscarLinhas(): Promise<Resultado<Linha[]>> {
  try {
    return { dados: await chamar<Linha[]>('/linhas'), origem: 'api' };
  } catch {
    return { dados: LINHAS_EXEMPLO, origem: 'exemplo' };
  }
}

export async function buscarRelatosDaLinha(linhaId: number): Promise<Resultado<RelatoApi[]>> {
  try {
    const pagina = await chamar<{ itens: RelatoApi[] }>(`/relatos?linha_id=${linhaId}&tamanho=20`);
    return { dados: pagina.itens, origem: 'api' };
  } catch {
    const todos = [...(await relatosLocaisComoApi()), ...relatosExemplo()];
    return {
      dados: todos.filter((r) => r.linha_id === linhaId).sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
      origem: 'exemplo',
    };
  }
}

/** Envia o relato. Lanca ErroApi se a API recusar (validacao); devolve null se estiver offline. */
export async function enviarRelato(r: NovoRelato): Promise<RelatoApi | null> {
  try {
    return await chamar<RelatoApi>('/relatos', { method: 'POST', body: JSON.stringify(r) });
  } catch (e) {
    if (e instanceof ErroApi) throw e;
    return null; // sem rede: fica na fila local
  }
}

/** Reenvia a fila offline. Devolve quantos relatos foram sincronizados. */
export async function sincronizarPendentes(): Promise<number> {
  let enviados = 0;
  for (const p of await relatosPendentes()) {
    const r = await enviarRelato({
      linha_id: p.linha_id,
      tipo: p.tipo,
      nivel_lotacao: p.nivel_lotacao,
      minutos_atraso: p.minutos_atraso,
      descricao: p.descricao,
    }).catch(() => null);
    if (!r) break;
    await marcarSincronizado(p.id, r.id);
    enviados++;
  }
  return enviados;
}
