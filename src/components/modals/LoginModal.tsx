import React, { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { Modal } from '../ui/Modal';

// Faqat kirish modal — ro'yxatdan o'tish Super Admin panelidan amalga oshiriladi
export const LoginModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
  error: string;
}> = ({ open, onClose, onLogin, error }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) { setIdentifier(''); setPassword(''); }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, password);
  };

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
          <LogIn size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tizimga kirish</h1>
        <p className="text-xs text-slate-500 mt-1">KPI Monitoring va Reyting tizimi</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-id" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Email manzili
          </label>
          <input
            type="text"
            id="login-id"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            placeholder="masalan: admin@kpi.uz"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label htmlFor="login-pass" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
            Parol
          </label>
          <input
            type="password"
            id="login-pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-3 py-2.5">
            <span className="text-red-500 mt-0.5 flex-shrink-0">⚠</span>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-[0.98]"
        >
          <LogIn size={16} />
          Tizimga Kirish
        </button>

        <p className="text-center text-xs text-slate-400 pt-1">
          Yangi admin yaratish — <span className="font-semibold text-indigo-500">Super Admin panelidan</span> amalga oshiriladi
        </p>
      </form>
    </Modal>
  );
};
