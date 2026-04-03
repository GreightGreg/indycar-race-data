import { useMemo, useRef } from 'react';
import { useRaceContext } from '@/contexts/RaceContext';
import { useRaces } from '@/hooks/useRaceData';
import { useTeamGridData } from '@/hooks/useTeamGridData';
import { useIsMobile } from '@/hooks/use-mobile';
import CarBadge from '@/components/racing/CarBadge';
import { formatDriverName } from '@/lib/formatName';

type TrackType = 'oval' | 'street' | 'road';

interface DriverStats {
  car_number: string;
  driver_name: string;
  team: string;
  engine: string;
  avgFinish: number | null;
  avgQual: number | null;
  perRaceFinish: Record<string, number | null>;
  perRaceQual: Record<string, number | null>;
  byTrackType: Record<TrackType, { avgFinish: number | null; avgQual: number | null }>;
}

interface TeamGroup {
  team: string;
  engine: string;
  drivers: DriverStats[];
  teamAvgFinish: number | null;
  teamAvgQual: number | null;
  byTrackType: Record<TrackType, { avgFinish: number | null; avgQual: number | null }>;
}

const avg = (nums: number[]) => nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
const fmt = (v: number | null) => v !== null ? v.toFixed(1) : '-';

const TeamGridTab = () => {
  const { raceId } = useRaceContext();
  const { data: races } = useRaces();
  const currentRace = races?.find(r => r.id === raceId);
  const year = currentRace?.year ?? null;
  const throughRound = currentRace?.round_number ?? null;

  const { data, isLoading } = useTeamGridData(year, throughRound);
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { teams, completedRaces } = useMemo(() => {
    if (!data) return { teams: [], completedRaces: [] };

    const { races: completedRaces, drivers, results, qualResults, sessionResults } = data;
    const raceMap = Object.fromEntries(completedRaces.map(r => [r.id, r]));

    // Build qualifying position map: race_id -> car_number -> best qual position
    const qualMap = new Map<string, Map<string, number>>();
    for (const r of completedRaces) {
      qualMap.set(r.id, new Map());
    }

    // Oval qualifying from qualifying_results
    for (const q of qualResults) {
      const map = qualMap.get(q.race_id);
      if (map) {
        const existing = map.get(q.car_number);
        if (!existing || q.qual_position < existing) {
          map.set(q.car_number, q.qual_position);
        }
      }
    }

    // Road/street qualifying from session_full_results (best rank across all qualifying rounds)
    for (const s of sessionResults) {
      const race = raceMap[s.race_id];
      if (!race) continue;
      const trackType = (race as any).track_type;
      if (trackType === 'oval') continue; // oval uses qualifying_results
      const map = qualMap.get(s.race_id);
      if (map) {
        const existing = map.get(s.car_number);
        if (!existing || s.rank < existing) {
          map.set(s.car_number, s.rank);
        }
      }
    }

    // Build driver stats
    const driverStatsMap = new Map<string, DriverStats>();
    for (const d of drivers) {
      const finishes: number[] = [];
      const quals: number[] = [];
      const perRaceFinish: Record<string, number | null> = {};
      const perRaceQual: Record<string, number | null> = {};
      const byType: Record<TrackType, { finishes: number[]; quals: number[] }> = {
        oval: { finishes: [], quals: [] },
        street: { finishes: [], quals: [] },
        road: { finishes: [], quals: [] },
      };

      for (const race of completedRaces) {
        const raceResult = results.find((r: any) => r.race_id === race.id && r.car_number === d.car_number);
        const qualPos = qualMap.get(race.id)?.get(d.car_number) ?? null;
        const finishPos = raceResult?.finish_position ?? null;

        perRaceFinish[race.id] = finishPos;
        perRaceQual[race.id] = qualPos;

        if (finishPos !== null) finishes.push(finishPos);
        if (qualPos !== null) quals.push(qualPos);

        const tt = ((race as any).track_type as TrackType) || null;
        if (tt && byType[tt]) {
          if (finishPos !== null) byType[tt].finishes.push(finishPos);
          if (qualPos !== null) byType[tt].quals.push(qualPos);
        }
      }

      driverStatsMap.set(d.car_number, {
        car_number: d.car_number,
        driver_name: d.driver_name,
        team: d.team,
        engine: d.engine,
        avgFinish: avg(finishes),
        avgQual: avg(quals),
        perRaceFinish,
        perRaceQual,
        byTrackType: {
          oval: { avgFinish: avg(byType.oval.finishes), avgQual: avg(byType.oval.quals) },
          street: { avgFinish: avg(byType.street.finishes), avgQual: avg(byType.street.quals) },
          road: { avgFinish: avg(byType.road.finishes), avgQual: avg(byType.road.quals) },
        },
      });
    }

    // Group by team
    const teamMap = new Map<string, TeamGroup>();
    for (const [, ds] of driverStatsMap) {
      if (!teamMap.has(ds.team)) {
        teamMap.set(ds.team, {
          team: ds.team,
          engine: ds.engine,
          drivers: [],
          teamAvgFinish: null,
          teamAvgQual: null,
          byTrackType: {
            oval: { avgFinish: null, avgQual: null },
            street: { avgFinish: null, avgQual: null },
            road: { avgFinish: null, avgQual: null },
          },
        });
      }
      teamMap.get(ds.team)!.drivers.push(ds);
    }

    // Calculate team averages
    for (const [, tg] of teamMap) {
      const teamFinishes = tg.drivers.map(d => d.avgFinish).filter((v): v is number => v !== null);
      const teamQuals = tg.drivers.map(d => d.avgQual).filter((v): v is number => v !== null);
      tg.teamAvgFinish = avg(teamFinishes);
      tg.teamAvgQual = avg(teamQuals);

      for (const tt of ['oval', 'street', 'road'] as TrackType[]) {
        const tf = tg.drivers.map(d => d.byTrackType[tt].avgFinish).filter((v): v is number => v !== null);
        const tq = tg.drivers.map(d => d.byTrackType[tt].avgQual).filter((v): v is number => v !== null);
        tg.byTrackType[tt] = { avgFinish: avg(tf), avgQual: avg(tq) };
      }
    }

    const sorted = Array.from(teamMap.values()).sort((a, b) => {
      if (a.teamAvgFinish === null && b.teamAvgFinish === null) return 0;
      if (a.teamAvgFinish === null) return 1;
      if (b.teamAvgFinish === null) return -1;
      return a.teamAvgFinish - b.teamAvgFinish;
    });

    // Sort drivers within each team by avg finish
    for (const tg of sorted) {
      tg.drivers.sort((a, b) => (a.avgFinish ?? 99) - (b.avgFinish ?? 99));
    }

    return { teams: sorted, completedRaces };
  }, [data]);

  // Determine which track types have data
  const trackTypes = useMemo(() => {
    if (!completedRaces.length) return [];
    const types = new Set<TrackType>();
    for (const r of completedRaces) {
      const tt = (r as any).track_type as TrackType;
      if (tt) types.add(tt);
    }
    return Array.from(types).sort((a, b) => {
      const order: Record<string, number> = { oval: 0, street: 1, road: 2 };
      return (order[a] ?? 3) - (order[b] ?? 3);
    });
  }, [completedRaces]);

  if (isLoading) {
    return <p className="text-racing-muted font-body text-center py-12">Loading team grid…</p>;
  }

  if (!teams.length) {
    return <p className="text-racing-muted font-body text-center py-12">No data available yet.</p>;
  }

  const TRACK_TYPE_LABELS: Record<string, string> = { oval: 'Oval', street: 'Street', road: 'Road' };

  // Mobile: card-based layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-racing-yellow text-lg">Team Grid</h2>
        <p className="font-mono text-[13px] text-racing-muted">
          Season averages through Round {throughRound} · Sorted by team avg finish
        </p>
        {teams.map(tg => (
          <div key={tg.team} className="bg-racing-surface border border-racing-border rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-racing-border bg-racing-surface2 flex items-center justify-between">
              <div>
                <span className="font-heading text-[15px] text-racing-text">{tg.team}</span>
                <span className="font-mono text-[12px] text-racing-muted ml-2">{tg.engine}</span>
              </div>
              <span className="font-mono text-racing-yellow text-[15px] font-bold">{fmt(tg.teamAvgFinish)}</span>
            </div>
            {tg.drivers.map(d => (
              <div key={d.car_number} className="px-3 py-2 border-b border-racing-border/30 last:border-b-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <CarBadge num={d.car_number} size="sm" />
                  <span className="font-condensed text-[14px] text-racing-text">{formatDriverName(d.driver_name)}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[12px]">
                  <div className="text-racing-muted">Avg Finish</div>
                  <div className="text-racing-text">{fmt(d.avgFinish)}</div>
                  <div className="text-racing-muted">Avg Qual</div>
                  <div className="text-racing-text">{fmt(d.avgQual)}</div>
                  {trackTypes.map(tt => (
                    <div key={tt} className="contents">
                      <div className="text-racing-muted">{TRACK_TYPE_LABELS[tt]} F</div>
                      <div className="text-racing-text">{fmt(d.byTrackType[tt].avgFinish)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Desktop: wide scrollable grid
  return (
    <div className="space-y-2">
      <h2 className="font-heading text-racing-yellow text-lg">Team Grid</h2>
      <p className="font-mono text-[13px] text-racing-muted mb-2">
        Season averages through Round {throughRound} · Sorted by team avg finish
      </p>

      <div className="overflow-x-auto border border-racing-border rounded-lg" ref={scrollRef}>
        <table className="w-full text-[13px] font-mono">
          <thead>
            <tr className="border-b border-racing-border bg-racing-surface2">
              <th className="sticky left-0 z-10 bg-racing-surface2 text-left px-3 py-2 font-condensed font-semibold text-racing-muted text-[12px] min-w-[140px]">
                Avg Finish
              </th>
              {teams.map(tg => (
                <th
                  key={tg.team}
                  colSpan={tg.drivers.length}
                  className="text-center px-2 py-2 font-condensed font-semibold text-racing-text text-[13px] border-l border-racing-border"
                >
                  <div>{tg.team}</div>
                  <div className="text-[11px] text-racing-muted font-normal">{tg.engine}</div>
                </th>
              ))}
            </tr>
            {/* Team avg finish row */}
            <tr className="border-b border-racing-border bg-racing-surface">
              <td className="sticky left-0 z-10 bg-racing-surface px-3 py-1.5 text-racing-muted text-[12px]">Team</td>
              {teams.map(tg => (
                <td
                  key={tg.team}
                  colSpan={tg.drivers.length}
                  className="text-center px-2 py-1.5 text-racing-yellow font-bold border-l border-racing-border"
                >
                  {fmt(tg.teamAvgFinish)}
                </td>
              ))}
            </tr>
            {/* Driver avg finish row */}
            <tr className="border-b border-racing-border bg-racing-surface">
              <td className="sticky left-0 z-10 bg-racing-surface px-3 py-1.5 text-racing-muted text-[12px]">Driver</td>
              {teams.flatMap(tg =>
                tg.drivers.map((d, i) => (
                  <td key={d.car_number} className={`text-center px-2 py-1.5 text-racing-text ${i === 0 ? 'border-l border-racing-border' : ''}`}>
                    {fmt(d.avgFinish)}
                  </td>
                ))
              )}
            </tr>
            {/* Driver names + car numbers */}
            <tr className="border-b border-racing-border bg-racing-surface2">
              <td className="sticky left-0 z-10 bg-racing-surface2 px-3 py-1.5 text-racing-muted text-[12px]">Driver</td>
              {teams.flatMap(tg =>
                tg.drivers.map((d, i) => (
                  <td key={d.car_number} className={`text-center px-1 py-1.5 ${i === 0 ? 'border-l border-racing-border' : ''}`}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-racing-text text-[11px] leading-tight whitespace-nowrap">
                        {formatDriverName(d.driver_name).split(' ').pop()?.toUpperCase()}
                      </span>
                      <CarBadge num={d.car_number} size="sm" />
                    </div>
                  </td>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {/* Season Avg section */}
            <tr className="border-b border-racing-border/50 bg-racing-bg">
              <td colSpan={999} className="px-3 py-1.5">
                <span className="font-condensed font-semibold text-racing-yellow text-[12px] uppercase tracking-wider">Season Avg.</span>
              </td>
            </tr>
            {/* Driver Q row */}
            <tr className="border-b border-racing-border/30">
              <td className="sticky left-0 z-10 bg-racing-bg px-3 py-1 text-racing-muted text-[12px]">
                <span className="text-racing-text">Driver</span> <span className="text-racing-muted">Q</span>
              </td>
              {teams.flatMap(tg =>
                tg.drivers.map((d, i) => (
                  <td key={d.car_number} className={`text-center px-2 py-1 text-racing-text ${i === 0 ? 'border-l border-racing-border/30' : ''}`}>
                    {fmt(d.avgQual)}
                  </td>
                ))
              )}
            </tr>
            {/* Driver F row */}
            <tr className="border-b border-racing-border/30">
              <td className="sticky left-0 z-10 bg-racing-bg px-3 py-1 text-racing-muted text-[12px]">
                <span className="text-racing-text">Driver</span> <span className="text-racing-muted">F</span>
              </td>
              {teams.flatMap(tg =>
                tg.drivers.map((d, i) => (
                  <td key={d.car_number} className={`text-center px-2 py-1 text-racing-text ${i === 0 ? 'border-l border-racing-border/30' : ''}`}>
                    {fmt(d.avgFinish)}
                  </td>
                ))
              )}
            </tr>
            {/* Team Q row */}
            <tr className="border-b border-racing-border/30">
              <td className="sticky left-0 z-10 bg-racing-bg px-3 py-1 text-racing-muted text-[12px]">
                <span className="text-racing-text">Team</span> <span className="text-racing-muted">Q</span>
              </td>
              {teams.map(tg => (
                <td
                  key={tg.team}
                  colSpan={tg.drivers.length}
                  className="text-center px-2 py-1 text-racing-text border-l border-racing-border/30"
                >
                  {fmt(tg.teamAvgQual)}
                </td>
              ))}
            </tr>
            {/* Team F row */}
            <tr className="border-b border-racing-border/50">
              <td className="sticky left-0 z-10 bg-racing-bg px-3 py-1 text-racing-muted text-[12px]">
                <span className="text-racing-text">Team</span> <span className="text-racing-muted">F</span>
              </td>
              {teams.map(tg => (
                <td
                  key={tg.team}
                  colSpan={tg.drivers.length}
                  className="text-center px-2 py-1 text-racing-text border-l border-racing-border/30"
                >
                  {fmt(tg.teamAvgFinish)}
                </td>
              ))}
            </tr>

            {/* Track type breakdowns */}
            {trackTypes.map(tt => (
              <tbody key={tt}>
                <tr className="border-b border-racing-border/30">
                  <td className="sticky left-0 z-10 bg-racing-bg px-3 py-1 text-racing-muted text-[12px]">
                    <span className="text-racing-text">{TRACK_TYPE_LABELS[tt]}</span> <span className="text-racing-muted">Q</span>
                  </td>
                  {teams.flatMap(tg =>
                    tg.drivers.map((d, i) => (
                      <td key={d.car_number} className={`text-center px-2 py-1 text-racing-text ${i === 0 ? 'border-l border-racing-border/30' : ''}`}>
                        {fmt(d.byTrackType[tt].avgQual)}
                      </td>
                    ))
                  )}
                </tr>
                <tr className="border-b border-racing-border/50">
                  <td className="sticky left-0 z-10 bg-racing-bg px-3 py-1 text-racing-muted text-[12px]">
                    <span className="text-racing-text">{TRACK_TYPE_LABELS[tt]}</span> <span className="text-racing-muted">F</span>
                  </td>
                  {teams.flatMap(tg =>
                    tg.drivers.map((d, i) => (
                      <td key={d.car_number} className={`text-center px-2 py-1 text-racing-text ${i === 0 ? 'border-l border-racing-border/30' : ''}`}>
                        {fmt(d.byTrackType[tt].avgFinish)}
                      </td>
                    ))
                  )}
                </tr>
              </tbody>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamGridTab;
