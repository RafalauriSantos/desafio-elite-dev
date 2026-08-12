import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function PasswordRecovery() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) { setError('A senha deve ter pelo menos 8 caracteres.'); return; }
    if (password !== confirmation) { setError('As senhas não conferem.'); return; }
    const result = await updatePassword(password);
    if (result.error) setError('Não foi possível atualizar a senha. Solicite um novo link.');
    else setSaved(true);
  };

  return <main className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex items-center justify-center px-4">
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#111113] p-6 space-y-5">
      <div><p className="text-xs font-mono text-emerald-400">ELITE TICKETS</p><h1 className="text-2xl font-semibold mt-2">Criar nova senha</h1><p className="text-sm text-zinc-500 mt-1">Escolha uma senha segura para sua conta.</p></div>
      <label className="block text-sm text-zinc-400">Nova senha<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      <label className="block text-sm text-zinc-400">Confirmar senha<input required minLength={8} type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-400">Senha atualizada. Você já pode continuar na plataforma.</p>}
      <button disabled={saved} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"><KeyRound className="w-4 h-4" />Atualizar senha</button>
    </form>
  </main>;
}
