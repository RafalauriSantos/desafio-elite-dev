import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError('');
    const result = await signIn(email.trim(), password);
    if (result.error) setError('Não foi possível entrar. Verifique e-mail e senha.');
    setSubmitting(false);
  };
  return <main className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex items-center justify-center px-4">
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#111113] p-6 space-y-5">
      <div><p className="text-xs font-mono text-emerald-400">ELITE TICKETS</p><h1 className="text-2xl font-semibold mt-2">Entrar na plataforma</h1><p className="text-sm text-zinc-500 mt-1">Acesse de acordo com o seu perfil.</p></div>
      <label className="block text-sm text-zinc-400">E-mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      <label className="block text-sm text-zinc-400">Senha<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"><LogIn className="w-4 h-4" />{submitting ? 'Entrando...' : 'Entrar'}</button>
    </form>
  </main>;
}
