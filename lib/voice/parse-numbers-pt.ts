// Conversor de numero por extenso em portugues -> numero inteiro.
// Aceita formas como "dois mil", "mil e quinhentos", "tres mil e duzentos e dez".
// Sem LLM: dicionario + parser simples de escala (milhao, mil, centena, dezena, unidade).

const UNITS: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
};

const TEENS: Record<string, number> = {
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  quatorze: 14,
  catorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
};

const TENS: Record<string, number> = {
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinqüenta: 50,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
};

const HUNDREDS: Record<string, number> = {
  cem: 100,
  cento: 100,
  duzentos: 200,
  duzentas: 200,
  trezentos: 300,
  trezentas: 300,
  quatrocentos: 400,
  quatrocentas: 400,
  quinhentos: 500,
  quinhentas: 500,
  seiscentos: 600,
  seiscentas: 600,
  setecentos: 700,
  setecentas: 700,
  oitocentos: 800,
  oitocentas: 800,
  novecentos: 900,
  novecentas: 900,
};

// Normaliza acentos comuns que o reconhecedor de voz pode distorcer.
function normalize(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function parseSegment(text: string): number | null {
  // Suporta ate 999. Ex: "duzentos e quarenta e tres" -> 243.
  const tokens = text.split(/\s+e\s+|\s+/).map(normalize).filter(Boolean);
  if (tokens.length === 0) return null;

  let total = 0;
  let current = 0;
  let consumed = 0;

  for (const tok of tokens) {
    if (tok === 'mil' || tok === 'milhao' || tok === 'milhoes' || tok === 'bilhao' || tok === 'bilhoes') {
      // milhao/bilhao sao tratados pelo loop externo (escala).
      if (current === 0) current = 1; // "mil" sozinho = 1000
      break;
    }
    if (UNITS[tok] !== undefined) {
      current += UNITS[tok];
      consumed++;
    } else if (TEENS[tok] !== undefined) {
      current += TEENS[tok];
      consumed++;
    } else if (TENS[tok] !== undefined) {
      current += TENS[tok];
      consumed++;
    } else if (HUNDREDS[tok] !== undefined) {
      current += HUNDREDS[tok];
      consumed++;
    } else {
      // token nao reconhecido: aborta o segmento
      break;
    }
  }

  if (consumed === 0) return null;
  if (consumed === tokens.length) {
    return current;
  }
  return total + current;
}

/**
 * Tenta extrair um inteiro >= 1 de uma string em portugues.
 * Retorna null se nao conseguir.
 * Ex: "dois mil" -> 2000; "mil e quinhentos" -> 1500; "novecentos" -> 900.
 */
export function parsePtNumber(input: string): number | null {
  if (!input) return null;

  // Primeiro, remove caracteres nao-alfabeticos (o reconhecedor pode por virgula/ponto).
  const cleaned = input
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;

  // Normaliza para comparar.
  const tokens = cleaned.split(' ').map(normalize);
  if (tokens.length === 0) return null;

  // Procura padroes de escala: mil / milhao / bilhao.
  let result = 0;
  let currentSegment: string[] = [];

  const flushSegment = () => {
    if (currentSegment.length === 0) return;
    const segmentValue = parseSegment(currentSegment.join(' '));
    if (segmentValue === null) {
      currentSegment = [];
      return;
    }
    // Se o proximo token for escala, multiplica.
    const nextIdx = tokens.indexOf(currentSegment[currentSegment.length - 1]) + 1;
    const nextTok = tokens[nextIdx];
    let multiplier = 1;
    if (nextTok === 'mil') multiplier = 1000;
    else if (nextTok === 'milhao' || nextTok === 'milhoes') multiplier = 1_000_000;
    else if (nextTok === 'bilhao' || nextTok === 'bilhoes') multiplier = 1_000_000_000;
    result += segmentValue * multiplier;
    currentSegment = [];
  };

  for (const tok of tokens) {
    if (tok === 'mil' || tok === 'milhao' || tok === 'milhoes' || tok === 'bilhao' || tok === 'bilhoes') {
      flushSegment();
      // ja somamos acima
    } else {
      currentSegment.push(tok);
    }
  }
  // Flush o que sobrou (sem escala).
  if (currentSegment.length > 0) {
    const segmentValue = parseSegment(currentSegment.join(' '));
    if (segmentValue !== null) result += segmentValue;
  }

  return result > 0 ? result : null;
}

/**
 * Tenta extrair varios numeros de uma string (util para "largura 2000 altura 1500").
 */
export function parsePtNumbers(input: string): number[] {
  if (!input) return [];

  // Primeiro, numeros arabicos ja presentes sao mantidos.
  const matches: number[] = [];
  const arabicRegex = /\d+/g;
  const arabic = input.match(arabicRegex);
  if (arabic) {
    for (const m of arabic) {
      const n = Number(m);
      if (Number.isFinite(n) && n > 0) matches.push(n);
    }
  }

  // Depois, tenta parsear a parte verbal.
  const verbalOnly = input.replace(/\d+/g, ' ').trim();
  if (!verbalOnly) return matches;

  // Para sequencias como "dois mil por mil e quinhentos", extrai palavras-chave.
  // Caso simples: split por palavras conectoras comuns.
  const tokens = verbalOnly.toLowerCase().split(/\s+/).filter(Boolean);
  // Procura tokens de "mil" e quebra em segmentos.
  let buffer: string[] = [];
  const segments: string[] = [];
  for (const t of tokens) {
    buffer.push(t);
    const norm = normalize(t);
    if (norm === 'mil' || norm === 'milhao' || norm === 'milhoes' || norm === 'bilhao' || norm === 'bilhoes') {
      segments.push(buffer.join(' '));
      buffer = [];
    }
  }
  if (buffer.length > 0) segments.push(buffer.join(' '));

  for (const seg of segments) {
    const n = parsePtNumber(seg);
    if (n !== null) matches.push(n);
  }

  return matches;
}
