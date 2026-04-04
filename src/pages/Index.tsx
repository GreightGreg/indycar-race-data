import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/racing/Header';
import TabNav from '@/components/racing/TabNav';
import Footer from '@/components/racing/Footer';
import ResultsTab from '@/components/tabs/ResultsTab';
import WeekendTab from '@/components/tabs/WeekendTab';
import PositionChartTab from '@/components/tabs/PositionChartTab';
import LapsLedTab from '@/components/tabs/LapsLedTab';
import HeadToHeadTab from '@/components/tabs/HeadToHeadTab';
import PitStrategyTab from '@/components/tabs/PitStrategyTab';
import TrackDominanceTab from '@/components/tabs/TrackDominanceTab';
import SeasonStatsTab from '@/components/tabs/SeasonStatsTab';
import ChampionshipTab from '@/components/tabs/ChampionshipTab';
import TeamGridTab from '@/components/tabs/TeamGridTab';
import { useRaces } from '@/hooks/useRaceData';
import { RaceContext } from '@/contexts/RaceContext';
import { parseDeepLink, slugToTab, tabToSlug, buildDeepLink, copyDeepLink } from '@/lib/deepLink';
import { Link2 } from 'lucide-react';
import { toast } from 'sonner';
import RaceChatPanel from '@/components/racing/RaceChatPanel';

const TAB_COMPONENTS: Record<string, React.FC> = {
  'Race Results': ResultsTab,
  'Session Results': WeekendTab,
  'Position Chart': PositionChartTab,
  'Laps Led': LapsLedTab,
  'Head to Head': HeadToHeadTab,
  'Pit Strategy': PitStrategyTab,
  'Season Stats': SeasonStatsTab,
  'Track Dominance': TrackDominanceTab,
  'Championship': ChampionshipTab,
  'Season Overview': TeamGridTab,
};

const Index = () => {
  const { data: races, isLoading } = useRaces();
  const deepLink = useRef(parseDeepLink());
  const initializedRef = useRef(false);

  const [activeTab, setActiveTab] = useState('Race Results');
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  // Initialize from deep link once races load
  useEffect(() => {
    if (!races?.length || initializedRef.current) return;
    initializedRef.current = true;
    const dl = deepLink.current;

    if (dl.year && dl.round) {
      const match = races.find(r => r.year === dl.year && r.round_number === dl.round);
      if (match) setSelectedRaceId(match.id);
    }
    if (dl.tab) {
      const tabName = slugToTab(dl.tab);
      if (TAB_COMPONENTS[tabName]) setActiveTab(tabName);
    }
    if (dl.section) {
      setPendingSection(dl.section);
    }
  }, [races]);

  // Auto-select first race if none selected
  const raceId = selectedRaceId || races?.[0]?.id || null;

  // Get current race for URL building
  const currentRace = races?.find(r => r.id === raceId);

  // Update URL hash on state change
  useEffect(() => {
    if (!currentRace) return;
    const hash = `#/year/${currentRace.year}/round/${currentRace.round_number}/tab/${tabToSlug(activeTab)}`;
    window.history.replaceState(null, '', hash);
  }, [currentRace, activeTab]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setPendingSection(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Scroll to section after render
  useEffect(() => {
    if (!pendingSection) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(pendingSection!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('deep-link-highlight');
        setTimeout(() => el.classList.remove('deep-link-highlight'), 1500);
      }
      setPendingSection(null);
    }, 600);
    return () => clearTimeout(timer);
  }, [pendingSection, activeTab]);

  const handleShareTab = useCallback(() => {
    if (!currentRace) return;
    const url = buildDeepLink(currentRace.year, currentRace.round_number, activeTab);
    copyDeepLink(url).then(() => {
      toast('Link copied!', {
        duration: 2000,
        position: 'bottom-center',
        style: { background: '#0d1821', color: '#ffe600', border: '1px solid #1e2e40' },
      });
    });
  }, [currentRace, activeTab]);

  const ActiveComponent = TAB_COMPONENTS[activeTab] || ResultsTab;

  return (
    <RaceContext.Provider value={{ raceId, setRaceId: setSelectedRaceId }}>
      <div className="min-h-screen bg-racing-bg">
        <Header races={races || []} selectedRaceId={raceId} onRaceChange={setSelectedRaceId} isLoading={isLoading} />
        <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="h-[100px] md:hidden" />
        <main className="max-w-[1400px] mx-auto px-4 pt-3 pb-6">
          {raceId ? (
            <div>
              <div className="flex justify-end mb-1">
                <button
                  onClick={handleShareTab}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[13px] font-condensed text-racing-muted hover:text-racing-yellow transition-colors"
                  title="Copy link to this view"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
              <ActiveComponent />
            </div>
          ) : (
            <p className="text-racing-muted font-body text-center py-12">
              {isLoading ? 'Loading races…' : 'No races available yet.'}
            </p>
          )}
        </main>
        <Footer />
        {/* <RaceChatPanel /> */}
      </div>
    </RaceContext.Provider>
  );
};

export default Index;
