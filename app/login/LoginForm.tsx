'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Accès non autorisé. Ce système est privé.');
    }
  }, [searchParams]);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL;
    if (email !== allowedEmail) {
      setError('Accès non autorisé.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou mot de passe incorrect.');
    } else {
      router.push('/fivem'); // ← redirige vers la MDT FiveM
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError("Erreur lors de l'envoi du mail de réinitialisation.");
    } else {
      setResetSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">⚕️</div>
          <h1 className="text-2xl font-bold text-white">La Tanière de l'EMS</h1>
          <p className="text-gray-400 text-sm mt-1">Système de gestion documentaire privé</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {mode === 'login' ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">Connexion</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </form>

              <button
                onClick={() => { setMode('reset'); setError(''); }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition w-full text-center"
              >
                Mot de passe oublié ?
              </button>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-6">
                Réinitialiser le mot de passe
              </h2>
              {resetSent ? (
                <div className="text-center">
                  <div className="text-4xl mb-3">📧</div>
                  <p className="text-gray-300">Email envoyé ! Vérifiez votre boîte mail.</p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 transition"
                  >
                    {loading ? 'Envoi...' : 'Envoyer le lien'}
                  </button>
                </form>
              )}
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition w-full text-center"
              >
                ← Retour à la connexion
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Système privé — Accès restreint
        </p>
      </div>
    </div>
  );
}
