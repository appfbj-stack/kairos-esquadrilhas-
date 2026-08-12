import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { customers, products, colors, glasses, accessories, projectPhotos, projects, productModels } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getProject, getProjectPhotos } from '@/lib/actions/projects';
import { Wizard } from './wizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { createProject } from '@/lib/actions/projects';

export const metadata = { title: 'Novo projeto' };

type Search = { pid?: string };

export default async function NewProjectPage({ searchParams }: { searchParams: Search }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const tenantId = session.user.tenantId;

  // Sem pid: mostra botao "iniciar"
  if (!searchParams.pid) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Novo projeto</h1>
        <Card>
          <CardHeader>
            <CardTitle>Vamos comecar</CardTitle>
            <CardDescription>
              Crie um rascunho e siga o wizard: cliente, fotos, produto, modelo, medidas e personalizacao.
              Voce pode pausar e voltar a qualquer momento — o projeto fica salvo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createProject}>
              <Button type="submit" size="xl" className="w-full">
                <Plus className="h-5 w-5" />
                Iniciar novo projeto
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Com pid: carrega tudo e mostra wizard
  const [project, customersList, productsList, colorsList, glassesList, accessoriesList, photos] = await Promise.all([
    getProject(searchParams.pid),
    db.select().from(customers).where(eq(customers.tenantId, tenantId)).orderBy(asc(customers.name)).limit(200),
    db.select().from(products).where(eq(products.tenantId, tenantId)).orderBy(asc(products.name)),
    db.select().from(colors).where(eq(colors.tenantId, tenantId)).orderBy(asc(colors.name)),
    db.select().from(glasses).where(eq(glasses.tenantId, tenantId)).orderBy(asc(glasses.name)),
    db.select().from(accessories).where(eq(accessories.tenantId, tenantId)).orderBy(asc(accessories.name)),
    getProjectPhotos(searchParams.pid),
  ]);

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Projeto nao encontrado</CardTitle>
          <CardDescription>Este rascunho nao existe ou foi excluido.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Carrega modelos do produto atual (se ja tem)
  let modelsList: { id: string; name: string; productId: string; defaultLeaves: number | null }[] = [];
  if (project.productId) {
    const rows = await db
      .select()
      .from(productModels)
      .where(eq(productModels.productId, project.productId))
      .orderBy(asc(productModels.name));
    modelsList = rows;
  }

  return (
    <Wizard
      project={project}
      photos={photos}
      customers={customersList}
      products={productsList}
      models={modelsList}
      colors={colorsList}
      glasses={glassesList}
      accessories={accessoriesList}
    />
  );
}
