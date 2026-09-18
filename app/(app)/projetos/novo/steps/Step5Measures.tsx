'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VoiceInput } from '@/components/shared/VoiceInput';
import { parsePtNumber } from '@/lib/voice/parse-numbers-pt';
import type { WizardData } from '../wizard';

export function Step5Measures({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
  onNext: (d: Partial<WizardData>) => void;
  onBack: () => void;
}) {
  // Quando o usuario fala, o callback recebe o texto transcrito.
  // Extrai o numero (arabico ou por extenso em pt-BR) e aplica no campo.
  function setNumberFromVoice(
    field: 'widthMm' | 'heightMm' | 'depthMm' | 'modulesCount' | 'leavesCount',
    text: string
  ) {
    // Tenta primeiro numero arabico direto.
    const arabic = text.match(/\d+/);
    if (arabic) {
      onChange({ [field]: Number(arabic[0]) });
      return;
    }
    // Depois, tenta parser PT-BR ("dois mil" -> 2000).
    const n = parsePtNumber(text);
    if (n !== null) onChange({ [field]: n });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Medidas</h2>
        <p className="text-sm text-muted-foreground">
          Informe as dimensoes em milimetros. Toque no mic para falar (ex: &quot;dois mil&quot; = 2000).
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="width">Largura (mm)</Label>
            <div className="flex gap-2">
              <Input
                id="width"
                type="number"
                inputMode="numeric"
                min={100}
                max={20000}
                step={10}
                value={data.widthMm ?? ''}
                onChange={(e) => onChange({ widthMm: e.target.value ? Number(e.target.value) : null })}
                placeholder="Ex: 2000"
                className="flex-1"
              />
              <VoiceInput onResult={(t) => setNumberFromVoice('widthMm', t)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (mm)</Label>
            <div className="flex gap-2">
              <Input
                id="height"
                type="number"
                inputMode="numeric"
                min={100}
                max={20000}
                step={10}
                value={data.heightMm ?? ''}
                onChange={(e) => onChange({ heightMm: e.target.value ? Number(e.target.value) : null })}
                placeholder="Ex: 1200"
                className="flex-1"
              />
              <VoiceInput onResult={(t) => setNumberFromVoice('heightMm', t)} />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="depth">Profundidade (mm)</Label>
            <div className="flex gap-2">
              <Input
                id="depth"
                type="number"
                inputMode="numeric"
                min={0}
                max={20000}
                step={10}
                value={data.depthMm ?? ''}
                onChange={(e) => onChange({ depthMm: e.target.value ? Number(e.target.value) : null })}
                placeholder="Opcional"
                className="flex-1"
              />
              <VoiceInput onResult={(t) => setNumberFromVoice('depthMm', t)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="modules">Modulos</Label>
            <div className="flex gap-2">
              <Input
                id="modules"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={data.modulesCount ?? ''}
                onChange={(e) => onChange({ modulesCount: e.target.value ? Number(e.target.value) : null })}
                placeholder="Ex: 3"
                className="flex-1"
              />
              <VoiceInput onResult={(t) => setNumberFromVoice('modulesCount', t)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leaves">Folhas</Label>
            <div className="flex gap-2">
              <Input
                id="leaves"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={data.leavesCount ?? ''}
                onChange={(e) => onChange({ leavesCount: e.target.value ? Number(e.target.value) : null })}
                placeholder="Ex: 2"
                className="flex-1"
              />
              <VoiceInput onResult={(t) => setNumberFromVoice('leavesCount', t)} />
            </div>
          </div>
        </div>

        {data.widthMm && data.heightMm && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            Area:{' '}
            <strong>
              {((data.widthMm * data.heightMm) / 1_000_000).toFixed(2)} m²
            </strong>
            {' · '}
            Perimetro:{' '}
            <strong>
              {((2 * (data.widthMm + data.heightMm)) / 1000).toFixed(2)} m
            </strong>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          disabled={!data.widthMm || !data.heightMm}
          onClick={() =>
            onNext({
              widthMm: data.widthMm,
              heightMm: data.heightMm,
              depthMm: data.depthMm,
              modulesCount: data.modulesCount,
              leavesCount: data.leavesCount,
            })
          }
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
