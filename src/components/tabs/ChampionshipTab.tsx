import { useRaceContext } from '@/contexts/RaceContext';
import { useChampionshipStandings } from '@/hooks/useRaceData';
import { formatDriverName } from '@/lib/formatName';
import EngineIcon from '@/components/racing/EngineIcon';

import CarBadge from '@/components/racing/CarBadge';

const MedalBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="inline-flex items-center justify-center bg-racing-gold text-black font-heading text-sm w-8 h-6 rounded-sm">P1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center bg-racing-silver text-black font-heading text-sm w-8 h-6 rounded-sm">P2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center bg-racing-bronze text-white font-heading text-sm w-8 h-6 rounded-sm">P3</span>;
  return <span className="font-heading text-sm text-racing-muted">{rank}</span>;
};

const ChampionshipTab = () => {
  const { raceId } = useRaceContext();
  const { data: standings, isLoading } = useChampionshipStandings(raceId);

  if (isLoading || !standings) return <p className="text-racing-muted font-body">Loading standings…</p>;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">2026 NTT INDYCAR SERIES</h2>
      <p className="font-condensed text-sm text-racing-muted">Championship Standings</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-racing-border">
              {['Rank','Car','Driver','Engine','Prior Pts','Race Pts','Total Pts','Gap'].map(h => (
                <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map(s => (
              <tr key={s.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                <td className="px-3 py-2"><MedalBadge rank={s.rank} /></td>
                <td className="px-3 py-2"><CarBadge num={s.car} /></td>
                <td className="px-3 py-2 font-body text-sm text-racing-text">{formatDriverName(s.driver_name)}</td>
                <td className="px-3 py-2"><EngineIcon engine={s.engine} /></td>
                <td className="px-3 py-2 font-mono text-xs text-racing-muted">{s.r1}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-text">{s.r2}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-yellow font-bold">{s.total}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-muted">{s.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-mono text-[10px] text-racing-muted italic mt-2">Championship standings reflect the selected race weekend only.</p>
    </div>
  );
};

export default ChampionshipTab;
