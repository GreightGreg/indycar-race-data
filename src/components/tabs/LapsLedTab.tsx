import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { lapsLedStats, leaderSequence, DRIVER_COLORS, driverMap } from '@/data/raceData';

const CarBadge = ({ num }: { num: number }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const LapsLedTab = () => {
  const barData = useMemo(() =>
    lapsLedStats.map(d => ({
      name: `#${d.car} ${driverMap[d.car]?.last || ''}`,
      car: d.car,
      lapsLed: d.lapsLed,
    })),
  []);

  const totalLaps = 250;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Laps Led</h2>

      {/* Bar Chart */}
      <div style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
            <XAxis type="number" domain={[0, 250]} tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#dce8f0', fontSize: 12, fontFamily: 'Barlow' }} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1620', border: '1px solid #1e2e40', borderRadius: 4 }}
              labelStyle={{ color: '#dce8f0', fontFamily: 'Barlow' }}
              formatter={(v: number) => [`${v} laps`, 'Laps Led']}
            />
            <Bar dataKey="lapsLed" radius={[0, 4, 4, 0]}>
              {barData.map((d, i) => (
                <Cell key={i} fill={DRIVER_COLORS[d.car] || '#888'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leader Sequence Timeline */}
      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Leader Sequence</h3>
        <div className="flex h-10 rounded overflow-hidden border border-racing-border">
          {leaderSequence.map((seg, i) => {
            const width = ((seg.endLap - seg.startLap + 1) / totalLaps) * 100;
            const isCaution = seg.car === -1;
            const bg = isCaution ? '#e8ff00' : (DRIVER_COLORS[seg.car] || '#888');
            const showLabel = width > 3;
            return (
              <div
                key={i}
                className="relative flex items-center justify-center overflow-hidden"
                style={{ width: `${width}%`, backgroundColor: bg, opacity: isCaution ? 0.4 : 1 }}
                title={isCaution ? `Caution L${seg.startLap}-${seg.endLap}` : `#${seg.car} L${seg.startLap}-${seg.endLap}`}
              >
                {showLabel && (
                  <span className="font-heading text-[10px] text-white drop-shadow-sm">
                    {isCaution ? 'C' : `#${seg.car}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-racing-muted">Lap 1</span>
          <span className="font-mono text-[10px] text-racing-muted">Lap 250</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-blue">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Laps Led</p>
          <p className="font-heading text-xl text-racing-yellow">Malukas #12</p>
          <p className="font-mono text-[10px] text-racing-muted">73 laps</p>
        </div>
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-yellow">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Lead Stints</p>
          <p className="font-heading text-xl text-racing-yellow">Rasmussen #21</p>
          <p className="font-mono text-[10px] text-racing-muted">5 stints</p>
        </div>
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-blue">
          <p className="font-condensed text-xs text-racing-muted uppercase">Longest Consecutive Lead</p>
          <p className="font-heading text-xl text-racing-yellow">Malukas #12</p>
          <p className="font-mono text-[10px] text-racing-muted">72 laps (Laps 1–72)</p>
        </div>
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-yellow">
          <p className="font-condensed text-xs text-racing-muted uppercase">Total Drivers Who Led</p>
          <p className="font-heading text-3xl text-racing-yellow">11</p>
          <p className="font-mono text-[10px] text-racing-muted">drivers</p>
        </div>
      </div>
    </div>
  );
};

export default LapsLedTab;
