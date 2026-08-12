import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CustomerForm } from '@/components/customers/customer-form';
import { createCustomer } from '@/lib/actions/customers';

export const metadata = { title: 'Novo cliente' };

export default function NewCustomerPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/clientes" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Novo cliente</h1>
      </div>
      <CustomerForm action={createCustomer} submitLabel="Cadastrar" />
    </div>
  );
}
