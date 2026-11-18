import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { Department } from '../../types/kpi';

export const LoginModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
  onRegister?: (credentials: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    departmentId: number | null;
  }) => Promise<{ success: boolean; message?: string }>;
  departments?: Department[];
  error: string;
}> = ({ open, onClose, onLogin, onRegister, departments = [], error }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Register form states
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDeptId, setRegDeptId] = useState<number | string>('');

  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setIdentifier('');
      setPassword('');
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegDeptId(departments[0]?.id || '');
      setLocalError('');
      setSuccessMessage('');
      setIsSubmitting(false);
    }
  }, [open, departments]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    onLogin(identifier, password);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    if (!regFullName.trim()) {
      setLocalError('F.I.Sh. kiritilishi shart');
      return;
    }
    if (!regEmail.trim()) {
      setLocalError('Email manzili kiritilishi shart');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setLocalError('Kiritilgan parollar bir-biriga mos kelmadi');
      return;
    }

    if (!onRegister) {
      setLocalError("Ro'yxatdan o'tish hozirda faol emas");
      return;
    }

    setIsSubmitting(true);
    const username = regEmail.split('@')[0] || regFullName.toLowerCase().replace(/\s+/g, '_');
    const deptIdNum = regDeptId ? Number(regDeptId) : null;

    const res = await onRegister({
      username,
      email: regEmail.trim(),
      password: regPassword,
      fullName: regFullName.trim(),
      departmentId: deptIdNum,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || "Akkaunt muvaffaqiyatli yaratildi! Tizimga kirdingiz.");
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setLocalError(res.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    }
  };

  const displayError = localError || error;

  return (
    <Modal open={open} onClose={onClose}>
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3">
          {mode === 'login' ? <LogIn size={24} className="text-white" /> : <UserPlus size={24} className="text-white" />}
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {mode === 'login' ? 'Tizimga kirish' : 'Ro‘yxatdan o‘tish'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">KPI Monitoring va Samaradorlik portali</p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-5">
        <button
          type="button"
          onClick={() => { setMode('login'); setLocalError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === 'login'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Kirish
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setLocalError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === 'register'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Ro‘yxatdan o‘tish
        </button>
      </div>

      {mode === 'login' ? (
        /* LOGIN FORM */
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-id" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
              Email manzili
            </label>
            <input
              type="email"
              id="login-id"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
              placeholder="masalan: oqituvchi@kpi.uz"
              autoComplete="email"
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

          {displayError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-3 py-2.5">
              <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">{displayError}</p>
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
            Akkauntingiz yo'qmi?{' '}
            <button
              type="button"
              onClick={() => { setMode('register'); setLocalError(''); }}
              className="font-bold text-indigo-500 hover:underline"
            >
              Ro‘yxatdan o‘tish
            </button>
          </p>
        </form>
      ) : (
        /* REGISTER FORM */
        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              F.I.Sh. (To'liq ism-familiya)
            </label>
            <input
              type="text"
              value={regFullName}
              onChange={(e) => setRegFullName(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
              placeholder="masalan: Alisher Vohidov"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Elektron pochta (Email)
            </label>
            <input
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
              placeholder="masalan: alisher@kpi.uz"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
              Kafedrangiz
            </label>
            <select
              value={regDeptId}
              onChange={(e) => setRegDeptId(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3.5 py-2 text-xs focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="" disabled>Kafedrani tanlang</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Parol
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                placeholder="Kamida 6 belgi"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">
                Parol tasdig'i
              </label>
              <input
                type="password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500"
                placeholder="Qayta kiriting"
                required
              />
            </div>
          </div>

          {displayError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 px-3 py-2.5">
              <AlertCircle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400 font-medium">{displayError}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2.5">
              <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{successMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <UserPlus size={15} />
            {isSubmitting ? 'Yaratilmoqda...' : 'Ro‘yxatdan o‘tish'}
          </button>

          <p className="text-center text-xs text-slate-400 pt-1">
            Allaqachon akkauntingiz bormi?{' '}
            <button
              type="button"
              onClick={() => { setMode('login'); setLocalError(''); }}
              className="font-bold text-indigo-500 hover:underline"
            >
              Tizimga kirish
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
};