'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Medidas</h2>
        <p className="text-sm text-muted-foreground">Informe as dimensoes do produto em milimetros.</p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="width">Largura (mm)</Label>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Altura (mm)</Label>
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
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="depth">Profundidade (mm)</Label>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modules">Modulos</Label>
            <Input
              id="modules"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={data.modulesCount ?? ''}
              onChange={(e) => onChange({ modulesCount: e.target.value ? Number(e.target.value) : null })}
              placeholder="Ex: 3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leaves">Folhas</Label>
            <Input
              id="leaves"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={data.leavesCount ?? ''}
              onChange={(e) => onChange({ leavesCount: e.target.value ? Number(e.target.value) : null })}
              placeholder="Ex: 2"
            />
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
