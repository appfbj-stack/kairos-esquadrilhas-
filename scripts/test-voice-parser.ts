// Teste rapido do parser PT-BR. Rodar com: npx tsx scripts/test-voice-parser.ts
import { parsePtNumber, parsePtNumbers } from '../lib/voice/parse-numbers-pt';

type Case = { input: string; expected: number | null };
const cases: Case[] = [
  { input: 'dois mil', expected: 2000 },
  { input: 'mil', expected: 1000 },
  { input: 'mil e quinhentos', expected: 1500 },
  { input: 'tres mil e duzentos', expected: 3200 },
  { input: 'tres mil duzentos e dez', expected: 3210 },
  { input: 'novecentos e oitenta e quatro', expected: 984 },
  { input: 'duzentos', expected: 200 },
  { input: 'cem', expected: 100 },
  { input: 'cento e vinte', expected: 120 },
  { input: 'mil e cem', expected: 1100 },
  { input: 'um milhao', expected: 1_000_000 },
  { input: 'tres milhoes e quinhentos mil', expected: 3_500_000 },
  { input: '2000', expected: 2000 },
  { input: 'mil e vinte e tres', expected: 1023 },
  { input: 'cinquenta', expected: 50 },
  { input: '', expected: null },
  { input: 'blablabla', expected: null },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const got = parsePtNumber(c.input);
  const ok = got === c.expected;
  if (ok) {
    pass++;
    console.log(`  PASS  "${c.input}" -> ${got}`);
  } else {
    fail++;
    console.log(`  FAIL  "${c.input}" -> got ${got}, expected ${c.expected}`);
  }
}

console.log('---');
console.log(`parsePtNumbers tests:`);

const multiCases: { input: string; expected: number[] }[] = [
  { input: 'largura dois mil altura mil e quinhentos', expected: [2000, 1500] },
  { input: '3000 por 1500', expected: [3000, 1500] },
  { input: 'dois mil', expected: [2000] },
  { input: 'mil e quinhentos', expected: [1500] },
  { input: 'largura 2000 e altura 1500', expected: [2000, 1500] },
  { input: 'profundidade 500 modulos 3', expected: [500, 3] },
  { input: '1000 vezes 2000', expected: [1000, 2000] },
  { input: 'so dois mil', expected: [2000] },
  { input: '   ', expected: [] },
];

for (const c of multiCases) {
  const got = parsePtNumbers(c.input);
  const ok = JSON.stringify(got) === JSON.stringify(c.expected);
  if (ok) {
    pass++;
    console.log(`  PASS  "${c.input}" -> [${got.join(', ')}]`);
  } else {
    fail++;
    console.log(`  FAIL  "${c.input}" -> got [${got.join(', ')}], expected [${c.expected.join(', ')}]`);
  }
}

console.log('---');
console.log(`Total: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
