import { useState } from 'react';
import { raceResults, driverMap, cautions, penalties } from '@/data/raceData';

const CarBadge = ({ num }: { num: number }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const PosBadge = ({ pos }: { pos: number }) => {
  const bg = pos === 1 ? 'bg-racing-gold text-black' : pos === 2 ? 'bg-racing-silver text-black' : pos === 3 ? 'bg-racing-bronze text-white' : 'bg-racing-surface text-racing-muted';
  return <span className={`inline-flex items-center justify-center font-heading text-sm w-8 h-6 rounded-sm ${bg}`}>P{pos}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const color = status === 'Running' ? 'text-racing-green' : status === 'Contact' ? 'text-racing-red' : 'text-racing-amber';
  return <span className={`font-mono text-xs ${color}`}>{status}</span>;
};

const EngineText = ({ engine }: { engine: string }) => (
  <span className={`font-mono text-xs ${engine === 'Honda' ? 'text-racing-honda' : 'text-racing-chevy'}`}>{engine}</span>
);

const SpeedBar = ({ speed, max }: { speed: number; max: number }) => (
  <div className="flex items-center gap-2 min-w-[140px]">
    <div className="flex-1 h-1.5 bg-racing-surface rounded overflow-hidden">
      <div className="h-full bg-racing-yellow rounded" style={{ width: `${max > 0 ? (speed / max) * 100 : 0}%` }} />
    </div>
    <span className="font-mono text-xs text-racing-yellow whitespace-nowrap">{speed.toFixed(3)}</span>
  </div>
);

const ResultsTab = () => {
  const [search, setSearch] = useState('');
  const maxSpeed = Math.max(...raceResults.map(r => r.avgSpeed));

  const filtered = raceResults.filter(r => {
    if (!search) return true;
    const d = driverMap[r.car];
    const q = search.toLowerCase();
    return d.first.toLowerCase().includes(q) || d.last.toLowerCase().includes(q) || String(r.car).includes(q);
  });

  const statCards = [
    { label: 'Winner', value: 'Newgarden', sub: '#2 · Chevy', border: 'border-racing-blue' },
    { label: 'Race Time', value: '1:51:14', sub: '134.842 mph avg', border: 'border-racing-yellow' },
    { label: 'Total Laps', value: '250', sub: '209 green · 41 caution', border: 'border-racing-blue' },
    { label: 'Lead Changes', value: '18', sub: '11 drivers led', border: 'border-racing-yellow' },
    { label: 'Fastest Lap', value: '164.620 mph', sub: '#26 Power · Lap 192', border: 'border-racing-blue' },
    { label: 'Race Passes', value: '565', sub: '323 position passes', border: 'border-racing-yellow' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(c => (
          <div key={c.label} className={`bg-racing-surface rounded border-t-2 ${c.border} p-4`}>
            <p className="font-condensed text-xs text-racing-muted uppercase">{c.label}</p>
            <p className="font-heading text-2xl text-racing-yellow leading-tight mt-1">{c.value}</p>
            <p className="font-mono text-[10px] text-racing-muted mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search driver or car number…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded placeholder:text-racing-muted"
      />

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead>
            <tr className="border-b border-racing-border">
              {['Pos','SP','Car','Driver','Engine','Laps','Gap','Pits','Elapsed','Avg Speed','Status','Race Pts','Total Pts','Champ Rank'].map(h => (
                <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const d = driverMap[r.car];
              return (
                <tr key={r.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                  <td className="px-2 py-2"><PosBadge pos={r.pos} /></td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-muted">P{r.sp}</td>
                  <td className="px-2 py-2"><CarBadge num={r.car} /></td>
                  <td className="px-2 py-2 font-body text-sm text-racing-text">{d.last} {d.first}{d.rookie ? <span className="text-racing-muted text-[10px] ml-1">(R)</span> : ''}</td>
                  <td className="px-2 py-2"><EngineText engine={d.engine} /></td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.laps}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.gap}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.pits}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.elapsed}</td>
                  <td className="px-2 py-2"><SpeedBar speed={r.avgSpeed} max={maxSpeed} /></td>
                  <td className="px-2 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-yellow">{r.racePts}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.totalPts}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-muted">Rank {r.champRank}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Caution & Penalty Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Caution Summary</h3>
          <div className="space-y-2">
            {cautions.map(c => (
              <div key={c.num} className="bg-racing-surface border-l-2 border-racing-yellow rounded-r px-4 py-3">
                <p className="font-condensed text-xs text-racing-text">Caution {c.num}: Laps {c.startLap}–{c.endLap} · {c.laps} laps</p>
                <p className="font-mono text-[10px] text-racing-muted">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Penalty Summary</h3>
          <div className="space-y-2">
            {penalties.map((p, i) => (
              <div key={i} className="bg-racing-surface border-l-2 border-racing-orange rounded-r px-4 py-3">
                <p className="font-condensed text-xs text-racing-text">#{p.car} {p.infraction} · Lap {p.lap}</p>
                <p className="font-mono text-[10px] text-racing-muted">{p.penalty}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTab;
