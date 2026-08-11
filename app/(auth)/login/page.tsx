import { Suspense } from 'react';
import { LoginForm } from './login-form';

export const metadata = { title: 'Entrar' };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
