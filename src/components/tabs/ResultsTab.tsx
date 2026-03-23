import { useState } from 'react';
import { useRaceContext } from '@/contexts/RaceContext';
import { useRaceResults, useRaceDetails, useCautions, usePenalties } from '@/hooks/useRaceData';
import { formatDriverName } from '@/lib/formatName';
import EngineIcon from '@/components/racing/EngineIcon';
import { useIsMobile } from '@/hooks/use-mobile';

import CarBadge from '@/components/racing/CarBadge';

const PosBadge = ({ pos }: { pos: number }) => {
  const bg = pos === 1 ? 'bg-racing-gold text-black' : pos === 2 ? 'bg-racing-silver text-black' : pos === 3 ? 'bg-racing-bronze text-white' : 'bg-racing-surface text-racing-muted';
  return <span className={`inline-flex items-center justify-center font-heading text-sm w-8 h-6 rounded-sm ${bg}`}>P{pos}</span>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const color = status === 'Running' ? 'text-racing-green' : status === 'Contact' ? 'text-racing-red' : 'text-racing-amber';
  return <span className={`font-mono text-xs ${color}`}>{status}</span>;
};

const ResultCard = ({ r }: { r: any }) => {
  const posChange = r.start_position - r.finish_position;
  const changeColor = posChange > 0 ? 'text-racing-green' : posChange < 0 ? 'text-racing-red' : 'text-racing-muted';
  const changeText = posChange > 0 ? `▲${posChange}` : posChange < 0 ? `▼${Math.abs(posChange)}` : '—';

  return (
    <div className="bg-racing-surface rounded border-l-2 border-racing-border p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PosBadge pos={r.finish_position} />
          <CarBadge num={r.car_number} />
          <div>
            <p className="font-body text-sm text-racing-text leading-tight">{formatDriverName(r.driver_name)}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <EngineIcon engine={r.engine} size="sm" />
              <span className={`font-mono text-[10px] ${changeColor}`}>{changeText}</span>
              <span className="font-mono text-[10px] text-racing-muted">from P{r.start_position}</span>
            </div>
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <p className="font-condensed text-[9px] text-racing-muted uppercase">Laps</p>
          <p className="font-mono text-xs text-racing-text">{r.laps_completed}</p>
        </div>
        <div>
          <p className="font-condensed text-[9px] text-racing-muted uppercase">Gap</p>
          <p className="font-mono text-xs text-racing-text">{r.time_gap}</p>
        </div>
        <div>
          <p className="font-condensed text-[9px] text-racing-muted uppercase">Pits</p>
          <p className="font-mono text-xs text-racing-text">{r.pit_stops}</p>
        </div>
        <div>
          <p className="font-condensed text-[9px] text-racing-muted uppercase">Pts</p>
          <p className="font-mono text-xs text-racing-yellow">{r.race_points}</p>
        </div>
      </div>
    </div>
  );
};

const ResultsTab = () => {
  const { raceId } = useRaceContext();
  const { data: results, isLoading: loadingResults } = useRaceResults(raceId);
  const { data: race } = useRaceDetails(raceId);
  const { data: cautions } = useCautions(raceId);
  const { data: penalties } = usePenalties(raceId);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  if (loadingResults) return <p className="text-racing-muted font-body">Loading results…</p>;
  if (!results?.length) return <p className="text-racing-muted font-body">No results data.</p>;

  const filtered = results.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.driver_name.toLowerCase().includes(q) || formatDriverName(r.driver_name).toLowerCase().includes(q) || r.car_number.includes(q);
  });

  const winner = results[0];
  const statCards = race ? [
    { label: 'Winner', value: formatDriverName(winner?.driver_name), sub: `#${winner?.car_number} · ${winner?.engine}`, border: 'border-racing-blue' },
    { label: 'Race Time', value: race.race_time || race.total_race_time || '', sub: `${race.avg_speed} mph avg`, border: 'border-racing-yellow' },
    { label: 'Total Laps', value: String(race.total_laps || ''), sub: `${race.green_laps || '—'} green · ${race.caution_laps || '—'} caution`, border: 'border-racing-blue' },
    { label: 'Lead Changes', value: String(race.lead_changes || ''), sub: `${race.drivers_who_led || race.drivers_led || '—'} drivers led`, border: 'border-racing-yellow' },
    { label: 'Fastest Lap', value: `${race.fastest_lap_speed} mph`, sub: `#${race.fastest_lap_car} ${formatDriverName(race.fastest_lap_driver)} · Lap ${race.fastest_lap_number}`, border: 'border-racing-blue' },
    { label: 'Race Passes', value: String(race.total_passes || '—'), sub: `${race.position_passes || '—'} position passes`, border: 'border-racing-yellow' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(c => (
          <div key={c.label} className={`bg-racing-surface rounded border-t-2 ${c.border} p-4`}>
            <p className="font-condensed text-xs text-racing-muted uppercase">{c.label}</p>
            <p className="font-heading text-2xl text-racing-yellow leading-tight mt-1">{c.value}</p>
            <p className="font-mono text-[10px] text-racing-muted mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search driver or car number…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded placeholder:text-racing-muted"
      />

      {isMobile ? (
        <div className="space-y-2">
          {filtered.map(r => <ResultCard key={r.id} r={r} />)}
        </div>
      ) : (
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
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                  <td className="px-2 py-2"><PosBadge pos={r.finish_position} /></td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-muted">P{r.start_position}</td>
                  <td className="px-2 py-2"><CarBadge num={r.car_number} /></td>
                  <td className="px-2 py-2 font-body text-sm text-racing-text">{formatDriverName(r.driver_name)}</td>
                  <td className="px-2 py-2"><EngineIcon engine={r.engine} /></td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.laps_completed}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.time_gap}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.pit_stops}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.elapsed_time}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-yellow">{Number(r.avg_speed)?.toFixed(3)}</td>
                  <td className="px-2 py-2"><StatusBadge status={r.status} /></td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-yellow">{r.race_points}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-text">{r.total_points}</td>
                  <td className="px-2 py-2 font-mono text-xs text-racing-muted">Rank {r.championship_rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Caution Summary</h3>
          <div className="space-y-2">
            {cautions?.map(c => (
              <div key={c.id} className="bg-racing-surface border-l-2 border-racing-yellow rounded-r px-4 py-3">
                <p className="font-condensed text-xs text-racing-text">Caution {c.caution_number}: Laps {c.start_lap}–{c.end_lap} · {c.total_laps} laps</p>
                <p className="font-mono text-[10px] text-racing-muted">{c.reason}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Penalty Summary</h3>
          <div className="space-y-2">
            {penalties?.map(p => (
              <div key={p.id} className="bg-racing-surface border-l-2 border-racing-orange rounded-r px-4 py-3">
                <p className="font-condensed text-xs text-racing-text">#{p.car_number} {p.reason} · Lap {p.lap_number}</p>
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
