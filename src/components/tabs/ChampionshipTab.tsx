import { useMemo, useState } from 'react';
import { useRaceContext } from '@/contexts/RaceContext';
import {
  useRaceDetails,
  useSeasonRaces,
  useSeasonResults,
  useDriverMetadata,
  useSeasonPitTimes,
  useSeasonQualifying,
  useSeasonFast6Poles,
} from '@/hooks/useRaceData';
import { formatDriverName } from '@/lib/formatName';
import CarBadge from '@/components/racing/CarBadge';
import EngineIcon from '@/components/racing/EngineIcon';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Race points scale (P1=50 down)
const POINTS_SCALE = [50, 40, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const FLAG_EMOJI: Record<string, string> = {
  USA: '🇺🇸', NZL: '🇳🇿', BRA: '🇧🇷', MEX: '🇲🇽', DEN: '🇩🇰', CAY: '🇰🇾',
  ESP: '🇪🇸', FRA: '🇫🇷', NOR: '🇳🇴', GBR: '🇬🇧', AUS: '🇦🇺', SWE: '🇸🇪',
  NED: '🇳🇱', GER: '🇩🇪', JPN: '🇯🇵',
};

// Collapsible section wrapper
const Section = ({ title, description, defaultOpen = false, unofficial = false, children }: {
  title: string; description: string; defaultOpen?: boolean; unofficial?: boolean; children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`border rounded-lg ${unofficial ? 'border-racing-muted/40' : 'border-racing-border'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-heading text-lg text-racing-yellow">{title}</h3>
          {unofficial && (
            <span className="text-[11px] font-mono text-racing-muted border border-racing-muted/40 rounded px-2 py-0.5">
              Fan Calculated · Not Official INDYCAR Championship
            </span>
          )}
        </div>
        {open ? <ChevronDown className="w-5 h-5 text-racing-muted" /> : <ChevronRight className="w-5 h-5 text-racing-muted" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="font-mono text-[13px] text-racing-muted mb-4">{description}</p>
          {children}
        </div>
      )}
    </div>
  );
};

// Round header abbreviation
const roundLabel = (trackName: string) => {
  const abbrevs: Record<string, string> = {
    'St. Petersburg': 'STP', 'Phoenix': 'PHX', 'Arlington': 'ARL', 'Barber': 'BAR',
    'Long Beach': 'LB', 'Indianapolis': 'IND', 'Detroit': 'DET', 'Road America': 'RA',
    'Mid-Ohio': 'MO', 'Toronto': 'TOR', 'Iowa': 'IOW', 'Gateway': 'GTW',
    'Portland': 'POR', 'Laguna Seca': 'LS', 'Nashville': 'NSH',
  };
  for (const [key, val] of Object.entries(abbrevs)) {
    if (trackName.toLowerCase().includes(key.toLowerCase())) return val;
  }
  return `R${trackName.slice(0, 3).toUpperCase()}`;
};

const ChampionshipTab = () => {
  const { raceId } = useRaceContext();
  const { data: raceDetails } = useRaceDetails(raceId);
  const year = raceDetails?.year ?? null;
  const { data: seasonRaces } = useSeasonRaces(year);
  const { data: seasonResults } = useSeasonResults(year);
  const { data: driverMeta } = useDriverMetadata(year);
  const { data: pitTimes } = useSeasonPitTimes(year);
  const { data: qualPoles } = useSeasonQualifying(year);
  const { data: fast6Poles } = useSeasonFast6Poles(year);
  const isMobile = useIsMobile();

  const currentRound = raceDetails?.round_number ?? 0;
  const races = useMemo(() => (seasonRaces || []).filter(r => r.round_number <= currentRound), [seasonRaces, currentRound]);

  // Map car_number to metadata
  const metaMap = useMemo(() => {
    const m: Record<string, any> = {};
    (driverMeta || []).forEach(d => { m[d.car_number] = d; });
    return m;
  }, [driverMeta]);

  // Results grouped by round
  const resultsByRound = useMemo(() => {
    const m: Record<number, any[]> = {};
    (seasonResults || []).forEach(r => {
      const rn = (r as any).races?.round_number;
      if (rn && rn <= currentRound) {
        if (!m[rn]) m[rn] = [];
        m[rn].push(r);
      }
    });
    return m;
  }, [seasonResults, currentRound]);

  // Pole winners per round (combine qualifying_results + fast6)
  const poleByRound = useMemo(() => {
    const m: Record<number, string> = {};
    (qualPoles || []).forEach((q: any) => {
      const rn = q.races?.round_number;
      if (rn) m[rn] = q.car_number;
    });
    // Fast 6 overrides for road courses
    (fast6Poles || []).forEach((f: any) => {
      const rn = f.races?.round_number;
      if (rn) m[rn] = f.car_number;
    });
    return m;
  }, [qualPoles, fast6Poles]);

  if (!raceDetails || !seasonRaces) {
    return <p className="text-racing-muted font-body">Loading championship data…</p>;
  }

  const latestRace = races[races.length - 1];

  // ─── SECTION 1: Driver Championship ───
  const driverStandings = useMemo(() => {
    const totals: Record<string, { car: string; name: string; engine: string; roundPts: Record<number, number>; total: number }> = {};
    for (const [rn, results] of Object.entries(resultsByRound)) {
      const round = parseInt(rn);
      for (const r of results) {
        const key = r.car_number;
        if (!totals[key]) totals[key] = { car: key, name: r.driver_name, engine: r.engine, roundPts: {}, total: 0 };
        totals[key].roundPts[round] = r.race_points;
        totals[key].total += r.race_points;
      }
    }
    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [resultsByRound]);

  // ─── SECTION 2: NTT P1 Award ───
  const p1Standings = useMemo(() => {
    const totals: Record<string, { car: string; name: string; roundPoles: Record<number, boolean>; total: number; poles: number }> = {};
    for (const race of races) {
      const poleCar = poleByRound[race.round_number];
      if (!poleCar) continue;
      if (!totals[poleCar]) {
        const r = Object.values(resultsByRound).flat().find(rr => rr.car_number === poleCar);
        totals[poleCar] = { car: poleCar, name: r?.driver_name || poleCar, roundPoles: {}, total: 0, poles: 0 };
      }
      totals[poleCar].roundPoles[race.round_number] = true;
      totals[poleCar].total += 50;
      totals[poleCar].poles += 1;
    }
    return Object.values(totals).sort((a, b) => b.total - a.total);
  }, [races, poleByRound, resultsByRound]);

  // ─── SECTION 3: Rookie of the Year ───
  const rookieStandings = useMemo(() => {
    const rookieCars = new Set((driverMeta || []).filter(d => d.is_rookie).map(d => d.car_number));
    return driverStandings.filter(d => rookieCars.has(d.car));
  }, [driverStandings, driverMeta]);

  // ─── SECTION 4: Engine Manufacturer Championship ───
  const engineStandings = useMemo(() => {
    const fullSeasonCars = new Set((driverMeta || []).filter(d => d.is_full_season).map(d => d.car_number));
    const mfrs: Record<string, { name: string; roundPts: Record<number, number>; total: number }> = {
      Chevy: { name: 'Chevrolet', roundPts: {}, total: 0 },
      Honda: { name: 'Honda', roundPts: {}, total: 0 },
    };
    for (const race of races) {
      const rn = race.round_number;
      const results = resultsByRound[rn] || [];
      const poleCar = poleByRound[rn];

      for (const mfrKey of ['Chevy', 'Honda']) {
        const mfrResults = results
          .filter(r => {
            const eng = r.engine?.toLowerCase() || '';
            return mfrKey === 'Chevy'
              ? (eng.includes('chevy') || eng.includes('chevrolet') || eng === 'c')
              : (eng.includes('honda') || eng === 'h');
          })
          .filter(r => fullSeasonCars.has(r.car_number))
          .sort((a: any, b: any) => a.finish_position - b.finish_position);

        const top2 = mfrResults.slice(0, 2);
        let pts = top2.reduce((s: number, r: any) => s + r.race_points, 0);

        // +5 if their driver won
        if (mfrResults.length > 0 && mfrResults[0].finish_position === 1) pts += 5;

        // +1 if their driver got pole
        if (poleCar) {
          const poleMeta = metaMap[poleCar];
          if (poleMeta) {
            const poleEng = poleMeta.engine?.toLowerCase() || '';
            const isPole = mfrKey === 'Chevy'
              ? (poleEng.includes('chevy') || poleEng.includes('chevrolet'))
              : poleEng.includes('honda');
            if (isPole) pts += 1;
          }
        }

        mfrs[mfrKey].roundPts[rn] = pts;
        mfrs[mfrKey].total += pts;
      }
    }
    return Object.values(mfrs).sort((a, b) => b.total - a.total);
  }, [races, resultsByRound, poleByRound, driverMeta, metaMap]);

  // ─── SECTION 5: Team Championship ───
  const teamStandings = useMemo(() => {
    const teams: Record<string, { name: string; roundPts: Record<number, number>; total: number }> = {};
    for (const race of races) {
      const rn = race.round_number;
      const results = resultsByRound[rn] || [];
      const teamPts: Record<string, { sum: number; count: number }> = {};
      for (const r of results) {
        const team = metaMap[r.car_number]?.team || 'Unknown';
        if (!teamPts[team]) teamPts[team] = { sum: 0, count: 0 };
        teamPts[team].sum += r.race_points;
        teamPts[team].count += 1;
      }
      for (const [team, { sum, count }] of Object.entries(teamPts)) {
        if (sum === 0) continue;
        if (!teams[team]) teams[team] = { name: team, roundPts: {}, total: 0 };
        const avg = Math.round((sum / count) * 100) / 100;
        teams[team].roundPts[rn] = avg;
        teams[team].total += avg;
      }
    }
    return Object.values(teams).sort((a, b) => b.total - a.total).map(t => ({
      ...t, total: Math.round(t.total * 100) / 100,
    }));
  }, [races, resultsByRound, metaMap]);

  // ─── SECTION 6: Firestone Pit Stop Performance ───
  const pitStandings = useMemo(() => {
    if (!pitTimes || pitTimes.length === 0) return null;
    const drivers: Record<string, { car: string; name: string; team: string; roundPts: Record<number, number>; total: number }> = {};
    for (const race of races) {
      const rn = race.round_number;
      const raceTimesRaw = (pitTimes as any[]).filter(pt => pt.races?.round_number === rn);
      if (raceTimesRaw.length === 0) continue;

      // Average pit time per driver for this race
      const driverAvgs: { car: string; name: string; avg: number }[] = [];
      const grouped: Record<string, { name: string; times: number[] }> = {};
      for (const pt of raceTimesRaw) {
        if (!grouped[pt.car_number]) grouped[pt.car_number] = { name: pt.driver_name, times: [] };
        grouped[pt.car_number].times.push(Number(pt.pit_time_seconds));
      }
      for (const [car, { name, times }] of Object.entries(grouped)) {
        driverAvgs.push({ car, name, avg: times.reduce((a, b) => a + b, 0) / times.length });
      }
      driverAvgs.sort((a, b) => a.avg - b.avg);

      // Award points
      driverAvgs.forEach((d, i) => {
        const pts = POINTS_SCALE[i] || 1;
        if (!drivers[d.car]) {
          const team = metaMap[d.car]?.team || '';
          drivers[d.car] = { car: d.car, name: d.name, team, roundPts: {}, total: 0 };
        }
        drivers[d.car].roundPts[rn] = pts;
        drivers[d.car].total += pts;
      });
    }
    return Object.values(drivers).sort((a, b) => b.total - a.total);
  }, [races, pitTimes, metaMap]);

  // ─── SECTION 7: Nations Cup ───
  const nationStandings = useMemo(() => {
    const nations: Record<string, { country: string; code: string; roundPts: Record<number, number>; roundDriver: Record<number, string>; total: number }> = {};
    for (const race of races) {
      const rn = race.round_number;
      const results = resultsByRound[rn] || [];
      const countryBest: Record<string, { pts: number; driver: string; code: string }> = {};
      for (const r of results) {
        const meta = metaMap[r.car_number];
        if (!meta) continue;
        const country = meta.nationality;
        const code = meta.nationality_code;
        if (!countryBest[country] || r.race_points > countryBest[country].pts) {
          countryBest[country] = { pts: r.race_points, driver: r.driver_name, code };
        }
      }
      for (const [country, { pts, driver, code }] of Object.entries(countryBest)) {
        if (!nations[country]) nations[country] = { country, code, roundPts: {}, roundDriver: {}, total: 0 };
        nations[country].roundPts[rn] = pts;
        nations[country].roundDriver[rn] = driver;
        nations[country].total += pts;
      }
    }
    return Object.values(nations).sort((a, b) => b.total - a.total);
  }, [races, resultsByRound, metaMap]);

  // ─── Render helpers ───
  const RoundHeaders = () => (
    <>
      {races.map(r => (
        <th key={r.round_number} className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center whitespace-nowrap" title={r.track_name}>
          R{r.round_number}
        </th>
      ))}
    </>
  );

  const RoundCells = ({ roundData, format = 'number' }: { roundData: Record<number, number | boolean | string>; format?: string }) => (
    <>
      {races.map(r => {
        const val = roundData[r.round_number];
        return (
          <td key={r.round_number} className="px-2 py-2 font-mono text-[14px] text-racing-text text-center">
            {val === undefined || val === null ? '—' : format === 'boolean' ? (val ? '50' : '—') : typeof val === 'number' ? val : String(val)}
          </td>
        );
      })}
    </>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl text-racing-text">{year} Season Championships</h2>
        <p className="font-condensed text-[15px] text-racing-muted">
          Through Round {currentRound} — {latestRace?.track_name || ''}
        </p>
      </div>

      {/* SECTION 1 – Driver Championship */}
      <Section title="Driver Championship" description="Points awarded based on finishing position in each race." defaultOpen>
        {isMobile ? (
          <div className="space-y-2">
            {driverStandings.map((d, i) => (
              <div key={d.car} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                <CarBadge num={d.car} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[15px] text-racing-text truncate">{formatDriverName(d.name)}</p>
                  <div className="flex gap-2 text-[12px] font-mono text-racing-muted mt-0.5">
                    {races.map(r => (
                      <span key={r.round_number}>R{r.round_number}: {d.roundPts[r.round_number] ?? '—'}</span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[15px] text-racing-yellow font-bold">{d.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-racing-border">
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Car</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Driver</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Eng</th>
                  <RoundHeaders />
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {driverStandings.map((d, i) => (
                  <tr key={d.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                    <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                    <td className="px-2 py-2"><CarBadge num={d.car} /></td>
                    <td className="px-2 py-2 font-body text-[15px] text-racing-text">{formatDriverName(d.name)}</td>
                    <td className="px-2 py-2"><EngineIcon engine={d.engine} /></td>
                    <RoundCells roundData={d.roundPts} />
                    <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* SECTION 2 – NTT P1 Award */}
      <Section title="NTT P1 Award" description="50 points awarded to the pole position qualifier at each event.">
        {isMobile ? (
          <div className="space-y-2">
            {p1Standings.map((d, i) => (
              <div key={d.car} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                <CarBadge num={d.car} />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[15px] text-racing-text truncate">{formatDriverName(d.name)}</p>
                  <p className="text-[12px] font-mono text-racing-muted">{d.poles} pole{d.poles !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-mono text-[15px] text-racing-yellow font-bold">{d.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-racing-border">
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Car</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Driver</th>
                  <RoundHeaders />
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Poles</th>
                </tr>
              </thead>
              <tbody>
                {p1Standings.map((d, i) => (
                  <tr key={d.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                    <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                    <td className="px-2 py-2"><CarBadge num={d.car} /></td>
                    <td className="px-2 py-2 font-body text-[15px] text-racing-text">{formatDriverName(d.name)}</td>
                    <RoundCells roundData={d.roundPoles} format="boolean" />
                    <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{d.total}</td>
                    <td className="px-2 py-2 font-mono text-[15px] text-racing-text text-center">{d.poles}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {p1Standings.length === 0 && <p className="text-racing-muted font-body text-[14px]">No qualifying data available yet.</p>}
      </Section>

      {/* SECTION 3 – Rookie of the Year */}
      {rookieStandings.length > 0 && (
        <Section title="Rookie of the Year" description="Cumulative race points for drivers in their first full INDYCAR season.">
          {isMobile ? (
            <div className="space-y-2">
              {rookieStandings.map((d, i) => (
                <div key={d.car} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                  <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                  <CarBadge num={d.car} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[15px] text-racing-text truncate">{formatDriverName(d.name)}</p>
                    <p className="text-[12px] font-mono text-racing-muted">{metaMap[d.car]?.nationality || ''}</p>
                  </div>
                  <span className="font-mono text-[15px] text-racing-yellow font-bold">{d.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-racing-border">
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Car</th>
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Driver</th>
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Nationality</th>
                    <RoundHeaders />
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rookieStandings.map((d, i) => (
                    <tr key={d.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                      <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                      <td className="px-2 py-2"><CarBadge num={d.car} /></td>
                      <td className="px-2 py-2 font-body text-[15px] text-racing-text">{formatDriverName(d.name)}</td>
                      <td className="px-2 py-2 font-body text-[14px] text-racing-muted">{metaMap[d.car]?.nationality || ''}</td>
                      <RoundCells roundData={d.roundPts} />
                      <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* SECTION 4 – Engine Manufacturer Championship */}
      <Section title="Engine Manufacturer Championship" description="Points awarded to top two full-season entrants per manufacturer per race, plus 5 for race win and 1 for pole position.">
        {isMobile ? (
          <div className="space-y-2">
            {engineStandings.map((m, i) => (
              <div key={m.name} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                <EngineIcon engine={m.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[15px] text-racing-text">{m.name}</p>
                  <div className="flex gap-2 text-[12px] font-mono text-racing-muted mt-0.5">
                    {races.map(r => (
                      <span key={r.round_number}>R{r.round_number}: {m.roundPts[r.round_number] ?? '—'}</span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[15px] text-racing-yellow font-bold">{m.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-racing-border">
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Manufacturer</th>
                  <RoundHeaders />
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {engineStandings.map((m, i) => (
                  <tr key={m.name} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                    <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                    <td className="px-2 py-2 flex items-center gap-2">
                      <EngineIcon engine={m.name} size="md" />
                      <span className="font-body text-[15px] text-racing-text">{m.name}</span>
                    </td>
                    <RoundCells roundData={m.roundPts} />
                    <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{m.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* SECTION 5 – Team Championship */}
      <Section title="Team Championship" description="Average race points per driver per race across all team entries.">
        {isMobile ? (
          <div className="space-y-2">
            {teamStandings.map((t, i) => (
              <div key={t.name} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[15px] text-racing-text truncate">{t.name}</p>
                  <div className="flex gap-2 text-[12px] font-mono text-racing-muted mt-0.5 flex-wrap">
                    {races.map(r => (
                      <span key={r.round_number}>R{r.round_number}: {t.roundPts[r.round_number]?.toFixed(1) ?? '—'}</span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[15px] text-racing-yellow font-bold">{t.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-racing-border">
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Team</th>
                  <RoundHeaders />
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {teamStandings.map((t, i) => (
                  <tr key={t.name} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                    <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                    <td className="px-2 py-2 font-body text-[15px] text-racing-text">{t.name}</td>
                    {races.map(r => (
                      <td key={r.round_number} className="px-2 py-2 font-mono text-[14px] text-racing-text text-center">
                        {t.roundPts[r.round_number] !== undefined ? t.roundPts[r.round_number].toFixed(1) : '—'}
                      </td>
                    ))}
                    <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{t.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* SECTION 6 – Firestone Pit Stop Performance */}
      <Section title="Firestone Pit Stop Performance" description="Points awarded based on average pit lane transit time per race. Faster pit stops earn more points.">
        {pitStandings === null ? (
          <p className="text-racing-muted font-body text-[14px]">Data pending — upload Section Data Race reports to populate pit stop times.</p>
        ) : (
          isMobile ? (
            <div className="space-y-2">
              {pitStandings.slice(0, 15).map((d, i) => (
                <div key={d.car} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                  <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                  <CarBadge num={d.car} />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[15px] text-racing-text truncate">{formatDriverName(d.name)}</p>
                    <p className="text-[12px] font-mono text-racing-muted">{d.team}</p>
                  </div>
                  <span className="font-mono text-[15px] text-racing-yellow font-bold">{d.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-racing-border">
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Car</th>
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Driver</th>
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Team</th>
                    <RoundHeaders />
                    <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pitStandings.map((d, i) => (
                    <tr key={d.car} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                      <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                      <td className="px-2 py-2"><CarBadge num={d.car} /></td>
                      <td className="px-2 py-2 font-body text-[15px] text-racing-text">{formatDriverName(d.name)}</td>
                      <td className="px-2 py-2 font-body text-[14px] text-racing-muted">{d.team}</td>
                      <RoundCells roundData={d.roundPts} />
                      <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Section>

      {/* SECTION 7 – Nations Cup */}
      <Section title="Nations Cup" description="Fan-calculated championship awarding each country the points of its highest-finishing driver per race. Inspired by the CART Nations Cup. Not an official INDYCAR championship." unofficial>
        {isMobile ? (
          <div className="space-y-2">
            {nationStandings.map((n, i) => (
              <div key={n.country} className="flex items-center gap-3 bg-racing-surface2/50 rounded-lg px-3 py-2">
                <span className="font-heading text-[15px] text-racing-muted w-6">{i + 1}</span>
                <span className="text-xl">{FLAG_EMOJI[n.code] || '🏁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[15px] text-racing-text">{n.country}</p>
                  <div className="flex gap-2 text-[12px] font-mono text-racing-muted mt-0.5 flex-wrap">
                    {races.map(r => (
                      <span key={r.round_number} title={n.roundDriver[r.round_number] ? formatDriverName(n.roundDriver[r.round_number]) : ''}>
                        R{r.round_number}: {n.roundPts[r.round_number] ?? '—'}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[15px] text-racing-yellow font-bold">{n.total}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-racing-border">
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Rank</th>
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase">Country</th>
                  <RoundHeaders />
                  <th className="px-2 py-2 font-condensed font-semibold text-[13px] text-racing-muted uppercase text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {nationStandings.map((n, i) => (
                  <tr key={n.country} className="border-b border-racing-border/50 hover:bg-racing-surface2/50">
                    <td className="px-2 py-2 font-heading text-[15px] text-racing-muted">{i + 1}</td>
                    <td className="px-2 py-2 flex items-center gap-2">
                      <span className="text-xl">{FLAG_EMOJI[n.code] || '🏁'}</span>
                      <span className="font-body text-[15px] text-racing-text">{n.country}</span>
                    </td>
                    {races.map(r => (
                      <td key={r.round_number} className="px-2 py-2 font-mono text-[14px] text-racing-text text-center" title={n.roundDriver[r.round_number] ? formatDriverName(n.roundDriver[r.round_number]) : ''}>
                        {n.roundPts[r.round_number] ?? '—'}
                      </td>
                    ))}
                    <td className="px-2 py-2 font-mono text-[15px] text-racing-yellow font-bold text-center">{n.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
};

export default ChampionshipTab;
