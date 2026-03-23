import { useState, useMemo } from 'react';
import { useRaceContext } from '@/pages/Index';
import { useFastestLaps, useFastestLapSections } from '@/hooks/useRaceData';
import { useQualifyingSectors, useQualifyingResults } from '@/hooks/useSessionData';
import { formatDriverName } from '@/lib/formatName';
import { useIsMobile } from '@/hooks/use-mobile';

const CarBadge = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const CarBadgeSm = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-[10px] w-6 h-5 rounded-sm">{num}</span>
);

const SESSION_OPTIONS = [
  { value: 'Race', label: 'Race' },
  { value: 'Practice 1', label: 'Practice 1' },
  { value: 'Practice Final', label: 'Practice Final' },
  { value: 'Qualifying', label: 'Qualifying' },
];

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

const FastestLapsTab = () => {
  const { raceId } = useRaceContext();
  const [sessionType, setSessionType] = useState('Race');
  const [selectedSection, setSelectedSection] = useState('Lap');
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data: sections } = useFastestLapSections(raceId, sessionType);
  const { data: laps } = useFastestLaps(raceId, selectedSection, sessionType);
  const { data: qualSectors } = useQualifyingSectors(raceId);
  const { data: qualResults } = useQualifyingResults(raceId);

  const sectionOptions = sections?.map(s => ({
    name: s.section_name,
    distance: s.section_length_miles ? `${Number(s.section_length_miles).toFixed(3)} mi` : '',
  })) || [];

  const sectorComparison = useMemo(() => {
    if (!qualSectors || !qualResults) return [];
    const driverMap = new Map<string, { car: string; name: string; qualPos: number; laps: any[] }>();
    for (const qs of qualSectors) {
      if (!driverMap.has(qs.car_number)) {
        const qr = qualResults.find(q => q.car_number === qs.car_number);
        driverMap.set(qs.car_number, { car: qs.car_number, name: formatDriverName(qs.driver_name), qualPos: qr?.qual_position || 99, laps: [] });
      }
      driverMap.get(qs.car_number)!.laps.push(qs);
    }
    return Array.from(driverMap.values()).sort((a, b) => a.qualPos - b.qualPos);
  }, [qualSectors, qualResults]);

  const bestSectorTimes = useMemo(() => {
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
  }, [qualSectors]);

  const driverLapComparison = useMemo(() => {
    if (!selectedDriver || !qualSectors) return null;
    const driverSectors = qualSectors.filter(s => s.car_number === selectedDriver);
    const lap1 = driverSectors.find(s => s.lap_number === 1);
    const lap2 = driverSectors.find(s => s.lap_number === 2);
    if (!lap1) return null;
    return { lap1, lap2 };
  }, [selectedDriver, qualSectors]);

  const driversForSelector = sectorComparison.map(d => ({ car: d.car, name: d.name }));

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Fastest Laps</h2>

      {/* Session selector */}
      <div className="flex flex-wrap gap-2">
        {SESSION_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => { setSessionType(opt.value); setSelectedSection('Lap'); }}
            className={`px-3 py-1.5 rounded text-xs font-condensed font-semibold uppercase transition-all ${
              sessionType === opt.value
                ? 'bg-racing-yellow/10 text-racing-yellow border border-racing-yellow/30'
                : 'bg-racing-surface text-racing-muted border border-racing-border hover:text-racing-text'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Section dropdown */}
      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Track Section Breakdown</h3>
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded mb-4 w-full sm:w-auto"
        >
          {sectionOptions.map(s => (
            <option key={s.name} value={s.name}>{s.name} {s.distance ? `(${s.distance})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Rankings — cards on mobile, table on desktop */}
      {isMobile ? (
        <div className="space-y-1.5">
          {laps?.map(f => (
            <div key={f.id} className="bg-racing-surface rounded p-3 flex items-center gap-2.5">
              <span className="font-heading text-sm text-racing-muted w-5 shrink-0">{f.rank}</span>
              <CarBadge num={f.car_number} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm text-racing-text">{formatDriverName(f.driver_name)}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="font-mono text-[10px] text-racing-text">{f.section_time}{selectedSection !== 'Full Lap' ? 's' : ''}</span>
                  <span className="font-mono text-[10px] text-racing-yellow">{Number(f.section_speed)?.toFixed(3)} mph</span>
                  <span className="font-mono text-[10px] text-racing-muted">L{f.lap_number}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-racing-border">
                {['Rank','Car','Driver','Time','Speed','Lap'].map(h => (
                  <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laps?.map(f => (
                <tr key={f.id} className="border-b border-racing-border/50">
                  <td className="px-3 py-2 font-heading text-sm text-racing-muted">{f.rank}</td>
                  <td className="px-3 py-2"><CarBadge num={f.car_number} /></td>
                  <td className="px-3 py-2 font-body text-sm text-racing-text">{formatDriverName(f.driver_name)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-text">{f.section_time}{selectedSection !== 'Lap' ? 's' : ''}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{Number(f.section_speed)?.toFixed(3)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-muted">L{f.lap_number}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Qualifying Sector Comparison */}
      {sessionType === 'Qualifying' && sectorComparison.length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-1">Qualifying Sector Comparison</h3>
            <p className="font-mono text-[10px] text-racing-muted mb-3">Best sector time across both laps per driver. Yellow = fastest in that sector across the field.</p>
            {isMobile ? (
              <div className="space-y-2">
                {sectorComparison.map(d => {
                  const lap1 = d.laps.find((l: any) => l.lap_number === 1);
                  const lap2 = d.laps.find((l: any) => l.lap_number === 2);
                  const l1Time = lap1?.full_lap_time;
                  const l2Time = lap2?.full_lap_time;
                  const bestTime = l1Time && l2Time ? Math.min(Number(l1Time), Number(l2Time)).toFixed(4) :
                    l1Time ? Number(l1Time).toFixed(4) : '—';
                  return (
                    <div key={d.car} className="bg-racing-surface rounded p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-heading text-xs text-racing-muted">P{d.qualPos}</span>
                        <CarBadgeSm num={d.car} />
                        <span className="font-body text-xs text-racing-text flex-1">{d.name}</span>
                        <span className="font-mono text-[10px] text-racing-yellow font-bold">{bestTime}</span>
                      </div>
                      <div className="flex gap-2 text-[9px] font-mono text-racing-muted mb-1.5">
                        <span>L1: {l1Time ? Number(l1Time).toFixed(4) : '—'}</span>
                        <span>L2: {l2Time ? Number(l2Time).toFixed(4) : '—'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
                        {SECTOR_KEYS.map(sk => {
                          const v1 = lap1 ? Number(lap1[sk.key as keyof typeof lap1]) : null;
                          const v2 = lap2 ? Number(lap2[sk.key as keyof typeof lap2]) : null;
                          const best = v1 && v2 ? Math.min(v1, v2) : v1 || v2 || null;
                          const isFastest = best !== null && Math.abs(best - bestSectorTimes[sk.key]) < 0.0001;
                          return (
                            <div key={sk.key} className="flex justify-between">
                              <span className="text-[9px] text-racing-muted">{sk.label}</span>
                              <span className={`text-[9px] font-mono ${isFastest ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                                {best ? best.toFixed(4) : '—'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-racing-border">
                      <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">Pos</th>
                      <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">Car</th>
                      <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">Driver</th>
                      <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">L1</th>
                      <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">L2</th>
                      <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">Best</th>
                      {SECTOR_KEYS.map(sk => (
                        <th key={sk.key} className="font-condensed font-semibold text-[10px] text-racing-muted uppercase px-1 py-2">{sk.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectorComparison.map(d => {
                      const lap1 = d.laps.find((l: any) => l.lap_number === 1);
                      const lap2 = d.laps.find((l: any) => l.lap_number === 2);
                      const l1Time = lap1?.full_lap_time;
                      const l2Time = lap2?.full_lap_time;
                      const bestTime = l1Time && l2Time ? Math.min(Number(l1Time), Number(l2Time)).toFixed(4) :
                        l1Time ? Number(l1Time).toFixed(4) : '—';
                      return (
                        <tr key={d.car} className="border-b border-racing-border/50">
                          <td className="px-2 py-1.5 font-heading text-xs text-racing-muted">P{d.qualPos}</td>
                          <td className="px-2 py-1.5"><CarBadgeSm num={d.car} /></td>
                          <td className="px-2 py-1.5 font-body text-xs text-racing-text">{d.name.split(' ')[0]}</td>
                          <td className="px-2 py-1.5 font-mono text-[10px] text-racing-text">{l1Time ? Number(l1Time).toFixed(4) : '—'}</td>
                          <td className="px-2 py-1.5 font-mono text-[10px] text-racing-text">{l2Time ? Number(l2Time).toFixed(4) : '—'}</td>
                          <td className="px-2 py-1.5 font-mono text-[10px] text-racing-yellow font-bold">{bestTime}</td>
                          {SECTOR_KEYS.map(sk => {
                            const v1 = lap1 ? Number(lap1[sk.key as keyof typeof lap1]) : null;
                            const v2 = lap2 ? Number(lap2[sk.key as keyof typeof lap2]) : null;
                            const best = v1 && v2 ? Math.min(v1, v2) : v1 || v2 || null;
                            const isFastest = best !== null && Math.abs(best - bestSectorTimes[sk.key]) < 0.0001;
                            return (
                              <td key={sk.key} className={`px-1 py-1.5 font-mono text-[10px] ${isFastest ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
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
            )}
          </div>

          {/* Driver Lap-by-Lap Sector Comparison */}
          <div>
            <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Driver Qualifying Lap Comparison</h3>
            <select
              value={selectedDriver || ''}
              onChange={e => setSelectedDriver(e.target.value || null)}
              className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded mb-4 w-full sm:w-auto"
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
                        <span className="font-condensed text-xs text-racing-text w-20">{sk.label}</span>
                        <span className="font-mono text-[10px] text-racing-text">{v1 ? v1.toFixed(4) : '—'}</span>
                        <span className="font-mono text-[10px] text-racing-text">{v2 ? v2.toFixed(4) : '—'}</span>
                        <span className={`font-mono text-[10px] font-bold w-16 text-right ${
                          delta === null ? 'text-racing-muted' : delta < 0 ? 'text-racing-green' : delta > 0 ? 'text-racing-red' : 'text-racing-muted'
                        }`}>
                          {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : '—'}
                        </span>
                      </div>
                    );
                  })}
                  {/* Full Lap row */}
                  {(() => {
                    const v1 = driverLapComparison.lap1 ? Number(driverLapComparison.lap1.full_lap_time) : null;
                    const v2 = driverLapComparison.lap2 ? Number(driverLapComparison.lap2.full_lap_time) : null;
                    const delta = v1 && v2 ? v2 - v1 : null;
                    return (
                      <div className="bg-racing-surface2 rounded px-3 py-2 flex items-center justify-between border-t-2 border-racing-border">
                        <span className="font-condensed text-xs text-racing-yellow font-bold w-20">Full Lap</span>
                        <span className="font-mono text-[10px] text-racing-yellow">{v1 ? v1.toFixed(4) : '—'}</span>
                        <span className="font-mono text-[10px] text-racing-yellow">{v2 ? v2.toFixed(4) : '—'}</span>
                        <span className={`font-mono text-[10px] font-bold w-16 text-right ${
                          delta === null ? 'text-racing-muted' : delta < 0 ? 'text-racing-green' : delta > 0 ? 'text-racing-red' : 'text-racing-muted'
                        }`}>
                          {delta !== null ? `${delta > 0 ? '+' : ''}${delta.toFixed(4)}` : '—'}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="flex justify-between px-3 mt-1">
                    <span className="font-mono text-[9px] text-racing-muted">Sector</span>
                    <span className="font-mono text-[9px] text-racing-muted">L1</span>
                    <span className="font-mono text-[9px] text-racing-muted">L2</span>
                    <span className="font-mono text-[9px] text-racing-muted w-16 text-right">Delta</span>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-racing-border">
                        <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">Sector</th>
                        <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">Lap 1</th>
                        <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">Lap 2</th>
                        <th className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SECTOR_KEYS.map(sk => {
                        const v1 = driverLapComparison.lap1 ? Number(driverLapComparison.lap1[sk.key as keyof typeof driverLapComparison.lap1]) : null;
                        const v2 = driverLapComparison.lap2 ? Number(driverLapComparison.lap2[sk.key as keyof typeof driverLapComparison.lap2]) : null;
                        const delta = v1 && v2 ? v2 - v1 : null;
                        return (
                          <tr key={sk.key} className="border-b border-racing-border/50">
                            <td className="px-3 py-2 font-condensed text-xs text-racing-text">{sk.label}</td>
                            <td className="px-3 py-2 font-mono text-xs text-racing-text">{v1 ? v1.toFixed(4) : '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-racing-text">{v2 ? v2.toFixed(4) : '—'}</td>
                            <td className={`px-3 py-2 font-mono text-xs font-bold ${
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
                            <td className="px-3 py-2 font-condensed text-xs text-racing-yellow font-bold">Full Lap</td>
                            <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{v1 ? v1.toFixed(4) : '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{v2 ? v2.toFixed(4) : '—'}</td>
                            <td className={`px-3 py-2 font-mono text-xs font-bold ${
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
          </div>
        </div>
      )}
    </div>
  );
};

export default FastestLapsTab;
