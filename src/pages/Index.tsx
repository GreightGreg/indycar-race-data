import { useState } from 'react';
import Header from '@/components/racing/Header';
import TabNav from '@/components/racing/TabNav';
import Footer from '@/components/racing/Footer';
import ResultsTab from '@/components/tabs/ResultsTab';
import WeekendTab from '@/components/tabs/WeekendTab';
import PositionChartTab from '@/components/tabs/PositionChartTab';
import LapsLedTab from '@/components/tabs/LapsLedTab';
import HeadToHeadTab from '@/components/tabs/HeadToHeadTab';
import PitStrategyTab from '@/components/tabs/PitStrategyTab';
import FastestLapsTab from '@/components/tabs/FastestLapsTab';
import ChampionshipTab from '@/components/tabs/ChampionshipTab';
import { useRaces } from '@/hooks/useRaceData';
import { RaceContext } from '@/contexts/RaceContext';

const TAB_COMPONENTS: Record<string, React.FC> = {
  'Race Results': ResultsTab,
  'Session Results': WeekendTab,
  'Position Chart': PositionChartTab,
  'Laps Led': LapsLedTab,
  'Head to Head': HeadToHeadTab,
  'Pit Strategy': PitStrategyTab,
  'Fastest Laps': FastestLapsTab,
  'Championship': ChampionshipTab,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('Race Results');
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const { data: races, isLoading } = useRaces();
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);

  // Auto-select first race
  const raceId = selectedRaceId || races?.[0]?.id || null;

  const ActiveComponent = TAB_COMPONENTS[activeTab] || ResultsTab;

  return (
    <RaceContext.Provider value={{ raceId, setRaceId: setSelectedRaceId }}>
      <div className="min-h-screen bg-racing-bg">
        <Header races={races || []} selectedRaceId={raceId} onRaceChange={setSelectedRaceId} isLoading={isLoading} />
        <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="max-w-[1400px] mx-auto px-4 py-6">
          {raceId ? <ActiveComponent /> : (
            <p className="text-racing-muted font-body text-center py-12">
              {isLoading ? 'Loading races…' : 'No races available yet.'}
            </p>
          )}
        </main>
        <Footer />
      </div>
    </RaceContext.Provider>
  );
};

export default Index;
