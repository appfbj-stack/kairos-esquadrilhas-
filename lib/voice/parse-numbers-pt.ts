// Conversor de numero por extenso em portugues -> inteiro.
// Sem LLM: dicionarios + parser sequencial simples.
//
// Uso:
//   parsePtNumber("dois mil") -> 2000
//   parsePtNumber("mil e quinhentos") -> 1500
//   parsePtNumber("novecentos e oitenta e quatro") -> 984
//   parsePtNumber("tres milhoes e quinhentos mil") -> 3500000

const UNITS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2,
  tres: 3, quatro: 4, cinco: 5, seis: 6,
  sete: 7, oito: 8, nove: 9,
};

const TEENS: Record<string, number> = {
  dez: 10, onze: 11, doze: 12, treze: 13,
  catorze: 14, quatorze: 14, quinze: 15,
  dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
};

const TENS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40,
  cinquenta: 50,
  sessenta: 60, setenta: 70, oitenta: 80, noventa: 90,
};

// A normalizacao remove acentos, entao "cinqUenta"/"cinq\u00fcenta"/"cinquenta"
// viram todos "cinquenta" (cobre todas as variacoes).

const HUNDREDS: Record<string, number> = {
  cem: 100, cento: 100,
  duzentos: 200, duzentas: 200,
  trezentos: 300, trezentas: 300,
  quatrocentos: 400, quatrocentas: 400,
  quinhentos: 500, quinhentas: 500,
  seiscentos: 600, seiscentas: 600,
  setecentos: 700, setecentas: 700,
  oitocentos: 800, oitocentas: 800,
  novecentos: 900, novecentas: 900,
};

function normalize(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function tokenValue(tok: string): number | null {
  if (UNITS[tok] !== undefined) return UNITS[tok];
  if (TEENS[tok] !== undefined) return TEENS[tok];
  if (TENS[tok] !== undefined) return TENS[tok];
  if (HUNDREDS[tok] !== undefined) return HUNDREDS[tok];
  return null;
}

/**
 * Faz parse de uma string em portugues para um numero inteiro >= 0.
 * Retorna null se nenhum numero for reconhecido.
 *
 * Algoritmo: processa tokens da esquerda para a direita.
 * - "e" e "de" sao conectivos (ignorados).
 * - Centenas/dezenas/unidades somam em "current".
 * - "mil" / "milhao(es)" / "bilhao(es)" multiplicam o current pela escala
 *   e somam em "total". "current" reseta para zero depois.
 */
export function parsePtNumber(input: string): number | null {
  if (!input) return null;

  // Remove tudo que nao for letra/espaco (o reconhecedor pode por virgula, etc).
  const cleaned = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;

  // Primeiro, se ja tem numero arabico, usa direto.
  const arabic = cleaned.match(/\d+/);
  if (arabic) {
    const n = Number(arabic[0]);
    if (Number.isFinite(n)) return n;
  }

  const tokens = cleaned.split(' ').filter(Boolean);
  let total = 0;
  let current = 0;
  let sawAnything = false;

  for (const raw of tokens) {
    const tok = normalize(raw);
    if (tok === '' || tok === 'e' || tok === 'de' || tok === 'da' || tok === 'do') continue;

    if (tok === 'mil') {
      // "mil" sozinho = 1000; mas se ha algo acumulado em current, multiplica.
      const factor = current === 0 ? 1 : current;
      total += factor * 1000;
      current = 0;
      sawAnything = true;
      continue;
    }
    if (tok === 'milhao' || tok === 'milhoes') {
      const factor = current === 0 ? 1 : current;
      total += factor * 1_000_000;
      current = 0;
      sawAnything = true;
      continue;
    }
    if (tok === 'bilhao' || tok === 'bilhoes') {
      const factor = current === 0 ? 1 : current;
      total += factor * 1_000_000_000;
      current = 0;
      sawAnything = true;
      continue;
    }

    const v = tokenValue(tok);
    if (v !== null) {
      current += v;
      sawAnything = true;
      continue;
    }

    // Token nao reconhecido (ex.: adverbio "so/apenas", "por favor", etc,
    // OU palavras de campo "largura"/"altura" no meio).
    // - Se ainda NAO comecamos nenhum numero: ignora (palavra de ruido inicial).
    // - Se ja temos numero em construcao MAS acabamos de fechar um
    //   bloco (current=0 apos um "mil"/"milhao"): termina aqui.
    // - Se temos numero "aberto" (current > 0): ignora (assume adverbio no meio).
    if (!sawAnything || current > 0) {
      continue;
    }
    break;
  }

  if (!sawAnything) return null;
  return total + current;
}

/**
 * Extrai varios inteiros >= 1 de uma string. Util para frases como
 * "largura dois mil altura mil e quinhentos" ou "3000 por 1500".
 *
 * Algoritmo (em ordem):
 * 1. Extrai numeros arabicos diretos.
 * 2. Tenta parsear a string INTEIRA como um unico numero. Se conseguir,
 *    usa ele (e nao quebra nada).
 * 3. Se nao conseguir OU se a string contiver separadores de campo,
 *    quebra em segmentos usando apenas separadores EXPLICITOS
 *    (palavras de campo como "largura"/"altura" OU conectivos fortes
 *    como "por"/"x"/"vezes"). NUNCA quebra por "e" porque "e" e
 *    conectivo dentro do numero ("mil e quinhentos").
 * 4. Parseia cada segmento.
 */
export function parsePtNumbers(input: string): number[] {
  if (!input) return [];

  const results: number[] = [];

  // 1. Numeros arabicos diretos.
  const arabicMatches = input.match(/\d+/g);
  if (arabicMatches) {
    for (const m of arabicMatches) {
      const n = Number(m);
      if (Number.isFinite(n) && n > 0) results.push(n);
    }
  }

  // Normaliza a parte verbal.
  const cleaned = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return results;

  // 2. Detecta se a string tem palavras de campo (largura/altura/etc) ou
  // conectivos fortes (por/x/vezes). Se NAO tiver, tenta parsePtNumber inteiro
  // e retorna 1 numero. Se TIVER, precisa quebrar.
  const fieldSeparators = new Set([
    'largura', 'altura', 'profundidade', 'comprimento',
    'modulos', 'modulo', 'folhas', 'folha',
    'area', 'quantidade', 'metros', 'centimetros',
  ]);
  const valueSeparators = new Set(['por', 'x', 'vezes']);

  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const hasAnySeparator = tokens.some((t) => fieldSeparators.has(t) || valueSeparators.has(t));

  if (!hasAnySeparator) {
    // Frase sem separadores: tenta parsePtNumber inteiro.
    const allOnce = parsePtNumber(cleaned);
    if (allOnce !== null && allOnce > 0 && !results.includes(allOnce)) {
      results.push(allOnce);
    }
    return results;
  }

  // 3. Quebra por separadores EXPLICITOS.
  // Separadores fortes: palavras de campo (que vem ANTES do numero) ou
  // conectivos entre valores ("por", "x", "vezes"). "e" NAO conta.
  const segments: string[][] = [[]];
  for (const tok of tokens) {
    if (fieldSeparators.has(tok) || valueSeparators.has(tok)) {
      // O proprio token NAO entra no segmento (eh label/separador).
      // Inicia novo segmento, mas so se ja tem algo no atual.
      if (segments[segments.length - 1].length > 0) {
        segments.push([]);
      }
      continue;
    }
    segments[segments.length - 1].push(tok);
  }
  // Remove segmento vazio no fim.
  if (segments.length > 0 && segments[segments.length - 1].length === 0) {
    segments.pop();
  }

  for (const seg of segments) {
    if (seg.length === 0) continue;
    const n = parsePtNumber(seg.join(' '));
    if (n !== null && n > 0 && !results.includes(n)) results.push(n);
  }

  return results;
}
