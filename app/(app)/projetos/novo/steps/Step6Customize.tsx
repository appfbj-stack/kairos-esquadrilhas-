'use client';

import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WizardData } from '../wizard';

type Ref = { id: string; name: string; hex?: string | null };

const OPENINGS = [
  { v: 'correr', l: 'Correr' },
  { v: 'abrir', l: 'Abrir' },
  { v: 'maxim-ar', l: 'Maxim-ar' },
  { v: 'basculante', l: 'Basculante' },
  { v: 'fixa', l: 'Fixa' },
  { v: 'pivotante', l: 'Pivotante' },
];

export function Step6Customize({
  data,
  colors,
  glasses,
  accessories,
  onChange,
  onBack,
  onFinish,
  isFinishing,
}: {
  data: WizardData;
  colors: Ref[];
  glasses: Ref[];
  accessories: Ref[];
  onChange: (d: Partial<WizardData>) => void;
  onBack: () => void;
  onFinish: () => void;
  isFinishing: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Personalizacao</h2>
        <p className="text-sm text-muted-foreground">Escolha cor, vidro e tipo de abertura.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Cor do perfil</p>
        {colors.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem cores cadastradas.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const isSel = data.colorId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChange({ colorId: c.id })}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors',
                    isSel ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'
                  )}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full border"
                    style={{ background: c.hex ?? '#888' }}
                  />
                  {c.name}
                  {isSel && <Check className="h-3 w-3 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Vidro</p>
        {glasses.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem vidros cadastrados.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {glasses.map((g) => {
              const isSel = data.glassId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onChange({ glassId: g.id })}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    isSel ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'
                  )}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Tipo de abertura</p>
        <div className="flex flex-wrap gap-2">
          {OPENINGS.map((o) => {
            const isSel = data.opening === o.v;
            return (
              <button
                key={o.v}
                type="button"
                onClick={() => onChange({ opening: o.v })}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm transition-colors',
                  isSel ? 'border-primary bg-primary/5' : 'border-input hover:bg-accent'
                )}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md bg-green-50 p-3 text-sm text-green-900">
        <strong>Tudo pronto!</strong> Ao finalizar, voce vera o 3D, o orcamento calculado e podera gerar a proposta em PDF.
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack} disabled={isFinishing}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button size="lg" variant="success" onClick={onFinish} disabled={isFinishing}>
          {isFinishing ? 'Salvando...' : 'Finalizar e ver 3D'}
          {!isFinishing && <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
