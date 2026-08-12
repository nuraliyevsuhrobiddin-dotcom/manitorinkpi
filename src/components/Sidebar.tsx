import React from 'react';
import { X, Sparkles, Shield, User as UserIcon } from 'lucide-react';

export type SidebarNavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

type SidebarProps = {
  activeView: string;
  logoPath: string;
  navItems: SidebarNavItem[];
  onClose?: () => void;
  onNavigate: (viewId: string) => void;
  title: string;
  user?: { role?: string; username?: string; fullName?: string; departmentName?: string } | null;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  logoPath,
  navItems,
  onClose,
  onNavigate,
  title,
  user,
}) => {
  const isSuperAdmin = user?.role === 'superadmin';
  const isDeptAdmin = user?.role === 'admin';

  return (
    <aside
      className="h-full bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shadow-2xl relative z-20 select-none"
      style={{ width: 'min(18rem, 86vw)' }}
    >
      {/* Top Branding Section */}
      <div className="h-20 flex items-center justify-between border-b border-slate-800/80 px-5 relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center space-x-3 min-w-0 z-10">
          <div className="relative flex-shrink-0">
            <img src={logoPath} alt="Logo" className="h-10 w-10 object-contain drop-shadow-md" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold tracking-wider text-indigo-400 uppercase flex items-center gap-1">
              <Sparkles size={11} /> MONITORING KPI
            </span>
            <h1 className="text-sm font-bold text-white truncate leading-tight tracking-tight">{title}</h1>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
            aria-label="Menyuni yopish"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-grow px-3 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Asosiy Menyular
        </div>
        {navItems.map(item => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold scale-[1.02]'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <item.icon
                  size={19}
                  className={`flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm flex-shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Badge Footer */}
      {user && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className={`p-2 rounded-lg flex-shrink-0 ${isSuperAdmin ? 'bg-purple-600/20 text-purple-400' : isDeptAdmin ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-700 text-slate-300'}`}>
              {isSuperAdmin ? <Shield size={18} /> : <UserIcon size={18} />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {user.fullName || user.username}
              </span>
              <span className="text-[11px] font-medium text-slate-400 truncate">
                {isSuperAdmin
                  ? "👑 Super Admin"
                  : isDeptAdmin
                  ? `🔑 ${user.departmentName || "Bo'lim Admini"}`
                  : "Mehmon rejimi"}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
