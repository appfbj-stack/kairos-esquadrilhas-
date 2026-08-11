import Link from 'next/link';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tenants, projects, quotes } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, FileText, Users, Package, Settings, Bot } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await auth();
  const tenantId = session!.user.tenantId;

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresa nao encontrada</CardTitle>
          <CardDescription>Sua sessao parece estar sem tenant. Faca logout e login novamente.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const recentProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, tenantId))
    .orderBy(desc(projects.updatedAt))
    .limit(5);

  const allQuotes = await db
    .select()
    .from(quotes)
    .where(eq(quotes.tenantId, tenantId));

  const totalSold = allQuotes.reduce((acc, q) => acc + Number(q.total ?? 0), 0);
  const pendingQuotes = allQuotes.length;

  const cards = [
    { title: 'Meus Projetos', icon: FolderOpen, href: '/projetos', desc: 'Ver todos os projetos' },
    { title: 'Orcamentos', icon: FileText, href: '/orcamentos', desc: `${pendingQuotes} orcamentos` },
    { title: 'Clientes', icon: Users, href: '/clientes', desc: 'Sua base de clientes' },
    { title: 'Catalogo', icon: Package, href: '/catalogo', desc: 'Produtos e precos' },
    { title: 'Configuracoes', icon: Settings, href: '/configuracoes', desc: 'Empresa e equipe' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ola, {session!.user.name?.split(' ')[0] ?? 'vendedor'} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {tenant.name} · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Projetos recentes</p>
            <p className="mt-1 text-2xl font-bold">{recentProjects.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Orcamentos pendentes</p>
            <p className="mt-1 text-2xl font-bold">{pendingQuotes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Aprovados</p>
            <p className="mt-1 text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4">
            <p className="text-xs opacity-80">Total vendido</p>
            <p className="mt-1 text-2xl font-bold">{formatBRL(totalSold)}</p>
          </CardContent>
        </Card>
      </div>

      <Link href="/projetos/novo" className="block">
        <Button size="xl" className="w-full text-base">
          <Plus className="h-5 w-5" />
          NOVO PROJETO
        </Button>
      </Link>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <c.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projetos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto ainda. Clique em <strong>NOVO PROJETO</strong> para comecar.
            </p>
          ) : (
            <ul className="divide-y">
              {recentProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.code} · {p.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Assistente Kairos</p>
            <p className="text-xs text-muted-foreground">
              Em breve: faca orcamentos conversando. (Sprint 10)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
