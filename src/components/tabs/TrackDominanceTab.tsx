import { useState, useMemo } from 'react';
import { useRaceContext } from '@/contexts/RaceContext';
import { useRaceDetails, useFastestLapRowsForSession, useFastestLapSessionTypes } from '@/hooks/useRaceData';
import { useQualifyingSectors, useQualifyingResults } from '@/hooks/useSessionData';
import { formatDriverName } from '@/lib/formatName';
import { aggregateFastestLapSectionsByCar, parseLapTimeToSeconds } from '@/lib/raceStats';
import { useIsMobile } from '@/hooks/use-mobile';
import CarBadge from '@/components/racing/CarBadge';
import { CAR_COLORS } from '@/components/racing/CarBadge';
import { ChevronDown } from 'lucide-react';

const SECTOR_KEYS = [
  { key: 'dogleg_time', label: 'Dogleg' },
  { key: 'front_stretch_time', label: 'Front Str' },
  { key: 'turn1_entry_time', label: 'T1 Entry' },
  { key: 'turn1_exit_time', label: 'T1 Exit' },
  { key: 'turn2_entry_time', label: 'T2 Entry' },
  { key: 'turn2_exit_time', label: 'T2 Exit' },
  { key: 'turn3_entry_time', label: 'T3 Entry' },
  { key: 'turn3_exit_time', label: 'T3 Exit' },
  { key: 'turn4_time', label: 'Turn 4' },
] as const;

const getRoadCourseSectionDisplay = (value?: string | null) => value || '—';
const getRoadCourseSectionValue = (value?: string | null) => parseLapTimeToSeconds(value);

const PIT_SECTION_PATTERNS = ['PI to', 'SFP to', 'PIC to', 'PO to', 'SF to', 'T1T to', 'T3T to', 'T4T to', 'I9ET', 'I13AT', 'I14 to'];

const TrackDominanceTab = () => {
  const { raceId } = useRaceContext();
  const [sessionType, setSessionType] = useState('Race');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [showQualSectors, setShowQualSectors] = useState(false);
  const isMobile = useIsMobile();

  const { data: race } = useRaceDetails(raceId);
  const { data: availableSessions } = useFastestLapSessionTypes(raceId);
  const { data: sessionFastestRows } = useFastestLapRowsForSession(raceId, sessionType);
  const { data: qualSectors } = useQualifyingSectors(raceId);
  const { data: qualResults } = useQualifyingResults(raceId);

  const sectionMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const row of sessionFastestRows || []) {
      if (!map.has(row.section_name)) map.set(row.section_name, []);
      map.get(row.section_name)!.push(row);
    }
    for (const [, rows] of map) rows.sort((a: any, b: any) => a.rank - b.rank);
    return map;
  }, [sessionFastestRows]);

  const racingSections = useMemo(() => {
    const sections = Array.from(sectionMap.keys()).filter(name =>
      !PIT_SECTION_PATTERNS.some(p => name.includes(p))
    );
    return ['Lap', ...sections.filter(s => s !== 'Lap')].filter(s => sectionMap.has(s));
  }, [sectionMap]);

  // Qualifying sector comparison logic
  const qualifyingSectorDriverCount = useMemo(
    () => new Set((qualSectors || []).map((row) => row.car_number)).size,
    [qualSectors],
  );

  const hasCompleteOvalSectorData = useMemo(() => {
    if (!qualResults?.length || !qualSectors?.length) return false;
    return qualifyingSectorDriverCount / qualResults.length >= 0.8;
  }, [qualResults, qualSectors, qualifyingSectorDriverCount]);

  const roadCourseSectionNames = useMemo(() => {
    if (sessionType !== 'Qualifying') return [] as string[];
    return Array.from(new Set(
      (sessionFastestRows || [])
        .map((row) => row.section_name)
        .filter((name) => name && name !== 'Lap'),
    ));
  }, [sessionFastestRows, sessionType]);

  const ovalSectorComparison = useMemo(() => {
    if (!hasCompleteOvalSectorData || !qualSectors || !qualResults) return [];
    const driverMap = new Map<string, { car: string; name: string; qualPos: number; laps: any[] }>();
    for (const qs of qualSectors) {
      if (!driverMap.has(qs.car_number)) {
        const qr = qualResults.find(q => q.car_number === qs.car_number);
        driverMap.set(qs.car_number, { car: qs.car_number, name: formatDriverName(qs.driver_name), qualPos: qr?.qual_position || 99, laps: [] });
      }
      driverMap.get(qs.car_number)!.laps.push(qs);
    }
    return Array.from(driverMap.values()).sort((a, b) => a.qualPos - b.qualPos);
  }, [hasCompleteOvalSectorData, qualResults, qualSectors]);

  const roadCourseSectorComparison = useMemo(() => {
    if (sessionType !== 'Qualifying' || hasCompleteOvalSectorData) return [];
    const qualifyingFastestRows = (sessionFastestRows || []).filter((row) => row.section_name !== 'Lap');
    if (!qualifyingFastestRows.length) return [];
    return aggregateFastestLapSectionsByCar(sessionFastestRows)
      .map((driver) => {
        const qr = (qualResults || []).find((q) => q.car_number === driver.car_number);
        return {
          car: driver.car_number,
          name: formatDriverName(driver.driver_name),
          qualPos: qr?.qual_position || 99,
          bestLapTime: driver.sections.Lap?.section_time || driver.sections.Lap?.time || null,
          sections: driver.sections,
        };
      })
      .sort((a, b) => a.qualPos - b.qualPos);
  }, [hasCompleteOvalSectorData, qualResults, sessionFastestRows, sessionType]);

  const bestSectorTimes = useMemo(() => {
    if (hasCompleteOvalSectorData) {
      if (!qualSectors) return {} as Record<string, number>;
      const bests: Record<string, number> = {};
      for (const key of SECTOR_KEYS) {
        let min = Infinity;
        for (const qs of qualSectors) {
          const val = Number(qs[key.key as keyof typeof qs]);
          if (val && val < min) min = val;
        }
        bests[key.key] = min;
      }
      return bests;
    }
    const bests: Record<string, number> = {};
    for (const sectionName of roadCourseSectionNames) {
      let min = Infinity;
      for (const row of sessionFastestRows || []) {
        if (row.section_name !== sectionName) continue;
        const val = getRoadCourseSectionValue(row.section_time || row.time);
        if (val !== null && val > 0 && val < min) min = val;
      }
      bests[sectionName] = min;
    }
    return bests;
  }, [hasCompleteOvalSectorData, qualSectors, roadCourseSectionNames, sessionFastestRows]);

  const driverLapComparison = useMemo(() => {
    if (!hasCompleteOvalSectorData || !selectedDriver || !qualSectors) return null;
    const driverSectors = qualSectors.filter(s => s.car_number === selectedDriver);
    const lap1 = driverSectors.find(s => s.lap_number === 1);
    const lap2 = driverSectors.find(s => s.lap_number === 2);
    if (!lap1) return null;
    return { lap1, lap2 };
  }, [hasCompleteOvalSectorData, selectedDriver, qualSectors]);

  const driversForSelector = ovalSectorComparison.map(d => ({ car: d.car, name: d.name }));

  const hasQualSectorData = sessionType === 'Qualifying' && (ovalSectorComparison.length > 0 || roadCourseSectorComparison.length > 0);

  // ---- Track map component ----
  const TrackMap = () => (
    race?.track_map_url ? (
      <div className="bg-racing-surface rounded-lg border border-racing-border p-4">
        <h3 className="font-condensed font-semibold text-[15px] text-racing-text uppercase mb-3">
          {race.track_name} — Track Map
        </h3>
        <img src={race.track_map_url} alt={`${race.track_name} track map`} className="w-full rounded" />
        {!isMobile && (
          <p className="font-mono text-[12px] text-racing-muted mt-2">
            Section labels correspond to timing zones in the dominance table →
          </p>
        )}
      </div>
    ) : (
      <div className="bg-racing-surface rounded-lg border border-racing-border p-6 lg:p-8 flex items-center justify-center lg:min-h-[300px]">
        <p className="font-condensed text-[15px] text-racing-muted text-center">
          Track map available after event summary PDF is uploaded
        </p>
      </div>
    )
  );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Track Dominance</h2>

      {/* Session selector — horizontal scroll on mobile */}
      <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {(availableSessions || []).map(opt => (
            <button
              key={opt}
              onClick={() => { setSessionType(opt); setExpandedSection(null); setShowQualSectors(false); }}
              className={`px-3 py-1.5 rounded text-sm font-condensed font-semibold uppercase transition-all whitespace-nowrap ${
                sessionType === opt
                  ? 'bg-racing-yellow/10 text-racing-yellow border border-racing-yellow/30'
                  : 'bg-racing-surface text-racing-muted border border-racing-border hover:text-racing-text'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: lg = two-column, below = stacked vertically */}
      <div className="flex flex-col lg:grid lg:grid-cols-[55%_45%] gap-6">
        {/* Desktop only: Track map left column */}
        <div className="hidden lg:block order-1">
          <TrackMap />
        </div>

        {/* Section Dominance Table */}
        <div className="order-1 lg:order-2">
          <h3 className="font-condensed font-semibold text-[15px] text-racing-text uppercase mb-2">Section Dominance</h3>
          <div className="space-y-px">
            {/* Desktop header */}
            <div className="hidden lg:grid grid-cols-[1fr_60px_auto_90px_70px_40px_24px] gap-1 px-2 py-1.5 border-b border-racing-border">
              <span className="font-condensed font-semibold text-[12px] text-racing-muted uppercase">Section</span>
              <span className="font-condensed font-semibold text-[12px] text-racing-muted uppercase">Length</span>
              <span className="font-condensed font-semibold text-[12px] text-racing-muted uppercase">P1 Driver</span>
              <span className="font-condensed font-semibold text-[12px] text-racing-muted uppercase text-right">Time</span>
              <span className="font-condensed font-semibold text-[12px] text-racing-muted uppercase text-right">Speed</span>
              <span className="font-condensed font-semibold text-[12px] text-racing-muted uppercase text-right">Lap</span>
              <span />
            </div>

            {racingSections.map(sectionName => {
              const rows = sectionMap.get(sectionName) || [];
              const p1 = rows[0];
              if (!p1) return null;
              const isExpanded = expandedSection === sectionName;
              const borderColor = CAR_COLORS[p1.car_number] || 'hsl(var(--racing-blue))';

              return (
                <div key={sectionName}>
                  {/* Summary row */}
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : sectionName)}
                    className="w-full text-left bg-racing-surface hover:bg-racing-surface2/50 transition-colors rounded-sm"
                    style={{ borderLeft: `3px solid ${borderColor}` }}
                  >
                    {/* Mobile: 3 columns — section, P1 badge+name, time */}
                    <div className="lg:hidden px-3 py-2.5 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-condensed text-sm text-racing-text font-semibold">{sectionName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <CarBadge num={p1.car_number} size="sm" />
                        <span className="font-body text-[13px] text-racing-text">{formatDriverName(p1.driver_name)}</span>
                      </div>
                      <span className="font-mono text-[12px] text-racing-yellow shrink-0">{p1.section_time || p1.time}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-racing-muted transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {/* Desktop: full 7 columns */}
                    <div className="hidden lg:grid grid-cols-[1fr_60px_auto_90px_70px_40px_24px] gap-1 items-center px-2 py-2">
                      <span className="font-condensed text-sm text-racing-text">{sectionName}</span>
                      <span className="font-mono text-[12px] text-racing-muted">{p1.section_length_miles ? `${Number(p1.section_length_miles).toFixed(3)}` : '—'}</span>
                      <div className="flex items-center gap-1.5">
                        <CarBadge num={p1.car_number} size="sm" />
                        <span className="font-body text-sm text-racing-text">{formatDriverName(p1.driver_name)}</span>
                      </div>
                      <span className="font-mono text-sm text-racing-yellow text-right">{p1.section_time || p1.time}</span>
                      <span className="font-mono text-[12px] text-racing-text text-right">{Number(p1.section_speed ?? p1.speed)?.toFixed(3)}</span>
                      <span className="font-mono text-[12px] text-racing-muted text-right">L{p1.lap_number}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-racing-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded rankings */}
                  {isExpanded && (
                    <div className="bg-racing-bg border-l-[3px] border-racing-border/30 ml-[3px]">
                      {/* Mobile: stacked cards */}
                      <div className="lg:hidden space-y-px">
                        {rows.map((row: any, idx: number) => (
                          <div
                            key={row.id}
                            className={`px-3 py-2 ${idx === 0 ? 'bg-racing-surface2/40' : idx % 2 === 0 ? 'bg-racing-surface/30' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-heading text-[12px] text-racing-muted w-5 shrink-0">P{row.rank}</span>
                              <CarBadge num={row.car_number} size="sm" />
                              <span className="font-body text-[13px] text-racing-text flex-1 min-w-0 truncate">{formatDriverName(row.driver_name)}</span>
                              <span className="font-mono text-[12px] text-racing-yellow shrink-0">{row.section_time || row.time}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop: grid rows */}
                      <div className="hidden lg:block">
                        {rows.map((row: any, idx: number) => (
                          <div
                            key={row.id}
                            className={`grid grid-cols-[1fr_60px_auto_90px_70px_40px_24px] gap-1 items-center px-2 py-1 ${idx === 0 ? 'bg-racing-surface2/40' : idx % 2 === 0 ? 'bg-racing-surface/30' : ''}`}
                          >
                            <span className="font-heading text-[12px] text-racing-muted">P{row.rank}</span>
                            <span />
                            <div className="flex items-center gap-1.5">
                              <CarBadge num={row.car_number} size="sm" />
                              <span className="font-body text-sm text-racing-text">{formatDriverName(row.driver_name)}</span>
                            </div>
                            <span className="font-mono text-[12px] text-racing-text text-right">{row.section_time || row.time}</span>
                            <span className="font-mono text-[12px] text-racing-text text-right">{Number(row.section_speed ?? row.speed)?.toFixed(3)}</span>
                            <span className="font-mono text-[12px] text-racing-muted text-right">L{row.lap_number}</span>
                            <span />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: Track map after table */}
        <div className="lg:hidden order-2">
          <TrackMap />
        </div>
      </div>

      {/* Qualifying Sector Comparison */}
      {hasQualSectorData && (
        <div className="space-y-6">
          {/* Mobile: toggle button */}
          {isMobile && !showQualSectors && (
            <button
              onClick={() => setShowQualSectors(true)}
              className="w-full px-4 py-3 bg-racing-surface border border-racing-border rounded font-condensed font-semibold text-[15px] text-racing-muted uppercase flex items-center justify-center gap-2"
            >
              <ChevronDown className="w-4 h-4" />
              Show Qualifying Sectors
            </button>
          )}

          {(!isMobile || showQualSectors) && (
            <div>
              {isMobile && (
                <button
                  onClick={() => setShowQualSectors(false)}
                  className="w-full px-4 py-2 bg-racing-surface border border-racing-border rounded font-condensed font-semibold text-sm text-racing-muted uppercase mb-3 flex items-center justify-center gap-2"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                  Hide Qualifying Sectors
                </button>
              )}

              <h3 className="font-condensed font-semibold text-[15px] text-racing-text uppercase mb-1">Qualifying Sector Comparison</h3>
              <p className="font-mono text-[12px] text-racing-muted mb-3">
                {hasCompleteOvalSectorData
                  ? 'Best sector time across both laps per driver. Yellow = fastest in that sector across the field.'
                  : 'Best section time per driver across all qualifying rounds. Yellow = fastest in that section across the field.'}
              </p>

              {isMobile && (
                <p className="font-mono text-[11px] text-racing-yellow mb-2">← Scroll horizontally to see all sectors →</p>
              )}

              {hasCompleteOvalSectorData ? (isMobile ? (
                <div className="overflow-x-auto -mx-4 px-4 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="min-w-[700px] w-full text-left">
                    <thead>
                      <tr className="border-b border-racing-border">
                        <th className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1.5 py-1.5 sticky left-0 bg-racing-bg z-10">Car</th>
                        <th className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1.5 py-1.5">Best</th>
                        {SECTOR_KEYS.map(sk => (
                          <th key={sk.key} className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1 py-1.5">{sk.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ovalSectorComparison.map(d => {
                        const lap1 = d.laps.find((l: any) => l.lap_number === 1);
                        const lap2 = d.laps.find((l: any) => l.lap_number === 2);
                        const l1Time = lap1?.full_lap_time;
                        const l2Time = lap2?.full_lap_time;
                        const bestTime = l1Time && l2Time ? Math.min(Number(l1Time), Number(l2Time)).toFixed(4) :
                          l1Time ? Number(l1Time).toFixed(4) : '—';
                        return (
                          <tr key={d.car} className="border-b border-racing-border/50">
                            <td className="px-1.5 py-1 sticky left-0 bg-racing-bg z-10">
                              <div className="flex items-center gap-1">
                                <CarBadge size="sm" num={d.car} />
                                <span className="font-body text-[12px] text-racing-text">{d.name.split(' ')[0]}</span>
                              </div>
                            </td>
                            <td className="px-1.5 py-1 font-mono text-[12px] text-racing-yellow font-bold">{bestTime}</td>
                            {SECTOR_KEYS.map(sk => {
                              const v1 = lap1 ? Number(lap1[sk.key as keyof typeof lap1]) : null;
                              const v2 = lap2 ? Number(lap2[sk.key as keyof typeof lap2]) : null;
                              const best = v1 && v2 ? Math.min(v1, v2) : v1 || v2 || null;
                              const isFastest = best !== null && Math.abs(best - bestSectorTimes[sk.key]) < 0.0001;
                              return (
                                <td key={sk.key} className={`px-1 py-1 font-mono text-[12px] ${isFastest ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                                  {best ? best.toFixed(4) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead>
                      <tr className="border-b border-racing-border">
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Pos</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Car</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Driver</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">L1</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">L2</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Best</th>
                        {SECTOR_KEYS.map(sk => (
                          <th key={sk.key} className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1 py-2">{sk.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ovalSectorComparison.map(d => {
                        const lap1 = d.laps.find((l: any) => l.lap_number === 1);
                        const lap2 = d.laps.find((l: any) => l.lap_number === 2);
                        const l1Time = lap1?.full_lap_time;
                        const l2Time = lap2?.full_lap_time;
                        const bestTime = l1Time && l2Time ? Math.min(Number(l1Time), Number(l2Time)).toFixed(4) :
                          l1Time ? Number(l1Time).toFixed(4) : '—';
                        return (
                          <tr key={d.car} className="border-b border-racing-border/50">
                            <td className="px-2 py-1.5 font-heading text-sm text-racing-muted">P{d.qualPos}</td>
                            <td className="px-2 py-1.5"><CarBadge size="sm" num={d.car} /></td>
                            <td className="px-2 py-1.5 font-body text-sm text-racing-text">{d.name.split(' ')[0]}</td>
                            <td className="px-2 py-1.5 font-mono text-[12px] text-racing-text">{l1Time ? Number(l1Time).toFixed(4) : '—'}</td>
                            <td className="px-2 py-1.5 font-mono text-[12px] text-racing-text">{l2Time ? Number(l2Time).toFixed(4) : '—'}</td>
                            <td className="px-2 py-1.5 font-mono text-[12px] text-racing-yellow font-bold">{bestTime}</td>
                            {SECTOR_KEYS.map(sk => {
                              const v1 = lap1 ? Number(lap1[sk.key as keyof typeof lap1]) : null;
                              const v2 = lap2 ? Number(lap2[sk.key as keyof typeof lap2]) : null;
                              const best = v1 && v2 ? Math.min(v1, v2) : v1 || v2 || null;
                              const isFastest = best !== null && Math.abs(best - bestSectorTimes[sk.key]) < 0.0001;
                              return (
                                <td key={sk.key} className={`px-1 py-1.5 font-mono text-[12px] ${isFastest ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                                  {best ? best.toFixed(4) : '—'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )) : (isMobile ? (
                <div className="overflow-x-auto -mx-4 px-4 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="min-w-[600px] w-full text-left">
                    <thead>
                      <tr className="border-b border-racing-border">
                        <th className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1.5 py-1.5 sticky left-0 bg-racing-bg z-10">Car</th>
                        <th className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1.5 py-1.5">Best</th>
                        {roadCourseSectionNames.map((sectionName) => (
                          <th key={sectionName} className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1 py-1.5">{sectionName}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roadCourseSectorComparison.map((driver) => (
                        <tr key={driver.car} className="border-b border-racing-border/50">
                          <td className="px-1.5 py-1 sticky left-0 bg-racing-bg z-10">
                            <div className="flex items-center gap-1">
                              <CarBadge size="sm" num={driver.car} />
                              <span className="font-body text-[12px] text-racing-text">{driver.name.split(' ')[0]}</span>
                            </div>
                          </td>
                          <td className="px-1.5 py-1 font-mono text-[12px] text-racing-yellow font-bold">{driver.bestLapTime || '—'}</td>
                          {roadCourseSectionNames.map((sectionName) => {
                            const row = driver.sections[sectionName];
                            const displayValue = getRoadCourseSectionDisplay(row?.section_time || row?.time);
                            const numericValue = getRoadCourseSectionValue(row?.section_time || row?.time);
                            const isFastest = numericValue !== null && Math.abs(numericValue - bestSectorTimes[sectionName]) < 0.0001;
                            return (
                              <td key={sectionName} className={`px-1 py-1 font-mono text-[12px] ${isFastest ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-racing-border">
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Pos</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Car</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Driver</th>
                        <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-2 py-2">Best</th>
                        {roadCourseSectionNames.map((sectionName) => (
                          <th key={sectionName} className="font-condensed font-semibold text-[12px] text-racing-muted uppercase px-1 py-2">{sectionName}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roadCourseSectorComparison.map((driver) => (
                        <tr key={driver.car} className="border-b border-racing-border/50">
                          <td className="px-2 py-1.5 font-heading text-sm text-racing-muted">P{driver.qualPos}</td>
                          <td className="px-2 py-1.5"><CarBadge size="sm" num={driver.car} /></td>
                          <td className="px-2 py-1.5 font-body text-sm text-racing-text">{driver.name}</td>
                          <td className="px-2 py-1.5 font-mono text-[12px] text-racing-yellow font-bold">{driver.bestLapTime || '—'}</td>
                          {roadCourseSectionNames.map((sectionName) => {
                            const row = driver.sections[sectionName];
                            const displayValue = getRoadCourseSectionDisplay(row?.section_time || row?.time);
                            const numericValue = getRoadCourseSectionValue(row?.section_time || row?.time);
                            const isFastest = numericValue !== null && Math.abs(numericValue - bestSectorTimes[sectionName]) < 0.0001;
                            return (
                              <td key={sectionName} className={`px-1 py-1.5 font-mono text-[12px] ${isFastest ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {hasCompleteOvalSectorData && <div>
                <h3 className="font-condensed font-semibold text-[15px] text-racing-text uppercase mb-2 mt-6">Driver Qualifying Lap Comparison</h3>
                <select
                  value={selectedDriver || ''}
                  onChange={e => setSelectedDriver(e.target.value || null)}
                  className="bg-racing-surface border border-racing-border text-racing-text font-body text-[15px] px-3 py-2 rounded mb-4 w-full sm:w-auto"
                >
                  <option value="">Select a driver…</option>
                  {driversForSelector.map(d => (
                    <option key={d.car} value={d.car}>#{d.car} {d.name}</option>
                  ))}
                </select>

                {driverLapComparison && (
                  isMobile ? (
                    <div className="space-y-1">
                      {SECTOR_KEYS.map(sk => {
                        const v1 = driverLapComparison.lap1 ? Number(driverLapComparison.lap1[sk.key as keyof typeof driverLapComparison.lap1]) : null;
                        const v2 = driverLapComparison.lap2 ? Number(driverLapComparison.lap2[sk.key as keyof typeof driverLapComparison.lap2]) : null;
                        const delta = v1 && v2 ? v2 - v1 : null;
                        return (
                          <div key={sk.key} className="bg-racing-surface rounded px-3 py-2 flex items-center justify-between">
                            <span className="font-condensed text-sm text-racing-text w-20">{sk.label}</span>
                            <span className="font-mono text-[12px] text-racing-text">{v1 ? v1.toFixed(4) : '—'}</span>
                            <span className="font-mono text-[12px] text-racing-text">{v2 ? v2.toFixed(4) : '—'}</span>
                            <span className={`font-mono text-[12px] font-bold w-16 text-right ${
                              delta === null ? 'text-racing-muted' : delta < 0 ? 'text-racing-green' : delta > 0 ? 'text-racing-red' : 'text-racing-muted'
                            }`}>
                              {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : '—'}
                            </span>
                          </div>
                        );
                      })}
                      {(() => {
                        const v1 = driverLapComparison.lap1 ? Number(driverLapComparison.lap1.full_lap_time) : null;
                        const v2 = driverLapComparison.lap2 ? Number(driverLapComparison.lap2.full_lap_time) : null;
                        const delta = v1 && v2 ? v2 - v1 : null;
                        return (
                          <div className="bg-racing-surface2 rounded px-3 py-2 flex items-center justify-between border-t-2 border-racing-border">
                            <span className="font-condensed text-sm text-racing-yellow font-bold w-20">Full Lap</span>
                            <span className="font-mono text-[12px] text-racing-yellow">{v1 ? v1.toFixed(4) : '—'}</span>
                            <span className="font-mono text-[12px] text-racing-yellow">{v2 ? v2.toFixed(4) : '—'}</span>
                            <span className={`font-mono text-[12px] font-bold w-16 text-right ${
                              delta === null ? 'text-racing-muted' : delta < 0 ? 'text-racing-green' : delta > 0 ? 'text-racing-red' : 'text-racing-muted'
                            }`}>
                              {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : '—'}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="flex justify-between px-3 mt-1">
                        <span className="font-mono text-[11px] text-racing-muted">Sector</span>
                        <span className="font-mono text-[11px] text-racing-muted">L1</span>
                        <span className="font-mono text-[11px] text-racing-muted">L2</span>
                        <span className="font-mono text-[11px] text-racing-muted w-16 text-right">Delta</span>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px] text-left">
                        <thead>
                          <tr className="border-b border-racing-border">
                            <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-3 py-2">Sector</th>
                            <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-3 py-2">Lap 1</th>
                            <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-3 py-2">Lap 2</th>
                            <th className="font-condensed font-semibold text-sm text-racing-muted uppercase px-3 py-2">Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {SECTOR_KEYS.map(sk => {
                            const v1 = driverLapComparison.lap1 ? Number(driverLapComparison.lap1[sk.key as keyof typeof driverLapComparison.lap1]) : null;
                            const v2 = driverLapComparison.lap2 ? Number(driverLapComparison.lap2[sk.key as keyof typeof driverLapComparison.lap2]) : null;
                            const delta = v1 && v2 ? v2 - v1 : null;
                            return (
                              <tr key={sk.key} className="border-b border-racing-border/50">
                                <td className="px-3 py-2 font-condensed text-sm text-racing-text">{sk.label}</td>
                                <td className="px-3 py-2 font-mono text-sm text-racing-text">{v1 ? v1.toFixed(4) : '—'}</td>
                                <td className="px-3 py-2 font-mono text-sm text-racing-text">{v2 ? v2.toFixed(4) : '—'}</td>
                                <td className={`px-3 py-2 font-mono text-sm font-bold ${
                                  delta === null ? 'text-racing-muted' : delta < 0 ? 'text-racing-green' : delta > 0 ? 'text-racing-red' : 'text-racing-muted'
                                }`}>
                                  {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                          {(() => {
                            const v1 = driverLapComparison.lap1 ? Number(driverLapComparison.lap1.full_lap_time) : null;
                            const v2 = driverLapComparison.lap2 ? Number(driverLapComparison.lap2.full_lap_time) : null;
                            const delta = v1 && v2 ? v2 - v1 : null;
                            return (
                              <tr className="border-t-2 border-racing-border bg-racing-surface/50">
                                <td className="px-3 py-2 font-condensed text-sm text-racing-yellow font-bold">Full Lap</td>
                                <td className="px-3 py-2 font-mono text-sm text-racing-yellow">{v1 ? v1.toFixed(4) : '—'}</td>
                                <td className="px-3 py-2 font-mono text-sm text-racing-yellow">{v2 ? v2.toFixed(4) : '—'}</td>
                                <td className={`px-3 py-2 font-mono text-sm font-bold ${
                                  delta === null ? 'text-racing-muted' : delta < 0 ? 'text-racing-green' : delta > 0 ? 'text-racing-red' : 'text-racing-muted'
                                }`}>
                                  {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : '—'}
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackDominanceTab;
