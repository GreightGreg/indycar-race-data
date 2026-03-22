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

const TAB_COMPONENTS: Record<string, React.FC> = {
  'Results': ResultsTab,
  'Weekend': WeekendTab,
  'Position Chart': PositionChartTab,
  'Laps Led': LapsLedTab,
  'Head to Head': HeadToHeadTab,
  'Pit Strategy': PitStrategyTab,
  'Fastest Laps': FastestLapsTab,
  'Championship': ChampionshipTab,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('Results');
  const ActiveComponent = TAB_COMPONENTS[activeTab] || ResultsTab;

  return (
    <div className="min-h-screen bg-racing-bg">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <ActiveComponent />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
