import React, { useState, useEffect } from 'react';
import { LogIn, AlertCircle, ShieldCheck, Lock } from 'lucide-react';
import { Modal } from '../ui/Modal';

export const LoginModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
  error: string;
}> = ({ open, onClose, onLogin, error }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setIdentifier('');
      setPassword('');
      setLocalError('');
      setIsSubmitting(false);
    }
  }, [open]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!identifier.trim() || !password.trim()) {
      setLocalError('Login va parolni kiriting');
      return;
    }
    setIsSubmitting(true);
    onLogin(identifier, password);
    // Reset submitting state after short delay
    setTimeout(() => setIsSubmitting(false), 1200);
  };

  const displayError = localError || error;

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
          <LogIn size={26} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Tizimga kirish
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          O'zbekiston KPI Reyting & Samaradorlik Monitoring Portali
        </p>
      </div>

      {/* LOGIN FORM */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-id" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Email yoki Login
          </label>
          <div className="relative">
            <input
              type="text"
              id="login-id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="masalan: dekan@kpi.uz yoki admin"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-pass" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Parol
          </label>
          <div className="relative">
            <input
              type="password"
              id="login-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {displayError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-3.5 py-2.5 animate-shake">
            <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">{displayError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          <Lock size={16} />
          {isSubmitting ? 'Tekshirilmoqda...' : 'Tizimga Kirish'}
        </button>

        {/* Official notice box — Admin only issues credentials */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
          <ShieldCheck size={18} className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
              Xavfsiz yopiq tizim
            </span>
            Tizimga erkin ro'yxatdan o'tish yopiq. Foydalanuvchi login va paroli faqat <strong>Rektorat / Administrator</strong> tomonidan rasman taqdim etiladi.
          </div>
        </div>
      </form>
    </Modal>
  );
};
