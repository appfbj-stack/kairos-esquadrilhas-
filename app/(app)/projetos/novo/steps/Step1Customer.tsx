'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, User, UserPlus, Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WizardData } from '../wizard';

type Customer = { id: string; name: string; phone?: string | null; whatsapp?: string | null };

export function Step1Customer({
  data,
  customers,
  onChange,
  onNext,
}: {
  data: WizardData;
  customers: Customer[];
  onChange: (d: Partial<WizardData>) => void;
  onNext: (d: Partial<WizardData>) => void;
}) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(data.customerId);

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Selecione o cliente</h2>
        <p className="text-sm text-muted-foreground">Busque um cliente existente ou cadastre um novo.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente..."
          className="pl-9"
        />
      </div>

      {customers.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-900">Nenhum cliente cadastrado</p>
          <p className="text-xs text-amber-700">Cadastre o primeiro cliente antes de comecar.</p>
          <Button asChild className="mt-3">
            <Link href="/clientes/novo" target="_blank">
              <UserPlus className="h-4 w-4" />
              Cadastrar cliente
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {filtered.map((c) => {
            const isSel = selected === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelected(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors',
                    isSel
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-accent'
                  )}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {c.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.phone, c.whatsapp, c.email].filter(Boolean).join(' · ') || 'sem contato'}
                    </p>
                  </div>
                  {isSel && <Check className="h-5 w-5 text-primary" />}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && q && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhum cliente com "{q}".
            </li>
          )}
        </ul>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/clientes/novo" target="_blank">
            <UserPlus className="h-4 w-4" />
            Novo cliente
          </Link>
        </Button>
        <Button
          size="lg"
          disabled={!selected}
          onClick={() => selected && onNext({ customerId: selected, title: customers.find((c) => c.id === selected)?.name ?? 'Projeto' })}
        >
          Proximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
