'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';
import { type CustomerFormState } from '@/lib/actions/customers';

const initialState: CustomerFormState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

export function CustomerForm({
  action,
  initial,
  submitLabel,
}: {
  action: (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>;
  initial?: {
    name?: string;
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initial?.name}
              placeholder="Nome do cliente"
              autoComplete="name"
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initial?.phone ?? ''}
                placeholder="(11) 4002-8922"
                autoComplete="tel"
              />
              {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                defaultValue={initial?.whatsapp ?? ''}
                placeholder="(11) 99999-0000"
                autoComplete="tel"
              />
              {fieldErrors.whatsapp && <p className="text-xs text-destructive">{fieldErrors.whatsapp}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={initial?.email ?? ''}
              placeholder="cliente@exemplo.com"
              autoComplete="email"
            />
            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereco</Label>
            <Input
              id="address"
              name="address"
              defaultValue={initial?.address ?? ''}
              placeholder="Rua, numero, bairro, cidade/UF"
              autoComplete="street-address"
            />
            {fieldErrors.address && <p className="text-xs text-destructive">{fieldErrors.address}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ''}
              placeholder="Anotacoes sobre o cliente (opcional)"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {fieldErrors.notes && <p className="text-xs text-destructive">{fieldErrors.notes}</p>}
          </div>
        </CardContent>
      </Card>

      {state.error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
