import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { signIn, signUp, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validar contraseñas en registro
    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } else {
      const { error } = await signUp(email, password, name);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('¡Cuenta creada! Revisa tu correo para verificar tu cuenta.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-container-lowest rounded-[2rem] p-10 shadow-2xl border border-surface-container-low">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <LayoutDashboard className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-primary tracking-tight">Ledger</h1>
              <p className="text-[8px] uppercase tracking-[0.2em] text-on-surface-variant font-semibold">Inteligencia Financiera</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-on-surface">
              {isLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="text-on-surface-variant text-sm mt-2">
              {isLogin ? 'Ingresa tus credenciales para acceder' : 'Comienza a gestionar tus finanzas hoy'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-surface-container-high/50 border border-surface-container-low rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-surface-container-high/50 border border-surface-container-low rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-container-high/50 border border-surface-container-low rounded-xl py-3.5 pl-12 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-surface-container-high/50 border border-surface-container-low rounded-xl py-3.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required={!isLogin}
                    minLength={6}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-gradient py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <p className="text-on-surface-variant text-sm">
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-primary font-bold hover:underline"
              >
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mt-6">
          © 2024 Editorial Financial Intelligence
        </p>
      </motion.div>
    </div>
  );
}
