'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WizardData } from '../wizard';

type Product = { id: string; name: string; category: string };

const ICONS: Record<string, string> = {
  janela: '🪟',
  porta: '🚪',
  box: '🚿',
  guarda_corpo: '🪜',
  corrimao: '🤝',
  fechamento: '🏠',
  fachada: '🏢',
  divisoria: '🧱',
  outro: '➕',
};

const LABELS: Record<string, string> = {
  janela: 'Janela',
  porta: 'Porta',
  box: 'Box',
  guarda_corpo: 'Guarda-corpo',
  corrimao: 'Corrimao',
  fechamento: 'Fechamento',
  fachada: 'Fachada',
  divisoria: 'Divisoria',
  outro: 'Outro',
};

export function Step3Product({
  data,
  products,
  onChange,
  onNext,
  onBack,
}: {
  data: WizardData;
  products: Product[];
  onChange: (d: Partial<WizardData>) => void;
  onNext: (d: Partial<WizardData>) => void;
  onBack: () => void;
}) {
  const selected = data.productId;

  // Agrupa por categoria, mantendo ordem do PRD
  const order = ['janela', 'porta', 'box', 'guarda_corpo', 'corrimao', 'fechamento', 'fachada', 'divisoria', 'outro'];
  const byCat: Record<string, Product[]> = {};
  for (const p of products) {
    (byCat[p.category] ??= []).push(p);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tipo de produto</h2>
        <p className="text-sm text-muted-foreground">Escolha a categoria do produto deste projeto.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {order.map((cat) => {
          const ps = byCat[cat] ?? [];
          const isSel = ps.some((p) => p.id === selected);
          const first = ps[0];
          return (
            <button
              key={cat}
              type="button"
              disabled={ps.length === 0}
              onClick={() => first && onChange({ productId: first.id, modelId: null })}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 p-3 text-center transition-colors',
                ps.length === 0 && 'cursor-not-allowed border-dashed opacity-40',
                ps.length > 0 && isSel && 'border-primary bg-primary/5',
                ps.length > 0 && !isSel && 'border-input hover:border-primary/50 hover:bg-accent'
              )}
            >
              <span className="text-3xl" aria-hidden>
                {ICONS[cat]}
              </span>
              <span className="text-sm font-semibold">{LABELS[cat]}</span>
              <span className="text-[10px] text-muted-foreground">
                {ps.length === 0 ? 'sem catalogo' : `${ps.length} modelo${ps.length === 1 ? '' : 's'}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          size="lg"
          disabled={!selected}
          onClick={() => selected && onNext({ productId: selected })}
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
