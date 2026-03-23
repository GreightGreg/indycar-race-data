import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useRef, useEffect } from 'react';

const TABS = ['Results','Weekend','Position Chart','Laps Led','Head to Head','Pit Strategy','Fastest Laps','Championship'];

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNav = ({ activeTab, onTabChange }: TabNavProps) => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  if (isMobile) {
    return (
      <nav className="bg-racing-bg border-b border-racing-border relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="font-condensed font-semibold text-sm text-racing-yellow">{activeTab}</span>
          <svg className={`w-4 h-4 text-racing-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 bg-racing-surface border-b border-racing-border z-50 shadow-lg">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { onTabChange(tab); setMenuOpen(false); }}
                className={`w-full text-left font-condensed font-semibold text-sm px-4 py-3 transition-colors ${
                  activeTab === tab
                    ? 'text-racing-yellow bg-racing-surface2'
                    : 'text-racing-muted hover:text-racing-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className="bg-racing-bg border-b border-racing-border overflow-x-auto scrollbar-none">
      <div className="max-w-[1400px] mx-auto px-4 flex gap-0 min-w-max">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`font-condensed font-semibold text-sm px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-racing-yellow border-racing-yellow'
                : 'text-racing-muted border-transparent hover:text-racing-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default TabNav;