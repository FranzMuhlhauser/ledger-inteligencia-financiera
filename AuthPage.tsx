import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('¡Cuenta creada! Revisa tu email para verificar.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Ledger</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold mt-1">
            Inteligencia Financiera
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-surface-container-low">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface mb-2">
              {isSignUp ? 'Crear cuenta' : 'Bienvenido'}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {isSignUp
                ? 'Ingresa tus datos para comenzar'
                : 'Ingresa tus credenciales para continuar'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-surface-container-high/50 border-none rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-gradient py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Cargando...</span>
              ) : isSignUp ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Crear cuenta</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar sesión</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              {isSignUp
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant text-center mt-8">
          © 2024 Ledger Financial Intelligence
        </p>
      </div>
    </div>
  );
}
