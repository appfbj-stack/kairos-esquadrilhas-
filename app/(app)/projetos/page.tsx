import Link from 'next/link';
import { Plus, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { listProjects } from '@/lib/actions/projects';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { requireTenantContext } from '@/lib/tenant/context';
import { formatBRL } from '@/lib/utils';

export const metadata = { title: 'Projetos' };

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  orcamento: 'Orcamento',
  enviado: 'Enviado',
  aguardando_cliente: 'Aguardando',
  aprovado: 'Aprovado',
  em_producao: 'Producao',
  instalacao: 'Instalacao',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
};

export default async function ProjectsPage() {
  const ctx = await requireTenantContext();
  const projectsList = await listProjects();

  // Pega nomes dos clientes em batch
  const customerIds = projectsList.map((p) => p.customerId).filter((id): id is string => !!id);
  const customersMap = new Map<string, string>();
  if (customerIds.length > 0) {
    const rows = await db
      .select({ id: customers.id, name: customers.name })
      .from(customers)
      .where(and(eq(customers.tenantId, ctx.tenantId), inArray(customers.id, customerIds)));
    for (const r of rows) customersMap.set(r.id, r.name);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Projetos</h1>
        <Button asChild size="lg">
          <Link href="/projetos/novo">
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </Button>
      </div>

      {projectsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold">Sem projetos ainda</p>
              <p className="text-sm text-muted-foreground">Comece o primeiro projeto agora.</p>
            </div>
            <Button asChild>
              <Link href="/projetos/novo">
                <Plus className="h-4 w-4" />
                NOVO PROJETO
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {projectsList.map((p) => {
            const customerName = p.customerId ? customersMap.get(p.customerId) : null;
            const measure =
              p.widthMm && p.heightMm ? `${(p.widthMm / 1000).toFixed(2)} × ${(p.heightMm / 1000).toFixed(2)} m` : null;
            return (
              <li key={p.id}>
                <Link href={`/projetos/${p.id}`}>
                  <Card className="transition-colors hover:bg-accent">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{p.title}</p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {STATUS_LABELS[p.status] ?? p.status}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.code} · {customerName ?? 'sem cliente'} {measure ? `· ${measure}` : ''}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {projectsList.length} {projectsList.length === 1 ? 'projeto' : 'projetos'}
      </p>
    </div>
  );
}
