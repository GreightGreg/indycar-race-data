import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { drivers, driverMap, raceResults, fastestLaps, lapsLedStats, DRIVER_COLORS, CAUTION_RANGES, generatePositionChartData } from '@/data/raceData';

const getDriverStats = (carNum: number) => {
  const result = raceResults.find(r => r.car === carNum);
  const fl = fastestLaps.find(f => f.car === carNum);
  const ll = lapsLedStats.find(l => l.car === carNum);
  const d = driverMap[carNum];
  if (!result || !d) return null;
  return {
    pos: result.pos, sp: result.sp, posGained: result.sp - result.pos,
    laps: result.laps, lapsLed: ll?.lapsLed || 0, pits: result.pits,
    avgSpeed: result.avgSpeed, bestLapTime: fl?.time || 'N/A',
    bestLapSpeed: fl?.speed || 0, bestLapNum: fl?.lap || 0,
    racePts: result.racePts, champRank: result.champRank, engine: d.engine,
  };
};

const StatRow = ({ label, v1, v2, highlight }: { label: string; v1: string; v2: string; highlight: 'left' | 'right' | 'none' }) => (
  <div className="flex items-center py-1.5 border-b border-racing-border/30">
    <span className={`flex-1 text-right font-mono text-xs ${highlight === 'left' ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>{v1}{highlight === 'left' && ' ◀'}</span>
    <span className="w-32 text-center font-condensed text-[10px] text-racing-muted uppercase px-2">{label}</span>
    <span className={`flex-1 font-mono text-xs ${highlight === 'right' ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>{highlight === 'right' && '▶ '}{v2}</span>
  </div>
);

const HeadToHeadTab = () => {
  const [car1, setCar1] = useState(2);
  const [car2, setCar2] = useState(27);
  const chartData = useMemo(() => generatePositionChartData(), []);

  const s1 = getDriverStats(car1);
  const s2 = getDriverStats(car2);
  const d1 = driverMap[car1];
  const d2 = driverMap[car2];

  if (!s1 || !s2 || !d1 || !d2) return <p className="text-racing-muted">Select two drivers</p>;

  const comparisons: { label: string; v1: string; v2: string; lowerWins?: boolean }[] = [
    { label: 'Finish Position', v1: `P${s1.pos}`, v2: `P${s2.pos}`, lowerWins: true },
    { label: 'Starting Position', v1: `SP${s1.sp}`, v2: `SP${s2.sp}`, lowerWins: true },
    { label: 'Positions Gained', v1: `${s1.posGained > 0 ? '+' : ''}${s1.posGained}`, v2: `${s2.posGained > 0 ? '+' : ''}${s2.posGained}` },
    { label: 'Laps Completed', v1: `${s1.laps}`, v2: `${s2.laps}` },
    { label: 'Laps Led', v1: `${s1.lapsLed}`, v2: `${s2.lapsLed}` },
    { label: 'Pit Stops', v1: `${s1.pits}`, v2: `${s2.pits}`, lowerWins: true },
    { label: 'Avg Speed', v1: `${s1.avgSpeed.toFixed(3)} mph`, v2: `${s2.avgSpeed.toFixed(3)} mph` },
    { label: 'Best Lap Time', v1: s1.bestLapTime, v2: s2.bestLapTime, lowerWins: true },
    { label: 'Best Lap Speed', v1: `${s1.bestLapSpeed.toFixed(3)} mph`, v2: `${s2.bestLapSpeed.toFixed(3)} mph` },
    { label: 'Best Lap Number', v1: `L${s1.bestLapNum}`, v2: `L${s2.bestLapNum}` },
    { label: 'Race Points', v1: `${s1.racePts} pts`, v2: `${s2.racePts} pts` },
    { label: 'Championship Rank', v1: `Rank ${s1.champRank}`, v2: `Rank ${s2.champRank}`, lowerWins: true },
    { label: 'Engine', v1: s1.engine, v2: s2.engine },
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

      {/* Driver Selectors */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <select value={car1} onChange={e => setCar1(Number(e.target.value))} className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded">
          {drivers.map(d => <option key={d.num} value={d.num}>#{d.num} {d.first} {d.last}</option>)}
        </select>
        <span className="font-heading text-xl text-racing-muted">VS</span>
        <select value={car2} onChange={e => setCar2(Number(e.target.value))} className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded">
          {drivers.map(d => <option key={d.num} value={d.num}>#{d.num} {d.first} {d.last}</option>)}
        </select>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <div className="bg-racing-surface rounded p-4 text-center">
          <span className="font-heading text-5xl" style={{ color: DRIVER_COLORS[car1] }}>#{car1}</span>
          <p className="font-body text-sm text-racing-text mt-2">{d1.first} {d1.last}</p>
        </div>
        <div className="hidden md:flex items-center justify-center">
          <span className="font-heading text-3xl text-racing-muted">VS</span>
        </div>
        <div className="bg-racing-surface rounded p-4 text-center">
          <span className="font-heading text-5xl" style={{ color: DRIVER_COLORS[car2] }}>#{car2}</span>
          <p className="font-body text-sm text-racing-text mt-2">{d2.first} {d2.last}</p>
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="bg-racing-surface rounded p-4 max-w-2xl mx-auto">
        {comparisons.map(c => (
          <StatRow key={c.label} label={c.label} v1={c.v1} v2={c.v2} highlight={getHighlight(c)} />
        ))}
      </div>

      {/* Dual Position Chart */}
      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Position Comparison</h3>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
              <XAxis dataKey="lap" type="number" domain={[1, 250]} tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }} />
              <YAxis reversed domain={[1, 25]} tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }} />
              {CAUTION_RANGES.map(([s, e], i) => (
                <ReferenceArea key={i} x1={s} x2={e} fill="#e8ff00" fillOpacity={0.08} />
              ))}
              <Tooltip
                contentStyle={{ backgroundColor: '#0d1620', border: '1px solid #1e2e40', borderRadius: 4 }}
                labelFormatter={v => `Lap ${v}`}
                formatter={(value: number, name: string) => {
                  const cn = parseInt(name.replace('car', ''));
                  return [`P${Math.round(value)}`, `#${cn} ${driverMap[cn]?.last}`];
                }}
              />
              <Line type="linear" dataKey={`car${car1}`} stroke={DRIVER_COLORS[car1]} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              <Line type="linear" dataKey={`car${car2}`} stroke={DRIVER_COLORS[car2]} strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HeadToHeadTab;
