import React, { useState } from 'react';
import { LogIn, Shield, AlertCircle, Sparkles, Building2 } from 'lucide-react';

type LoginPageProps = {
  logoPath?: string;
  onLogin: (username: string, password: string) => void;
  error?: string;
};

export const LoginPage: React.FC<LoginPageProps> = ({
  logoPath,
  onLogin,
  error,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!identifier.trim() || !password.trim()) {
      setLocalError('Login va parolni kiriting');
      return;
    }

    setIsSubmitting(true);
    onLogin(identifier, password);
    setTimeout(() => setIsSubmitting(false), 1200);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-4 md:p-6 relative overflow-hidden select-none">
      {/* Background Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Card */}
        <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
          {/* Top Logo & Title */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-4">
              {logoPath ? (
                <div className="w-20 h-20 rounded-2xl bg-white p-2.5 shadow-xl flex items-center justify-center">
                  <img src={logoPath} alt="Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30">
                  <Building2 size={38} />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-[10px]">
                ✓
              </div>
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5 mb-1">
              <Sparkles size={13} /> O'zbekiston KPI Reyting & Monitoring
            </span>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Yopiq Axborot Tizimi
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Professor-o'qituvchilar va ma'muriyat uchun yagona shaxsiy kabinet
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Login yoki Email
              </label>
              <input
                id="login-username"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="masalan: dekan@kpi.uz yoki admin"
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Parol
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {displayError && (
              <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>{displayError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <LogIn size={18} />
              <span>{isSubmitting ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}</span>
            </button>
          </form>

          {/* Official Closed System Notice */}
          <div className="mt-6 p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3">
            <Shield size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed">
              <span className="font-bold text-white block mb-0.5">Xavfsiz yopiq tizim</span>
              Tizimga erkin ro'yxatdan o'tish yopiq. Foydalanuvchi hisoblari faqat <strong>Rektorat / Administrator</strong> tomonidan rasman ochib beriladi.
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 mt-5">
          © {new Date().getFullYear()} Oliy Ta'lim Muassasasi. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
};
