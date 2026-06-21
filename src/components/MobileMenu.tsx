import React, { useEffect } from 'react';
import { Sidebar, SidebarNavItem } from './Sidebar';

type MobileMenuProps = {
  activeView: string;
  isOpen: boolean;
  logoPath: string;
  navItems: SidebarNavItem[];
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  title: string;
};

export const MobileMenu: React.FC<MobileMenuProps> = ({
  activeView,
  isOpen,
  logoPath,
  navItems,
  onClose,
  onNavigate,
  title,
}) => {
  const [shouldRender, setShouldRender] = React.useState(isOpen);

  useEffect(() => {
    let timeoutId: number;

    if (isOpen) {
      timeoutId = window.setTimeout(() => setShouldRender(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => setShouldRender(false), 300);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition duration-300 ${
        isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(3, 7, 18, 0.55)',
          opacity: isOpen ? 1 : 0,
        }}
        aria-label="Overlay orqali menyuni yopish"
        tabIndex={isOpen ? 0 : -1}
      />
      <div
        className={`relative h-full transform transition-transform duration-300 ease-out touch-pan-y ${
          isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
        style={{ width: 'fit-content' }}
      >
        <Sidebar
          activeView={activeView}
          logoPath={logoPath}
          navItems={navItems}
          onClose={onClose}
          onNavigate={(viewId) => {
            onNavigate(viewId);
            onClose();
          }}
          title={title}
        />
      </div>
    </div>
  );
};
