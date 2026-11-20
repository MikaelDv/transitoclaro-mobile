import * as SQLite from 'expo-sqlite';

import type { AlertaLocal, NovoRelatoLocal, RelatoLocal, Trajeto } from './tipos';

/**
 * Banco local do app (SQLite via expo-sqlite).
 *  - meus_relatos : historico do que o usuario enviou + fila offline (sincronizado = 0)
 *  - trajetos     : rotas do dia a dia (ex.: Casa-Faculdade) com as linhas usadas
 *  - alertas      : resultado de cada verificacao de trajeto ("pode sair" / "saia antes" / "evite")
 *  - config       : preferencias (endereco da API, texto grande)
 * Nada aqui e dado pessoal: o app nao pede nome, CPF nem telefone.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function db() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const d = await SQLite.openDatabaseAsync('transitoclaro.db');
      await d.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS meus_relatos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          linha_id INTEGER NOT NULL,
          linha_nome TEXT NOT NULL,
          tipo TEXT NOT NULL,
          nivel_lotacao TEXT,
          minutos_atraso INTEGER,
          descricao TEXT,
          criado_em TEXT NOT NULL,
          sincronizado INTEGER NOT NULL DEFAULT 0,
          remoto_id INTEGER
        );
        CREATE TABLE IF NOT EXISTS trajetos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          horario_saida TEXT NOT NULL,
          linha_ids TEXT NOT NULL,
          criado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS alertas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trajeto_id INTEGER NOT NULL REFERENCES trajetos(id) ON DELETE CASCADE,
          status TEXT NOT NULL,
          mensagem TEXT NOT NULL,
          linha_mais_afetada TEXT,
          criado_em TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS config (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
      `);
      return d;
    })();
  }
  return dbPromise;
}

// ---------- relatos ----------
export async function salvarRelato(r: NovoRelatoLocal, sincronizado: boolean, remotoId: number | null): Promise<number> {
  const d = await db();
  const res = await d.runAsync(
    `INSERT INTO meus_relatos (linha_id, linha_nome, tipo, nivel_lotacao, minutos_atraso, descricao, criado_em, sincronizado, remoto_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    r.linha_id, r.linha_nome, r.tipo, r.nivel_lotacao, r.minutos_atraso, r.descricao, new Date().toISOString(), sincronizado ? 1 : 0, remotoId,
  );
  return res.lastInsertRowId;
}

export async function listarRelatos(): Promise<RelatoLocal[]> {
  return (await db()).getAllAsync<RelatoLocal>('SELECT * FROM meus_relatos ORDER BY criado_em DESC LIMIT 100');
}

export async function relatosPendentes(): Promise<RelatoLocal[]> {
  return (await db()).getAllAsync<RelatoLocal>('SELECT * FROM meus_relatos WHERE sincronizado = 0 ORDER BY criado_em');
}

export async function marcarSincronizado(id: number, remotoId: number): Promise<void> {
  await (await db()).runAsync('UPDATE meus_relatos SET sincronizado = 1, remoto_id = ? WHERE id = ?', remotoId, id);
}

export async function apagarHistorico(): Promise<void> {
  await (await db()).runAsync('DELETE FROM meus_relatos');
}

// ---------- trajetos ----------
type TrajetoRow = Omit<Trajeto, 'linha_ids'> & { linha_ids: string };
const paraTrajeto = (t: TrajetoRow): Trajeto => ({ ...t, linha_ids: JSON.parse(t.linha_ids) });

export async function salvarTrajeto(nome: string, horario: string, linhaIds: number[]): Promise<number> {
  const res = await (await db()).runAsync(
    'INSERT INTO trajetos (nome, horario_saida, linha_ids, criado_em) VALUES (?, ?, ?, ?)',
    nome, horario, JSON.stringify(linhaIds), new Date().toISOString(),
  );
  return res.lastInsertRowId;
}

export async function listarTrajetos(): Promise<Trajeto[]> {
  const rows = await (await db()).getAllAsync<TrajetoRow>('SELECT * FROM trajetos ORDER BY horario_saida');
  return rows.map(paraTrajeto);
}

export async function removerTrajeto(id: number): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM alertas WHERE trajeto_id = ?', id);
  await d.runAsync('DELETE FROM trajetos WHERE id = ?', id);
}

// ---------- alertas ----------
export async function salvarAlerta(a: Omit<AlertaLocal, 'id' | 'criado_em'>): Promise<void> {
  await (await db()).runAsync(
    'INSERT INTO alertas (trajeto_id, status, mensagem, linha_mais_afetada, criado_em) VALUES (?, ?, ?, ?, ?)',
    a.trajeto_id, a.status, a.mensagem, a.linha_mais_afetada, new Date().toISOString(),
  );
}

export async function ultimosAlertas(): Promise<AlertaLocal[]> {
  return (await db()).getAllAsync<AlertaLocal>(
    'SELECT * FROM alertas WHERE id IN (SELECT MAX(id) FROM alertas GROUP BY trajeto_id)',
  );
}

// ---------- config ----------
export async function lerConfig(chave: string): Promise<string | null> {
  const row = await (await db()).getFirstAsync<{ valor: string }>('SELECT valor FROM config WHERE chave = ?', chave);
  return row?.valor ?? null;
}

export async function gravarConfig(chave: string, valor: string): Promise<void> {
  await (await db()).runAsync('INSERT OR REPLACE INTO config (chave, valor) VALUES (?, ?)', chave, valor);
}
