import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LogIn,
  ShieldCheck,
  Ticket,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    if (isSignUp && !name.trim()) {
      setError('Informe seu nome.');
      setSubmitting(false);
      return;
    }

    const result = isSignUp
      ? await signUp(email.trim(), password, name.trim())
      : await signIn(email.trim(), password);

    if (result.error) {
      setError(
        isSignUp
          ? 'Não foi possível criar a conta. Verifique os dados.'
          : 'Não foi possível entrar. Verifique e-mail e senha.',
      );
    } else if (isSignUp && 'needsConfirmation' in result && result.needsConfirmation) {
      setConfirmationSent(true);
    }
    setSubmitting(false);
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Informe seu e-mail para receber o link de recuperação.');
      return;
    }
    setSubmitting(true);
    setError('');
    setResetSent(false);
    const result = await resetPassword(email.trim());
    if (result.error) setError('Não foi possível enviar o e-mail de recuperação.');
    else setResetSent(true);
    setSubmitting(false);
  };

  const switchMode = () => {
    setIsSignUp((value) => !value);
    setError('');
    setResetSent(false);
    setConfirmationSent(false);
    setPassword('');
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#12110f] text-[#f7f2e9]">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#d7ff63]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 h-[24rem] w-[24rem] rounded-full bg-[#ff795b]/10 blur-3xl" />

      <div className="relative mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.86fr] lg:gap-20 lg:px-12">
        <section className="hidden lg:block" aria-label="Sobre a plataforma">
          <div className="mb-16 flex items-center gap-3 text-sm font-semibold tracking-[0.22em] text-[#d7ff63]">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-[#d7ff63]/40 bg-[#d7ff63]/10">
              <Ticket className="h-4 w-4" />
            </span>
            ELITE TICKETS
          </div>
          <p className="mb-5 max-w-lg font-mono text-xs uppercase tracking-[0.28em] text-[#ff795b]">
            Seu próximo evento começa aqui
          </p>
          <h1 className="max-w-xl font-serif text-6xl leading-[0.95] tracking-[-0.055em] text-[#f7f2e9] xl:text-7xl">
            Uma entrada.<br />
            <span className="text-[#d7ff63]">Uma memória.</span>
          </h1>
          <p className="mt-8 max-w-md text-base leading-7 text-[#a8a198]">
            Encontre experiências, garanta seu lugar e chegue ao evento com tudo sob controle.
          </p>
          <div className="mt-14 flex items-center gap-3 text-sm text-[#a8a198]">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
              <ShieldCheck className="h-4 w-4 text-[#d7ff63]" />
            </span>
            Ingressos protegidos por validação única
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[#d7ff63]/40 bg-[#d7ff63]/10 text-[#d7ff63]">
              <Ticket className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold tracking-[0.2em] text-[#d7ff63]">ELITE TICKETS</span>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#f7f2e9] p-6 text-[#191714] shadow-[0_28px_80px_rgba(0,0,0,0.35)] sm:p-9">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e75d43]">
                  Acesso seguro
                </p>
                <h2 className="font-serif text-4xl leading-none tracking-[-0.04em]">
                  {isSignUp ? 'Crie seu acesso' : 'Bem-vindo de volta'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#716b63]">
                  {isSignUp ? 'Cadastre-se como cliente e acompanhe seus ingressos.' : 'Entre para continuar sua jornada.'}
                </p>
              </div>
              <KeyRound className="mt-1 h-5 w-5 shrink-0 text-[#e75d43]" aria-hidden="true" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignUp && (
                <label className="block text-sm font-medium text-[#4e4942]">
                  Seu nome
                  <input
                    required
                    autoComplete="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d8d0c4] bg-white px-4 py-3 text-[#191714] outline-none transition placeholder:text-[#aaa198] focus:border-[#e75d43] focus:ring-4 focus:ring-[#e75d43]/10"
                  />
                </label>
              )}

              <label className="block text-sm font-medium text-[#4e4942]">
                E-mail
                <input
                  required
                  autoComplete="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[#d8d0c4] bg-white px-4 py-3 text-[#191714] outline-none transition placeholder:text-[#aaa198] focus:border-[#e75d43] focus:ring-4 focus:ring-[#e75d43]/10"
                />
              </label>

              <label className="block text-sm font-medium text-[#4e4942]">
                Senha
                <span className="relative mt-2 block">
                  <input
                    required
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-[#d8d0c4] bg-white px-4 py-3 pr-12 text-[#191714] outline-none transition placeholder:text-[#aaa198] focus:border-[#e75d43] focus:ring-4 focus:ring-[#e75d43]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#8a8278] transition hover:bg-[#f1ebe2] hover:text-[#191714]"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>

              {error && <p role="alert" className="rounded-xl border border-[#e75d43]/20 bg-[#e75d43]/10 px-3 py-2.5 text-sm text-[#b6402d]">{error}</p>}
              {resetSent && <p role="status" className="rounded-xl border border-[#5a8a38]/20 bg-[#d7ff63]/20 px-3 py-2.5 text-sm text-[#416826]">Se o e-mail existir, enviaremos um link de recuperação.</p>}
              {confirmationSent && <p role="status" className="rounded-xl border border-[#5a8a38]/20 bg-[#d7ff63]/20 px-3 py-2.5 text-sm text-[#416826]">Conta criada. Confira seu e-mail para confirmar o cadastro.</p>}

              <button
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#191714] px-4 py-3.5 text-sm font-semibold text-[#f7f2e9] transition hover:bg-[#e75d43] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Aguarde...' : isSignUp ? 'Criar minha conta' : 'Entrar na plataforma'}
                {submitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : isSignUp ? <UserPlus className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-4 text-center text-xs text-[#716b63]">
              {!isSignUp && (
                <button type="button" disabled={submitting} onClick={() => void handleResetPassword()} className="transition hover:text-[#e75d43] disabled:opacity-50">
                  Esqueci minha senha
                </button>
              )}
              <button type="button" disabled={submitting} onClick={switchMode} className="font-medium text-[#191714] underline decoration-[#e75d43]/50 underline-offset-4 transition hover:text-[#e75d43] disabled:opacity-50">
                {isSignUp ? 'Já tenho uma conta' : 'Ainda não tenho conta'}
              </button>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-[#716b63]">Acesso protegido · Elite Tickets</p>
        </section>
      </div>
    </main>
  );
}
