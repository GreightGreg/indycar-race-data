import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRaceContext } from '@/pages/Index';
import { useLapsLed, useRaceDetails, DRIVER_COLORS } from '@/hooks/useRaceData';

const LapsLedTab = () => {
  const { raceId } = useRaceContext();
  const { data: lapsLedData } = useLapsLed(raceId);
  const { data: race } = useRaceDetails(raceId);

  const barData = useMemo(() =>
    (lapsLedData || []).map(d => ({
      name: `#${d.car_number} ${d.driver_name?.split(' ')[0] || ''}`,
      car: d.car_number,
      lapsLed: d.laps_led,
    })),
  [lapsLedData]);

  if (!lapsLedData?.length) return <p className="text-racing-muted font-body">Loading…</p>;

  const totalLaps = race?.total_laps || 250;
  const mostLaps = lapsLedData.reduce((a, b) => a.laps_led > b.laps_led ? a : b);
  const mostStints = lapsLedData.reduce((a, b) => a.stints > b.stints ? a : b);
  const longestConsec = lapsLedData.reduce((a, b) => a.longest_consecutive > b.longest_consecutive ? a : b);

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Laps Led</h2>

      <div style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
            <XAxis type="number" domain={[0, totalLaps]} tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#dce8f0', fontSize: 12, fontFamily: 'Barlow' }} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1620', border: '1px solid #1e2e40', borderRadius: 4 }}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-blue">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Laps Led</p>
          <p className="font-heading text-xl text-racing-yellow">{mostLaps.driver_name?.split(' ')[0]} #{mostLaps.car_number}</p>
          <p className="font-mono text-[10px] text-racing-muted">{mostLaps.laps_led} laps</p>
        </div>
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-yellow">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Lead Stints</p>
          <p className="font-heading text-xl text-racing-yellow">{mostStints.driver_name?.split(' ')[0]} #{mostStints.car_number}</p>
          <p className="font-mono text-[10px] text-racing-muted">{mostStints.stints} stints</p>
        </div>
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-blue">
          <p className="font-condensed text-xs text-racing-muted uppercase">Longest Consecutive Lead</p>
          <p className="font-heading text-xl text-racing-yellow">{longestConsec.driver_name?.split(' ')[0]} #{longestConsec.car_number}</p>
          <p className="font-mono text-[10px] text-racing-muted">{longestConsec.longest_consecutive} laps (Laps {longestConsec.start_lap_of_longest}–{(longestConsec.start_lap_of_longest || 0) + longestConsec.longest_consecutive - 1})</p>
        </div>
        <div className="bg-racing-surface rounded p-4 border-t-2 border-racing-yellow">
          <p className="font-condensed text-xs text-racing-muted uppercase">Total Drivers Who Led</p>
          <p className="font-heading text-3xl text-racing-yellow">{lapsLedData.length}</p>
          <p className="font-mono text-[10px] text-racing-muted">drivers</p>
        </div>
      </div>
    </div>
  );
};

export default LapsLedTab;
