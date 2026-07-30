import { SendHorizonal } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

type ChatComposerProps = {
  disabled?: boolean;
  placeholder: string;
  onSend: (message: string) => Promise<void> | void;
};

export const ChatComposer = ({ disabled, placeholder, onSend }: ChatComposerProps) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || disabled || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-white/10 pt-3">
      <input
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        disabled={disabled || sending}
        maxLength={2000}
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder={placeholder}
      />
      <button
        type="submit"
        disabled={disabled || sending || !message.trim()}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        title="Gửi"
      >
        <SendHorizonal size={18} />
      </button>
    </form>
  );
};
