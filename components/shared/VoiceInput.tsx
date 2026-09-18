'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos da Web Speech API (Chromium expõe webkitSpeechRecognition; padrao vem em alguns browsers).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort?(): void;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type WindowWithSpeech = Window & {
  SpeechRecognition?: { new (): SpeechRecognitionLike };
  webkitSpeechRecognition?: { new (): SpeechRecognitionLike };
};

export type VoiceInputProps = {
  /** Callback recebe o texto transcrito. Use com setState do campo. */
  onResult: (text: string) => void;
  /** Idioma BCP-47. Padrao: pt-BR. */
  lang?: string;
  /** Visual: icone ou botao completo. */
  variant?: 'icon' | 'full';
  /** Classe extra aplicada no botao. */
  className?: string;
  /** Desabilita o botao. */
  disabled?: boolean;
};

/**
 * Botao de entrada por voz usando a Web Speech API do navegador.
 * Roda 100% no client (sem LLM, sem backend).
 * Funciona em Chrome/Edge (desktop e Android). Safari tem suporte parcial.
 */
export function VoiceInput({
  onResult,
  lang = 'pt-BR',
  variant = 'icon',
  className,
  disabled,
}: VoiceInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Guarda o callback atual sem re-criar o recognition.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    const w = window as WindowWithSpeech;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    setSupported(Boolean(Ctor));
    if (!Ctor) return;

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (ev: any) => {
      const last = ev.results?.[ev.results.length - 1];
      const text = last?.[0]?.transcript?.trim() ?? '';
      if (text) onResultRef.current(text);
    };
    rec.onerror = (ev: any) => {
      setError(ev?.error ?? 'erro');
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.onstart = () => setListening(true);

    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function toggle() {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    setError(null);
    try {
      recognitionRef.current.start();
    } catch {
      // se ja estiver startado, ignora
    }
  }

  if (supported === false) {
    return null;
  }

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={listening ? 'Parar gravacao' : 'Falar para preencher'}
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors',
          listening
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-input bg-background hover:bg-accent',
          className
        )}
      >
        {listening ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Ouvindo...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Falar
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? 'Parar gravacao' : 'Entrada por voz'}
      title={error ? `Erro: ${error}` : listening ? 'Ouvindo... clique para parar' : 'Falar para preencher'}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors',
        listening
          ? 'border-red-300 bg-red-50 text-red-700 animate-pulse'
          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        className
      )}
    >
      {listening ? (
        listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
