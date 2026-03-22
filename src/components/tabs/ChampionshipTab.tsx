import { championshipStandings, driverMap } from '@/data/raceData';

const CarBadge = ({ num }: { num: number }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const MedalBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <span className="inline-flex items-center justify-center bg-racing-gold text-black font-heading text-sm w-8 h-6 rounded-sm">P1</span>;
  if (rank === 2) return <span className="inline-flex items-center justify-center bg-racing-silver text-black font-heading text-sm w-8 h-6 rounded-sm">P2</span>;
  if (rank === 3) return <span className="inline-flex items-center justify-center bg-racing-bronze text-white font-heading text-sm w-8 h-6 rounded-sm">P3</span>;
  return <span className="font-heading text-sm text-racing-muted">{rank}</span>;
};

const EngineText = ({ engine }: { engine: string }) => (
  <span className={`font-mono text-xs ${engine === 'Honda' ? 'text-racing-honda' : 'text-racing-chevy'}`}>{engine}</span>
);

const ChampionshipTab = () => {
  const maxPts = Math.max(...championshipStandings.map(s => s.total));

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">2026 NTT INDYCAR SERIES</h2>
      <p className="font-condensed text-sm text-racing-muted">Championship Standings After Round 2 of 18</p>
      <p className="font-mono text-[10px] text-racing-muted">Round 1 points = Total minus Round 2 points</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-racing-border">
              {['Rank','Car','Driver','Engine','R1 Pts','R2 Pts','Total Pts','Gap',''].map(h => (
                <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {championshipStandings.map(s => {
              const d = driverMap[s.car];
              if (!d) return null;
              return (
                <tr key={s.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                  <td className="px-3 py-2"><MedalBadge rank={s.rank} /></td>
                  <td className="px-3 py-2"><CarBadge num={s.car} /></td>
                  <td className="px-3 py-2 font-body text-sm text-racing-text">{d.last} {d.first}</td>
                  <td className="px-3 py-2"><EngineText engine={d.engine} /></td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-muted">{s.r1}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-text">{s.r2}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-yellow font-bold">{s.total}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-muted">{s.gap}</td>
                  <td className="px-3 py-2 w-32">
                    <div className="h-2 bg-racing-surface rounded overflow-hidden">
                      <div className="h-full bg-racing-yellow rounded" style={{ width: `${(s.total / maxPts) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChampionshipTab;
