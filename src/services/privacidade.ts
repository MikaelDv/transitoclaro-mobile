/**
 * Verificacao de privacidade NO CELULAR, antes de enviar o relato.
 * Usa as mesmas regras principais do modulo de Cybersecurity (motor PII): o passageiro e avisado
 * se escreveu CPF, telefone, e-mail, endereco, senha ou informacao de saude, e o app oferece
 * remover esses trechos. O relato e anonimo: esses dados nunca sao necessarios.
 */
export interface AvisoPrivacidade {
  tipo: string;
  trecho: string;
  inicio: number;
  fim: number;
}

function cpfValido(raw: string) {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (n: number) => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

const REGRAS: { tipo: string; re: RegExp; validar?: (s: string) => boolean }[] = [
  { tipo: 'CPF', re: /(?<![\d.])\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s.]?\d{2}(?!\d)/g, validar: cpfValido },
  { tipo: 'telefone', re: /(?<!\d)(?:\+?55\s?)?\(?[1-9]\d\)?\s?9\d{4}[-\s]?\d{4}(?!\d)/g },
  { tipo: 'e-mail', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g },
  { tipo: 'senha', re: /\b(?:senha|password)\s*(?:[:=]|[eé])\s*\S{4,}/gi },
  { tipo: 'endereço', re: /\b(?:moro|resido)\b[^.\n]{0,25}?\b(?:rua|av\.?|avenida|travessa|alameda)\s+[A-Za-zÀ-ú .]{3,40}?,?\s*\d{1,5}/gi },
  {
    tipo: 'informação de saúde',
    re: /\b(?:sou|tenho|estou\s+com|portador[a]?\s+de)\s+(?:um[a]?\s+)?(?:diab[eé]tic[oa]|diabetes|hipertens[aã]o|epil[eé]ptic[oa]|epilepsia|card[ií]ac[oa]|asm[aá]tic[oa]|asma|autista|cadeirante|deficiente|gr[aá]vida|gestante|hiv|c[aâ]ncer|depress[aã]o|ansiedade)|\bCID(?:-?10)?\s*[:\-]?\s*[A-TV-Z]\d{2}(?:\.\d)?/gi,
  },
];

export function verificarPrivacidade(texto: string): AvisoPrivacidade[] {
  const avisos: AvisoPrivacidade[] = [];
  for (const regra of REGRAS) {
    regra.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regra.re.exec(texto)) !== null) {
      if (regra.validar && !regra.validar(m[0])) continue;
      const fim = m.index + m[0].length;
      if (!avisos.some((a) => m!.index < a.fim && a.inicio < fim)) {
        avisos.push({ tipo: regra.tipo, trecho: m[0], inicio: m.index, fim });
      }
    }
  }
  return avisos.sort((a, b) => a.inicio - b.inicio);
}

export function removerDadosPessoais(texto: string): string {
  let out = texto;
  for (const a of verificarPrivacidade(texto).reverse()) out = out.slice(0, a.inicio) + '[removido]' + out.slice(a.fim);
  return out;
}
