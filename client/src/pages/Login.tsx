import React, { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError('');
    if (isSignUp && !name.trim()) { setError('Informe seu nome.'); setSubmitting(false); return; }
    const result = isSignUp
      ? await signUp(email.trim(), password, name.trim())
      : await signIn(email.trim(), password);
    if (result.error) setError(isSignUp ? 'Não foi possível criar a conta. Verifique os dados.' : 'Não foi possível entrar. Verifique e-mail e senha.');
    else if (isSignUp && 'needsConfirmation' in result && result.needsConfirmation) setConfirmationSent(true);
    setSubmitting(false);
  };
  const handleResetPassword = async () => {
    if (!email.trim()) { setError('Informe seu e-mail para receber o link de recuperação.'); return; }
    setSubmitting(true); setError(''); setResetSent(false);
    const result = await resetPassword(email.trim());
    if (result.error) setError('Não foi possível enviar o e-mail de recuperação.');
    else setResetSent(true);
    setSubmitting(false);
  };
  return <main className="min-h-[100dvh] bg-[#09090b] text-zinc-100 flex items-center justify-center px-4">
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#111113] p-6 space-y-5">
      <div><p className="text-xs font-mono text-emerald-400">ELITE TICKETS</p><h1 className="text-2xl font-semibold mt-2">{isSignUp ? 'Criar conta' : 'Entrar na plataforma'}</h1><p className="text-sm text-zinc-500 mt-1">{isSignUp ? 'Cadastre-se como cliente para comprar ingressos.' : 'Acesse de acordo com o seu perfil.'}</p></div>
      {isSignUp && <label className="block text-sm text-zinc-400">Nome<input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>}
      <label className="block text-sm text-zinc-400">E-mail<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      <label className="block text-sm text-zinc-400">Senha<input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-white outline-none focus:border-emerald-500" /></label>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      {resetSent && <p role="status" className="text-sm text-emerald-400">Se o e-mail existir, enviaremos um link de recuperação.</p>}
      {confirmationSent && <p role="status" className="text-sm text-emerald-400">Conta criada. Confira seu e-mail para confirmar o cadastro.</p>}
      <button disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50">{isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}{submitting ? 'Aguarde...' : isSignUp ? 'Criar conta' : 'Entrar'}</button>
      {!isSignUp && <button type="button" disabled={submitting} onClick={() => void handleResetPassword()} className="w-full text-xs text-zinc-400 hover:text-emerald-400 disabled:opacity-50">Esqueci minha senha</button>}
      <button type="button" disabled={submitting} onClick={() => { setIsSignUp((value) => !value); setError(''); setConfirmationSent(false); }} className="w-full text-xs text-zinc-400 hover:text-white disabled:opacity-50">{isSignUp ? 'Já tenho uma conta' : 'Ainda não tenho conta'}</button>
    </form>
  </main>;
}
