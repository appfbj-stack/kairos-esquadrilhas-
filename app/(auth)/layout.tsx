import { Logo } from '@/components/shared/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container flex min-h-screen flex-col items-center justify-center gap-8 py-8">
        <Logo size="lg" />
        <div className="w-full max-w-md">{children}</div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Kairos Esquadrilhas 3D
        </p>
      </div>
    </main>
  );
}
