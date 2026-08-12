'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WizardData } from '../wizard';

type Model = { id: string; name: string; defaultLeaves: number | null };

export function Step4Model({
  data,
  models,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  models: Model[];
  onChange: (d: Partial<WizardData>) => void;
  onNext: (d: Partial<WizardData>) => void;
  onBack: () => void;
}) {
  const selected = data.modelId;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Modelo</h2>
        <p className="text-sm text-muted-foreground">Escolha o modelo especifico deste produto.</p>
      </div>

      {models.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum modelo cadastrado para esse produto. Adicione modelos em Configuracoes &gt; Catalogo.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {models.map((m) => {
            const isSel = selected === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() =>
                  onChange({ modelId: m.id, leavesCount: m.defaultLeaves ?? data.leavesCount })
                }
                className={cn(
                  'flex items-center justify-between rounded-lg border-2 p-4 text-left transition-colors',
                  isSel ? 'border-primary bg-primary/5' : 'border-input hover:border-primary/50 hover:bg-accent'
                )}
              >
                <div>
                  <p className="font-semibold">{m.name}</p>
                  {m.defaultLeaves && (
                    <p className="text-xs text-muted-foreground">{m.defaultLeaves} folha{m.defaultLeaves === 1 ? '' : 's'}</p>
                  )}
                </div>
                {isSel && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          disabled={!selected}
          onClick={() => selected && onNext({ modelId: selected })}
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
