'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { updateProject } from '@/lib/actions/projects';
import { Step1Customer } from './steps/Step1Customer';
import { Step2Photo } from './steps/Step2Photo';
import { Step3Product } from './steps/Step3Product';
import { Step4Model } from './steps/Step4Model';
import { Step5Measures } from './steps/Step5Measures';
import { Step6Customize } from './steps/Step6Customize';

export type WizardData = {
  id: string;
  code: string;
  title: string;
  customerId: string | null;
  productId: string | null;
  modelId: string | null;
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  modulesCount: number | null;
  leavesCount: number | null;
  colorId: string | null;
  glassId: string | null;
  opening: string | null;
  notes: string | null;
};

type Photo = { id: string; url: string; kind: string; position: number };

type RefItem = { id: string; name: string; [k: string]: any };

const STEPS = [
  { num: 1, label: 'Cliente', short: 'Cliente' },
  { num: 2, label: 'Foto', short: 'Foto' },
  { num: 3, label: 'Produto', short: 'Produto' },
  { num: 4, label: 'Modelo', short: 'Modelo' },
  { num: 5, label: 'Medidas', short: 'Medidas' },
  { num: 6, label: 'Personalizar', short: 'Cores' },
];

export function Wizard({
  project,
  photos,
  customers,
  products,
  models,
  colors,
  glasses,
  accessories,
}: {
  project: WizardData;
  photos: Photo[];
  customers: RefItem[];
  products: RefItem[];
  models: RefItem[];
  colors: RefItem[];
  glasses: RefItem[];
  accessories: RefItem[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(project);
  const [currentPhotos, setCurrentPhotos] = useState<Photo[]>(photos);
  const [currentModels, setCurrentModels] = useState<RefItem[]>(models);
  const [isPending, startTransition] = useTransition();

  function patch(partial: Partial<WizardData>) {
    setData((d) => ({ ...d, ...partial }));
  }

  function saveAndAdvance(nextStep: number, extra?: Partial<WizardData>) {
    const merged = { ...data, ...extra };
    setData(merged);
    startTransition(async () => {
      await updateProject({
        id: merged.id,
        customerId: merged.customerId,
        productId: merged.productId,
        modelId: merged.modelId,
        widthMm: merged.widthMm,
        heightMm: merged.heightMm,
        depthMm: merged.depthMm,
        modulesCount: merged.modulesCount,
        leavesCount: merged.leavesCount,
        colorId: merged.colorId,
        glassId: merged.glassId,
        opening: merged.opening,
      });
      if (extra?.productId && extra.productId !== data.productId) {
        // Recarrega modelos se mudou produto
        const res = await fetch(`/api/product-models?productId=${extra.productId}`);
        if (res.ok) {
          const rows = await res.json();
          setCurrentModels(rows);
        }
      }
      setStep(nextStep);
    });
  }

  function goBack() {
    if (step === 1) return;
    setStep(step - 1);
  }

  function finish() {
    startTransition(async () => {
      await updateProject({ id: data.id, status: 'orcamento' });
      router.push(`/projetos/${data.id}`);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Novo projeto</h1>
          <p className="text-xs text-muted-foreground">{data.code} · rascunho</p>
        </div>
      </div>

      {/* Stepper */}
      <ol className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s) => {
          const done = s.num < step;
          const current = s.num === step;
          return (
            <li key={s.num} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
                  current && 'bg-primary text-primary-foreground',
                  done && 'bg-primary/10 text-primary',
                  !current && !done && 'bg-muted text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold',
                    current && 'bg-primary-foreground text-primary',
                    done && 'bg-primary text-primary-foreground',
                    !current && !done && 'bg-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : s.num}
                </span>
                <span className="hidden sm:inline">{s.short}</span>
              </button>
              {s.num < STEPS.length && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/30" />}
            </li>
          );
        })}
      </ol>

      <Card>
        <CardContent className="p-4 sm:p-6">
          {step === 1 && (
            <Step1Customer
              data={data}
              customers={customers}
              onChange={(d) => patch(d)}
              onNext={(d) => saveAndAdvance(2, d)}
            />
          )}
          {step === 2 && (
            <Step2Photo
              projectId={data.id}
              photos={currentPhotos}
              onChange={setCurrentPhotos}
              onNext={() => setStep(3)}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <Step3Product
              data={data}
              products={products}
              onChange={(d) => patch(d)}
              onNext={(d) => saveAndAdvance(4, d)}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <Step4Model
              data={data}
              models={currentModels}
              onChange={(d) => patch(d)}
              onNext={(d) => saveAndAdvance(5, d)}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <Step5Measures
              data={data}
              onChange={(d) => patch(d)}
              onNext={(d) => saveAndAdvance(6, d)}
              onBack={goBack}
            />
          )}
          {step === 6 && (
            <Step6Customize
              data={data}
              colors={colors}
              glasses={glasses}
              accessories={accessories}
              onChange={(d) => patch(d)}
              onBack={goBack}
              onFinish={finish}
              isFinishing={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
