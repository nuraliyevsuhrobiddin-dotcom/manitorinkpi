import React from 'react';
import { X } from 'lucide-react';

export type SidebarNavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
};

type SidebarProps = {
  activeView: string;
  logoPath: string;
  navItems: SidebarNavItem[];
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  title: string;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  logoPath,
  navItems,
  onClose,
  onNavigate,
  title,
}) => {
  return (
    <aside
      className="h-full bg-white dark:bg-gray-950 shadow-2xl flex flex-col border-r border-gray-200 dark:border-gray-800"
      style={{ width: 'min(18rem, 86vw)' }}
    >
      <div className="h-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-4 overflow-hidden">
        <div className="flex items-center min-w-0 overflow-hidden">
          <img src={logoPath} alt="Logo" className="h-12 w-12 object-contain mr-3 flex-shrink-0" />
          <h1 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight truncate min-w-0">{title}</h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label="Menyuni yopish"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-grow px-4 py-5 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 mb-2 ${
              activeView === item.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <item.icon size={20} className="mr-3 flex-shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
