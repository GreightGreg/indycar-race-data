const TABS = ['Results','Weekend','Position Chart','Laps Led','Head to Head','Pit Strategy','Fastest Laps','Championship'];

interface TabNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabNav = ({ activeTab, onTabChange }: TabNavProps) => (
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

export default TabNav;
