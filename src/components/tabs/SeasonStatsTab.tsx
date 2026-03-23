import { useState, useMemo } from 'react';
import { useRaceContext } from '@/contexts/RaceContext';
import { useRaceDetails } from '@/hooks/useRaceData';
import { useSeasonRaces, useSeasonResults, useSeasonLapsLed, useSeasonFastestPitTransit } from '@/hooks/useSeasonStats';
import { formatDriverName } from '@/lib/formatName';
import CarBadge from '@/components/racing/CarBadge';
import EngineIcon from '@/components/racing/EngineIcon';
import { useIsMobile } from '@/hooks/use-mobile';

type SortKey = string;
type SortDir = 'asc' | 'desc';

const SeasonStatsTab = () => {
  const { raceId } = useRaceContext();
  const { data: selectedRace } = useRaceDetails(raceId);
  const year = selectedRace?.year ?? null;
  const throughRound = selectedRace?.round_number ?? null;

  const { data: seasonRaces, isLoading: racesLoading } = useSeasonRaces(year, throughRound);
  const { data: seasonData, isLoading: resultsLoading } = useSeasonResults(year, throughRound);
  const { data: lapsLedData } = useSeasonLapsLed(year, throughRound);
  const { data: pitTransitData } = useSeasonFastestPitTransit(year, throughRound);
  const isMobile = useIsMobile();

  const [sortKey, setSortKey] = useState<SortKey>('totalPts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortHeader = ({ k, label, className = '' }: { k: string; label: string; className?: string }) => (
    <th
      onClick={() => handleSort(k)}
      className={`font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2 cursor-pointer select-none whitespace-nowrap hover:text-racing-text transition-colors ${sortKey === k ? 'text-racing-yellow' : ''} ${className}`}
    >
      {label}{sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
    </th>
  );

  const latestRace = useMemo(() => {
    if (!seasonRaces?.length) return null;
    return seasonRaces[seasonRaces.length - 1];
  }, [seasonRaces]);

  const rounds = useMemo(() => seasonRaces?.map(r => r.round_number).sort((a, b) => a - b) || [], [seasonRaces]);

  // Build driver standings
  const standings = useMemo(() => {
    if (!seasonData?.results?.length) return [];
    const { results, racesMap } = seasonData;

    const lapsLedByCar: Record<string, number> = {};
    (lapsLedData || []).forEach(l => {
      lapsLedByCar[l.car_number] = (lapsLedByCar[l.car_number] || 0) + l.laps_led;
    });

    const driverMap: Record<string, any> = {};
    results.forEach(r => {
      const key = r.car_number;
      if (!driverMap[key]) {
        driverMap[key] = {
          car: r.car_number,
          driver_name: r.driver_name,
          engine: r.engine,
          roundPoints: {} as Record<number, number>,
          totalPts: 0,
          wins: 0,
          podiums: 0,
          top5: 0,
          finishSum: 0,
          startSum: 0,
          netPos: 0,
          raceCount: 0,
          lapsLed: lapsLedByCar[r.car_number] || 0,
          dnfs: 0,
        };
      }
      const d = driverMap[key];
      const round = racesMap[r.race_id];
      if (round) d.roundPoints[round] = r.race_points;
      d.totalPts += r.race_points;
      if (r.finish_position === 1) d.wins++;
      if (r.finish_position <= 3) d.podiums++;
      if (r.finish_position <= 5) d.top5++;
      d.finishSum += r.finish_position;
      d.startSum += r.start_position;
      d.netPos += (r.start_position - r.finish_position);
      d.raceCount++;
      if (r.status !== 'Running') d.dnfs++;
    });

    const arr = Object.values(driverMap).map((d: any) => ({
      ...d,
      avgFinish: +(d.finishSum / d.raceCount).toFixed(1),
      avgStart: +(d.startSum / d.raceCount).toFixed(1),
    }));

    arr.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      if (sortKey.startsWith('r_')) {
        const rn = parseInt(sortKey.slice(2));
        aVal = a.roundPoints[rn] ?? -1;
        bVal = b.roundPoints[rn] ?? -1;
      } else {
        aVal = a[sortKey] ?? 0;
        bVal = b[sortKey] ?? 0;
      }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return arr;
  }, [seasonData, lapsLedData, sortKey, sortDir]);

  // Season leaderboards
  const lapsLedLeaderboard = useMemo(() => {
    if (!lapsLedData?.length) return [];
    const map: Record<string, { car: string; driver: string; total: number; races: number }> = {};
    lapsLedData.forEach(l => {
      const key = l.car_number;
      if (!map[key]) map[key] = { car: l.car_number, driver: l.driver_name || '', total: 0, races: 0 };
      map[key].total += l.laps_led;
      if (l.laps_led > 0) map[key].races++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [lapsLedData]);

  const pitLeaderboard = useMemo(() => {
    if (!pitTransitData?.length) return [];
    const map: Record<string, { car: string; driver: string; bestTime: number; race: string }> = {};
    pitTransitData.forEach((l: any) => {
      const time = l.section_time ? parseFloat(l.section_time) : (l.time ? parseFloat(l.time) : null);
      if (time === null || isNaN(time)) return;
      const key = l.car_number;
      if (!map[key] || time < map[key].bestTime) {
        map[key] = { car: l.car_number, driver: l.driver_name || '', bestTime: time, race: l._race?.event_name || '' };
      }
    });
    return Object.values(map).sort((a, b) => a.bestTime - b.bestTime).slice(0, 10);
  }, [pitTransitData]);

  const fastestLapLeaderboard = useMemo(() => {
    if (!seasonRaces?.length) return [];
    const map: Record<string, { car: string; driver: string; count: number; bestSpeed: number; races: string[] }> = {};
    seasonRaces.forEach(race => {
      if (race.fastest_lap_car && race.fastest_lap_driver) {
        const key = race.fastest_lap_car;
        if (!map[key]) map[key] = { car: race.fastest_lap_car, driver: race.fastest_lap_driver, count: 0, bestSpeed: 0, races: [] };
        map[key].count++;
        if (race.fastest_lap_speed && race.fastest_lap_speed > map[key].bestSpeed) map[key].bestSpeed = race.fastest_lap_speed;
        map[key].races.push(race.event_name);
      }
    });
    return Object.values(map).sort((a, b) => b.count - a.count || b.bestSpeed - a.bestSpeed).slice(0, 10);
  }, [seasonRaces]);

  const reliabilityLeaderboard = useMemo(() => {
    if (!seasonData?.results?.length) return [];
    const map: Record<string, { car: string; driver: string; lapsCompleted: number; racesEntered: number; dnfs: number }> = {};
    seasonData.results.forEach(r => {
      const key = r.car_number;
      if (!map[key]) map[key] = { car: r.car_number, driver: r.driver_name, lapsCompleted: 0, racesEntered: 0, dnfs: 0 };
      map[key].lapsCompleted += r.laps_completed;
      map[key].racesEntered++;
      if (r.status !== 'Running') map[key].dnfs++;
    });
    return Object.values(map).sort((a, b) => b.lapsCompleted - a.lapsCompleted).slice(0, 10);
  }, [seasonData]);

  if (!year || racesLoading || resultsLoading) return <p className="text-racing-muted font-body text-center py-12">Loading season stats…</p>;
  if (!seasonRaces || seasonRaces.length < 1) return <p className="text-racing-muted font-body text-center py-12">Season stats will appear once at least 1 race has been completed.</p>;

  return (
    <div className="space-y-10">
      {/* Context header */}
      <div>
        <h2 className="font-heading text-2xl md:text-3xl text-racing-text">
          {year} Season Stats
        </h2>
        <p className="font-condensed text-sm text-racing-muted mt-1">
          Through Round {latestRace?.round_number} — {latestRace?.track_name}
        </p>
      </div>

      {/* SECTION 1 — Driver Season Standings */}
      <section>
        <h3 className="font-heading text-xl text-racing-text mb-4">Driver Season Standings</h3>
        {isMobile ? (
          <MobileStandings standings={standings} rounds={rounds} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: `${700 + rounds.length * 48}px` }}>
              <thead>
                <tr className="border-b border-racing-border">
                  <SortHeader k="totalPts" label="#" className="w-8" />
                  <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">Car</th>
                  <SortHeader k="driver_name" label="Driver" />
                  <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">Eng</th>
                  {rounds.map(rn => (
                    <SortHeader key={rn} k={`r_${rn}`} label={`R${rn}`} />
                  ))}
                  <SortHeader k="totalPts" label="Total" />
                  <SortHeader k="wins" label="Wins" />
                  <SortHeader k="podiums" label="Pod" />
                  <SortHeader k="top5" label="T5" />
                  <SortHeader k="lapsLed" label="Led" />
                  <SortHeader k="avgFinish" label="Avg F" />
                  <SortHeader k="avgStart" label="Avg S" />
                  <SortHeader k="netPos" label="Net" />
                </tr>
              </thead>
              <tbody>
                {standings.map((s: any, i: number) => (
                  <tr key={s.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                    <td className="px-2 py-2 font-heading text-sm text-racing-muted">{i + 1}</td>
                    <td className="px-2 py-2"><CarBadge num={s.car} /></td>
                    <td className="px-2 py-2 font-body text-sm text-racing-text whitespace-nowrap">{formatDriverName(s.driver_name)}</td>
                    <td className="px-2 py-2"><EngineIcon engine={s.engine} /></td>
                    {rounds.map(rn => (
                      <td key={rn} className={`px-2 py-2 font-mono text-xs text-center ${sortKey === `r_${rn}` ? 'bg-racing-surface2/30' : ''} ${s.roundPoints[rn] !== undefined ? 'text-racing-text' : 'text-racing-muted'}`}>
                        {s.roundPoints[rn] !== undefined ? s.roundPoints[rn] : '—'}
                      </td>
                    ))}
                    <td className={`px-2 py-2 font-mono text-xs font-bold text-racing-yellow ${sortKey === 'totalPts' ? 'bg-racing-surface2/30' : ''}`}>{s.totalPts}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'wins' ? 'bg-racing-surface2/30' : ''} ${s.wins > 0 ? 'text-racing-yellow' : 'text-racing-muted'}`}>{s.wins}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'podiums' ? 'bg-racing-surface2/30' : ''} ${s.podiums > 0 ? 'text-racing-text' : 'text-racing-muted'}`}>{s.podiums}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'top5' ? 'bg-racing-surface2/30' : ''} ${s.top5 > 0 ? 'text-racing-text' : 'text-racing-muted'}`}>{s.top5}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'lapsLed' ? 'bg-racing-surface2/30' : ''} ${s.lapsLed > 0 ? 'text-racing-text' : 'text-racing-muted'}`}>{s.lapsLed}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'avgFinish' ? 'bg-racing-surface2/30' : ''} text-racing-text`}>{s.avgFinish}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'avgStart' ? 'bg-racing-surface2/30' : ''} text-racing-text`}>{s.avgStart}</td>
                    <td className={`px-2 py-2 font-mono text-xs text-center ${sortKey === 'netPos' ? 'bg-racing-surface2/30' : ''} ${s.netPos > 0 ? 'text-racing-green' : s.netPos < 0 ? 'text-racing-red' : 'text-racing-muted'}`}>
                      {s.netPos > 0 ? `+${s.netPos}` : s.netPos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SECTION 2 — Race by Race Summary Cards */}
      <section>
        <h3 className="font-heading text-xl text-racing-text mb-4">Race by Race</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {seasonRaces.map(race => {
            const winner = seasonData?.results?.find(r => r.race_id === race.id && r.finish_position === 1);
            const runnerUp = seasonData?.results?.find(r => r.race_id === race.id && r.finish_position === 2);
            const margin = runnerUp?.time_gap || '—';
            return (
              <div key={race.id} className="bg-racing-surface rounded border border-racing-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-condensed text-xs text-racing-muted uppercase">Round {race.round_number}</span>
                    <h4 className="font-heading text-lg text-racing-text">{race.event_name}</h4>
                    <p className="font-condensed text-xs text-racing-muted">{race.track_name} · {race.race_date}</p>
                  </div>
                </div>
                {winner && (
                  <div className="flex items-center gap-2">
                    <span className="font-condensed text-xs text-racing-muted uppercase w-16">Winner</span>
                    <CarBadge num={winner.car_number} />
                    <span className="font-body text-sm text-racing-yellow">{formatDriverName(winner.driver_name)}</span>
                    <span className="font-mono text-xs text-racing-muted ml-auto">by {margin}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <Stat label="Laps" value={race.total_laps ?? '—'} />
                  <Stat label="Avg Speed" value={race.avg_speed ? `${race.avg_speed} mph` : '—'} />
                  {race.fastest_lap_driver && (
                    <div className="col-span-2 flex items-center gap-1.5 mt-1">
                      <span className="font-condensed text-racing-muted uppercase w-16 shrink-0">Fast Lap</span>
                      <CarBadge num={race.fastest_lap_car || ''} size="sm" />
                      <span className="font-body text-racing-text">{formatDriverName(race.fastest_lap_driver)}</span>
                      <span className="font-mono text-racing-yellow ml-auto">{race.fastest_lap_speed} mph · L{race.fastest_lap_number}</span>
                    </div>
                  )}
                  {race.most_improved_driver && (
                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className="font-condensed text-racing-muted uppercase w-16 shrink-0">Improved</span>
                      <CarBadge num={race.most_improved_car || ''} size="sm" />
                      <span className="font-body text-racing-text">{formatDriverName(race.most_improved_driver)}</span>
                      <span className="font-mono text-racing-green ml-auto">+{race.most_improved_positions ?? 0}</span>
                    </div>
                  )}
                  <Stat label="Lead Changes" value={race.lead_changes ?? '—'} />
                  <Stat label="Drivers Led" value={race.drivers_who_led ?? race.drivers_led ?? '—'} />
                  <Stat label="Total Passes" value={race.total_passes ?? '—'} />
                  <Stat label="Position Passes" value={race.position_passes ?? '—'} />
                  <Stat label="Caution Laps" value={`${race.caution_laps ?? 0} / ${race.total_laps ?? '—'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3 — Season Leaderboards */}
      <section>
        <h3 className="font-heading text-xl text-racing-text mb-4">Season Leaders</h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 xl:grid-cols-4'}`}>
          <Leaderboard title="Most Laps Led" items={lapsLedLeaderboard.map((l, i) => ({
            rank: i + 1, car: l.car, driver: l.driver, stat: `${l.total}`, sub: `${l.races} race${l.races !== 1 ? 's' : ''}`,
          }))} />
          <Leaderboard
            title="Pit Execution — Best PI to PO"
            subtitle="Fastest pit lane transit (entry → exit) incl. service"
            items={pitLeaderboard.map((l, i) => ({
              rank: i + 1, car: l.car, driver: l.driver, stat: `${l.bestTime.toFixed(4)}s`, sub: l.race,
            }))}
          />
          <Leaderboard title="Fastest Race Laps" items={fastestLapLeaderboard.map((l, i) => ({
            rank: i + 1, car: l.car, driver: l.driver, stat: `${l.count}×`, sub: `${l.bestSpeed} mph`,
          }))} />
          <Leaderboard title="Laps Completed" items={reliabilityLeaderboard.map((l, i) => ({
            rank: i + 1, car: l.car, driver: l.driver, stat: `${l.lapsCompleted}`, sub: `${l.racesEntered} races · ${l.dnfs} DNF`,
          }))} />
        </div>
      </section>
    </div>
  );
};

/* ── Mobile Standings Cards ── */
const SORT_OPTIONS = [
  { key: 'totalPts', label: 'Points' },
  { key: 'wins', label: 'Wins' },
  { key: 'podiums', label: 'Podiums' },
  { key: 'avgFinish', label: 'Avg Finish' },
  { key: 'lapsLed', label: 'Laps Led' },
  { key: 'netPos', label: 'Net Positions' },
];

const MobileStandings = ({ standings, rounds, sortKey, sortDir, onSort }: {
  standings: any[];
  rounds: number[];
  sortKey: string;
  sortDir: SortDir;
  onSort: (k: string) => void;
}) => (
  <div className="space-y-3">
    {/* Sort selector */}
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-condensed text-[10px] text-racing-muted uppercase">Sort by</span>
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => onSort(opt.key)}
          className={`font-condensed text-xs px-2 py-1 rounded border transition-colors ${
            sortKey === opt.key
              ? 'text-racing-yellow border-racing-yellow bg-racing-surface2'
              : 'text-racing-muted border-racing-border'
          }`}
        >
          {opt.label}{sortKey === opt.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
        </button>
      ))}
    </div>

    {/* Cards */}
    {standings.map((s: any, i: number) => (
      <div key={s.car} className="bg-racing-surface rounded border border-racing-border p-3 space-y-2">
        {/* Top row: rank, car badge, driver, engine */}
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg text-racing-muted w-6 text-right">{i + 1}</span>
          <CarBadge num={s.car} />
          <span className="font-body text-sm text-racing-text flex-1 truncate">{formatDriverName(s.driver_name)}</span>
          <EngineIcon engine={s.engine} />
          <span className="font-mono text-base font-bold text-racing-yellow">{s.totalPts}</span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-1">
          <MiniStat label="Wins" value={s.wins} highlight={s.wins > 0} />
          <MiniStat label="Podiums" value={s.podiums} />
          <MiniStat label="Top 5" value={s.top5} />
          <MiniStat label="Led" value={s.lapsLed} />
          <MiniStat label="Avg F" value={s.avgFinish} />
          <MiniStat label="Avg S" value={s.avgStart} />
          <MiniStat label="Net" value={s.netPos > 0 ? `+${s.netPos}` : s.netPos} positive={s.netPos > 0} negative={s.netPos < 0} />
          <MiniStat label="DNFs" value={s.dnfs} highlight={s.dnfs > 0} />
        </div>

        {/* Round-by-round points */}
        <div className="flex gap-1 flex-wrap">
          {rounds.map(rn => (
            <span key={rn} className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
              s.roundPoints[rn] !== undefined
                ? 'bg-racing-surface2 text-racing-text'
                : 'text-racing-muted'
            }`}>
              R{rn}: {s.roundPoints[rn] !== undefined ? s.roundPoints[rn] : '—'}
            </span>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const MiniStat = ({ label, value, highlight, positive, negative }: {
  label: string; value: string | number; highlight?: boolean; positive?: boolean; negative?: boolean;
}) => (
  <div className="text-center">
    <p className="font-condensed text-[9px] text-racing-muted uppercase">{label}</p>
    <p className={`font-mono text-xs ${
      positive ? 'text-racing-green' : negative ? 'text-racing-red' : highlight ? 'text-racing-yellow' : 'text-racing-text'
    }`}>{value}</p>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between">
    <span className="font-condensed text-racing-muted uppercase">{label}</span>
    <span className="font-mono text-racing-yellow">{value}</span>
  </div>
);

interface LeaderboardItem { rank: number; car: string; driver: string; stat: string; sub?: string; }

const Leaderboard = ({ title, subtitle, items }: { title: string; subtitle?: string; items: LeaderboardItem[] }) => (
  <div className="bg-racing-surface rounded border border-racing-border p-4">
    <h4 className="font-heading text-base text-racing-text mb-1">{title}</h4>
    {subtitle && <p className="font-condensed text-[10px] text-racing-muted mb-3">{subtitle}</p>}
    {!items.length ? (
      <p className="text-racing-muted font-body text-xs py-2">No data yet</p>
    ) : (
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.car} className="flex items-center gap-2">
            <span className="font-heading text-sm text-racing-muted w-5 text-right">{item.rank}</span>
            <CarBadge num={item.car} size="sm" />
            <span className="font-body text-xs text-racing-text truncate flex-1">{formatDriverName(item.driver)}</span>
            <div className="text-right shrink-0">
              <span className="font-mono text-xs text-racing-yellow">{item.stat}</span>
              {item.sub && <p className="font-condensed text-[9px] text-racing-muted">{item.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default SeasonStatsTab;
