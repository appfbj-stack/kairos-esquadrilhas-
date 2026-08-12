import Link from 'next/link';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tenants, projects, quotes } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, FileText, Users, Package, Settings, Bot, Sparkles } from 'lucide-react';
import { formatBRL } from '@/lib/utils';

export const metadata = { title: 'Dashboard' };

type CardItem = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  desc: string;
  sprint: string;
};

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

  // Cards que ja tem pagina recebem href. Os demais continuam com badge "Em breve".
  const cards: CardItem[] = [
    { title: 'Clientes', icon: Users, href: '/clientes', desc: 'Base de clientes', sprint: 'Pronto' },
    { title: 'Demo 3D', icon: Sparkles, href: '/demo-3d', desc: 'Todos os produtos em 3D', sprint: 'Pronto' },
    { title: 'Meus Projetos', icon: FolderOpen, desc: 'Listagem de projetos', sprint: 'Sprint 3' },
    { title: 'Orcamentos', icon: FileText, desc: `${pendingQuotes} orcamentos`, sprint: 'Sprint 7' },
    { title: 'Catalogo', icon: Package, desc: 'Produtos e precos', sprint: 'Sprint 2' },
    { title: 'Configuracoes', icon: Settings, desc: 'Empresa e equipe', sprint: 'Sprint 0+' },
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
        {cards.map((c) => {
          const Icon = c.icon;
          const isReady = c.sprint === 'Pronto';
          const badgeClass = isReady
            ? 'bg-green-100 text-green-900'
            : 'bg-amber-100 text-amber-900';
          const inner = (
            <Card className="h-full transition-colors hover:bg-accent">
              <CardContent className="flex h-full items-center gap-4 p-5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{c.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${badgeClass}`}>
                      {c.sprint}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{c.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
          if (c.href) {
            return <Link key={c.title} href={c.href}>{inner}</Link>;
          }
          return <div key={c.title}>{inner}</div>;
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projetos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum projeto ainda. Em breve o botao <strong>NOVO PROJETO</strong> te leva pelo wizard completo.
              </p>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-900">
                Sprint 3-4
              </span>
            </div>
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
