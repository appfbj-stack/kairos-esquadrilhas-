'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, ImagePlus, Trash2, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Photo = { id: string; url: string; kind: string; position: number };

export function Step2Photo({
  projectId,
  photos,
  onChange,
  onNext,
  onBack,
}: {
  projectId: string;
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('projectId', projectId);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body?.error ?? 'Falha no upload');
          continue;
        }
        const json = await res.json();
        onChange([...photos, json.photo]);
      }
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
    await fetch(`/api/upload?id=${id}`, { method: 'DELETE' });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Fotos do ambiente</h2>
        <p className="text-sm text-muted-foreground">
          Tire fotos do local onde o produto sera instalado. Pode adicionar quantas quiser.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm font-medium">Tirar foto</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-50"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-sm font-medium">Escolher foto</span>
        </button>
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
            <img src={p.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(p.id)}
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover foto"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              #{p.position + 1}
            </span>
          </div>
        ))}
        {uploading && (
          <div className="flex aspect-square items-center justify-center rounded-lg border bg-muted">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <p className="text-xs text-muted-foreground">
        {photos.length === 0
          ? 'Voce pode pular essa etapa e voltar depois.'
          : `${photos.length} foto${photos.length === 1 ? '' : 's'} adicionada${photos.length === 1 ? '' : 's'}.`}
      </p>

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button size="lg" onClick={onNext}>
          {photos.length > 0 ? 'Proximo' : 'Pular'}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
