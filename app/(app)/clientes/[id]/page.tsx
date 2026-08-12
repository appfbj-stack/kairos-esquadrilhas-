import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Phone, MessageCircle, Mail, MapPin, Trash2, FileText, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/components/customers/customer-form';
import { getCustomer, updateCustomer, deleteCustomer, getCustomerProjectsCount } from '@/lib/actions/customers';

export const metadata = { title: 'Cliente' };

type Params = { id: string };
type Search = { ok?: string };

function buildUpdateAction(id: string) {
  return async (state: Parameters<typeof updateCustomer>[1], formData: FormData) => {
    'use server';
    return updateCustomer(id, state, formData);
  };
}

function buildDeleteAction(id: string) {
  return async () => {
    'use server';
    return deleteCustomer(id);
  };
}

export default async function CustomerDetailPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const customer = await getCustomer(params.id);
  if (!customer) notFound();

  const projectsCount = await getCustomerProjectsCount(params.id);
  const showSaved = searchParams.ok === '1';

  const updateAction = buildUpdateAction(params.id);
  const deleteAction = buildDeleteAction(params.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/clientes" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{customer.name}</h1>
      </div>

      {showSaved && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
          ✓ Cliente atualizado
        </div>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-foreground hover:underline">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {customer.phone}
            </a>
          )}
          {customer.whatsapp && (
            <a
              href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-foreground hover:underline"
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              {customer.whatsapp}
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-foreground hover:underline">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {customer.email}
            </a>
          )}
          {customer.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{customer.address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Projetos</CardTitle>
          <span className="text-xs text-muted-foreground">{projectsCount} no total</span>
        </CardHeader>
        <CardContent>
          {projectsCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum projeto ainda. Em breve o wizard de NOVO PROJETO (Sprint 3-4) vai permitir criar.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Lista de projetos aparece aqui quando o wizard de NOVO PROJETO estiver pronto.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Pencil className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Editar dados
        </h2>
      </div>

      <CustomerForm
        action={updateAction}
        submitLabel="Salvar alteracoes"
        initial={{
          name: customer.name,
          phone: customer.phone,
          whatsapp: customer.whatsapp,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
        }}
      />

      <form action={deleteAction} className="pt-4">
        <Button type="submit" variant="outline" size="lg" className="w-full text-destructive">
          <Trash2 className="h-4 w-4" />
          Excluir cliente
        </Button>
      </form>
    </div>
  );
}
