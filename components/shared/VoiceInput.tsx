'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos da Web Speech API (Chromium expoe webkitSpeechRecognition).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
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
  /** Callback recebe o texto transcrito. */
  onResult: (text: string) => void;
  /** Idioma BCP-47. Padrao: pt-BR. */
  lang?: string;
  /** Visual: icone (botao compacto) ou full (botao com label). */
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
 *
 * Renderiza null se o navegador nao suportar a API (ex.: Firefox).
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
  // Mantem o callback atual sem precisar recriar o recognition.
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as WindowWithSpeech;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (ev: any) => {
      const last = ev.results?.[ev.results.length - 1];
      const text = last?.[0]?.transcript?.trim() ?? '';
      if (text) onResultRef.current(text);
    };
    rec.onerror = (ev: any) => {
      const code = ev?.error ?? 'desconhecido';
      // Mensagens em portugues para os erros mais comuns.
      const map: Record<string, string> = {
        'not-allowed': 'Permissao do microfone negada',
        'no-speech': 'Nenhuma fala detectada',
        'audio-capture': 'Microfone indisponivel',
        'network': 'Erro de rede no reconhecimento',
        'aborted': 'Cancelado',
      };
      setError(map[code] ?? `Erro: ${code}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  function toggle() {
    if (!recognitionRef.current) return;
    if (listening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      return;
    }
    setError(null);
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (err: any) {
      setError(err?.message || 'Falha ao iniciar');
      setListening(false);
    }
  }

  // Nao suportado pelo navegador: nao renderiza nada.
  if (supported === false) return null;

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
        {error ? (
          <>
            <AlertCircle className="h-4 w-4" />
            <span className="truncate max-w-[10rem]">{error}</span>
          </>
        ) : listening ? (
          <>
            <MicOff className="h-4 w-4 animate-pulse" />
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
      title={
        error
          ? error
          : listening
          ? 'Ouvindo... clique para parar'
          : 'Falar para preencher'
      }
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors',
        listening
          ? 'border-red-300 bg-red-50 text-red-700 animate-pulse'
          : error
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
        className
      )}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
