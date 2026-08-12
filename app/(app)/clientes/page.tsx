import Link from 'next/link';
import { Plus, Search, User, Phone, MessageCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { searchCustomers } from '@/lib/actions/customers';

export const metadata = { title: 'Clientes' };

type Search = { q?: string };

export default async function CustomersPage({ searchParams }: { searchParams: Search }) {
  const q = searchParams.q ?? '';
  const list = await searchCustomers(q);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Clientes</h1>
        <Button asChild size="lg">
          <Link href="/clientes/novo">
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </Button>
      </div>

      <form action="/clientes" method="get" className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, telefone, email..."
          className="pl-9"
          autoComplete="off"
        />
      </form>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <User className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">
                {q ? 'Nenhum cliente encontrado' : 'Sem clientes ainda'}
              </p>
              <p className="text-sm text-muted-foreground">
                {q ? 'Tente outra busca' : 'Cadastre o primeiro cliente para comecar'}
              </p>
            </div>
            {!q && (
              <Button asChild>
                <Link href="/clientes/novo">
                  <Plus className="h-4 w-4" />
                  Cadastrar cliente
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/clientes/${c.id}`} className="block">
                <Card className="transition-colors hover:bg-accent">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {c.name
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{c.name}</p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {c.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {c.phone}
                            </span>
                          )}
                          {c.whatsapp && (
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {c.whatsapp}
                            </span>
                          )}
                          {c.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{c.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {list.length} {list.length === 1 ? 'cliente' : 'clientes'}
      </p>
    </div>
  );
}
