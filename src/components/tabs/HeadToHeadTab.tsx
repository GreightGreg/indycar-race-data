import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useRaceContext } from '@/contexts/RaceContext';
import { useRaceResults, useLapsLed, useFastestLaps, useRacePositions, useCautions, DRIVER_COLORS } from '@/hooks/useRaceData';
import { formatDriverName } from '@/lib/formatName';
import EngineIcon from '@/components/racing/EngineIcon';
import CarBadge from '@/components/racing/CarBadge';
import { buildLapsLedStats } from '@/lib/raceStats';

const StatRow = ({ label, v1, v2, highlight, isEngine }: { label: string; v1: string; v2: string; highlight: 'left' | 'right' | 'none'; isEngine?: boolean }) => (
  <div className="flex items-center py-1.5 border-b border-racing-border/30">
    <span className={`flex-1 text-right font-mono text-xs ${highlight === 'left' ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
      {isEngine ? <span className="inline-flex justify-end w-full"><EngineIcon engine={v1} /></span> : <>{v1}{highlight === 'left' && ' ◀'}</>}
    </span>
    <span className="w-32 text-center font-condensed text-[10px] text-racing-muted uppercase px-2">{label}</span>
    <span className={`flex-1 font-mono text-xs ${highlight === 'right' ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
      {isEngine ? <EngineIcon engine={v2} /> : <>{highlight === 'right' && '▶ '}{v2}</>}
    </span>
  </div>
);

const HeadToHeadTab = () => {
  const { raceId } = useRaceContext();
  const { data: results } = useRaceResults(raceId);
  const { data: lapsLedData } = useLapsLed(raceId);
  const { data: fastestLapsData } = useFastestLaps(raceId, 'Lap');
  const { data: positions } = useRacePositions(raceId);
  const { data: cautions } = useCautions(raceId);

  const [car1, setCar1] = useState('2');
  const [car2, setCar2] = useState('27');

  const drivers = useMemo(() => results?.map(r => ({ num: r.car_number, name: formatDriverName(r.driver_name) })) || [], [results]);
  const derivedLapsLed = useMemo(() => buildLapsLedStats(positions, results), [positions, results]);
  const lapsLedLookup = useMemo(() => {
    const source = lapsLedData?.length ? lapsLedData : derivedLapsLed;
    return new Map(source.map((row) => [row.car_number, row]));
  }, [derivedLapsLed, lapsLedData]);

  useMemo(() => {
    if (drivers.length >= 2 && !drivers.find(d => d.num === car1)) {
      setCar1(drivers[0].num);
      setCar2(drivers[1].num);
    }
  }, [drivers]);

  const getStats = (carNum: string) => {
    const r = results?.find(r => r.car_number === carNum);
    const fl = fastestLapsData?.find(f => f.car_number === carNum);
    const ll = lapsLedLookup.get(carNum);
    if (!r) return null;
    return {
      pos: r.finish_position, sp: r.start_position, posGained: r.start_position - r.finish_position,
      laps: r.laps_completed, lapsLed: ll?.laps_led || 0, pits: r.pit_stops,
      avgSpeed: Number(r.avg_speed), bestLapTime: fl?.section_time || fl?.time || 'N/A',
      bestLapSpeed: Number(fl?.section_speed ?? fl?.speed) || 0, bestLapNum: fl?.lap_number || 0,
      racePts: r.race_points, champRank: r.championship_rank, engine: r.engine,
    };
  };

  const s1 = getStats(car1);
  const s2 = getStats(car2);
  // Build chart data from positions (moved before early return)
  const chartData = useMemo(() => {
    if (!positions?.length) return [];
    const byLap: Record<number, Record<string, number>> = {};
    for (const p of positions) {
      if (p.car_number !== car1 && p.car_number !== car2) continue;
      if (!byLap[p.lap_number]) byLap[p.lap_number] = {};
      byLap[p.lap_number][`car${p.car_number}`] = p.position;
    }
    return Object.entries(byLap).map(([lap, data]) => ({ lap: Number(lap), ...data })).sort((a, b) => a.lap - b.lap);
  }, [positions, car1, car2]);

  const cautionRanges: [number, number][] = (cautions || []).map(c => [c.start_lap, c.end_lap]);

  if (!s1 || !s2) return <p className="text-racing-muted font-body">Loading…</p>;

  const comparisons = [
    { label: 'Finish Position', v1: `P${s1.pos}`, v2: `P${s2.pos}`, lowerWins: true },
    { label: 'Starting Position', v1: `SP${s1.sp}`, v2: `SP${s2.sp}`, lowerWins: true },
    { label: 'Positions Gained', v1: `${s1.posGained > 0 ? '+' : ''}${s1.posGained}`, v2: `${s2.posGained > 0 ? '+' : ''}${s2.posGained}` },
    { label: 'Laps Completed', v1: `${s1.laps}`, v2: `${s2.laps}` },
    { label: 'Laps Led', v1: `${s1.lapsLed}`, v2: `${s2.lapsLed}` },
    { label: 'Pit Stops', v1: `${s1.pits}`, v2: `${s2.pits}`, lowerWins: true },
    { label: 'Avg Speed', v1: `${s1.avgSpeed.toFixed(3)} mph`, v2: `${s2.avgSpeed.toFixed(3)} mph` },
    { label: 'Best Lap Time', v1: s1.bestLapTime || '', v2: s2.bestLapTime || '', lowerWins: true },
    { label: 'Best Lap Speed', v1: `${s1.bestLapSpeed.toFixed(3)} mph`, v2: `${s2.bestLapSpeed.toFixed(3)} mph` },
    { label: 'Best Lap Number', v1: `L${s1.bestLapNum}`, v2: `L${s2.bestLapNum}` },
    { label: 'Race Points', v1: `${s1.racePts} pts`, v2: `${s2.racePts} pts` },
    { label: 'Championship Rank', v1: `Rank ${s1.champRank}`, v2: `Rank ${s2.champRank}`, lowerWins: true },
    { label: 'Engine', v1: s1.engine, v2: s2.engine, isEngine: true },
  ];

  const getHighlight = (c: typeof comparisons[0]): 'left' | 'right' | 'none' => {
    const n1 = parseFloat(c.v1.replace(/[^0-9.\-]/g, ''));
    const n2 = parseFloat(c.v2.replace(/[^0-9.\-]/g, ''));
    if (isNaN(n1) || isNaN(n2) || n1 === n2) return 'none';
    if (c.lowerWins) return n1 < n2 ? 'left' : 'right';
    return n1 > n2 ? 'left' : 'right';
  };



  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Head to Head</h2>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <select value={car1} onChange={e => setCar1(e.target.value)} className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded">
          {drivers.map(d => <option key={d.num} value={d.num}>#{d.num} {d.name}</option>)}
        </select>
        <span className="font-heading text-xl text-racing-muted">VS</span>
        <select value={car2} onChange={e => setCar2(e.target.value)} className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded">
          {drivers.map(d => <option key={d.num} value={d.num}>#{d.num} {d.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-4 items-center">
        <div className="bg-racing-surface rounded p-3 sm:p-4 text-center">
          <span className="font-heading text-3xl sm:text-5xl" style={{ color: DRIVER_COLORS[car1] }}>#{car1}</span>
          <p className="font-body text-xs sm:text-sm text-racing-text mt-1 sm:mt-2">{drivers.find(d => d.num === car1)?.name}</p>
        </div>
        <div className="flex items-center justify-center"><span className="font-heading text-xl sm:text-3xl text-racing-muted">VS</span></div>
        <div className="bg-racing-surface rounded p-3 sm:p-4 text-center">
          <span className="font-heading text-3xl sm:text-5xl" style={{ color: DRIVER_COLORS[car2] }}>#{car2}</span>
          <p className="font-body text-xs sm:text-sm text-racing-text mt-1 sm:mt-2">{drivers.find(d => d.num === car2)?.name}</p>
        </div>
      </div>

      <div className="bg-racing-surface rounded p-4 max-w-2xl mx-auto">
        {comparisons.map(c => <StatRow key={c.label} label={c.label} v1={c.v1} v2={c.v2} highlight={getHighlight(c)} isEngine={(c as any).isEngine} />)}
      </div>

      {chartData.length > 0 && (
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Position Comparison</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <XAxis dataKey="lap" type="number" tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }} />
                <YAxis reversed domain={[1, 25]} tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }} />
                {cautionRanges.map(([s, e], i) => <ReferenceArea key={i} x1={s} x2={e} fill="#e8ff00" fillOpacity={0.08} />)}
                <Tooltip contentStyle={{ backgroundColor: '#0d1620', border: '1px solid #1e2e40', borderRadius: 4 }} labelFormatter={v => `Lap ${v}`} />
                <Line type="linear" dataKey={`car${car1}`} stroke={DRIVER_COLORS[car1]} strokeWidth={2.5} dot={false} isAnimationActive={false} name={`#${car1}`} />
                <Line type="linear" dataKey={`car${car2}`} stroke={DRIVER_COLORS[car2]} strokeWidth={2.5} dot={false} isAnimationActive={false} name={`#${car2}`} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadToHeadTab;
