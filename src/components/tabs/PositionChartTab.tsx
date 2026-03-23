import { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useRaceContext } from '@/pages/Index';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRacePositions, useCautions, DRIVER_COLORS } from '@/hooks/useRaceData';

const PositionChartTab = () => {
  const { raceId } = useRaceContext();
  const { data: positions } = useRacePositions(raceId);
  const { data: cautions } = useCautions(raceId);
  const [highlightedCar, setHighlightedCar] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const { data, cars, cautionRanges } = useMemo(() => {
    if (!positions?.length) return { data: [], cars: [], cautionRanges: [] as [number, number][] };

    const cRanges: [number, number][] = (cautions || []).map(c => [c.start_lap, c.end_lap]);

    const byLap: Record<number, Record<string, number>> = {};
    const carSet = new Set<string>();
    for (const p of positions) {
      if (!byLap[p.lap_number]) byLap[p.lap_number] = {};
      byLap[p.lap_number][`car${p.car_number}`] = p.position;
      carSet.add(p.car_number);
    }

    const laps = Object.keys(byLap).map(Number).sort((a, b) => a - b);
    const chartData = laps.map(lap => ({ lap, ...byLap[lap] }));

    for (const [start, end] of cRanges) {
      for (const lap of [start, end]) {
        if (!byLap[lap]) {
          const entry: Record<string, number> = { lap };
          carSet.forEach(car => { entry[`car${car}`] = 25; });
          chartData.push(entry as any);
        }
      }
    }
    chartData.sort((a: any, b: any) => a.lap - b.lap);

    return { data: chartData, cars: Array.from(carSet), cautionRanges: cRanges };
  }, [positions, cautions]);

  const handleLineClick = useCallback((car: string) => {
    setHighlightedCar(prev => prev === car ? null : car);
  }, []);

  if (!data.length) return <p className="text-racing-muted font-body">Loading position chart…</p>;

  const maxLap = Math.max(...data.map((d: any) => d.lap));

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-racing-text">Position Chart</h2>
      <p className="font-mono text-xs text-racing-muted">Y-axis: Position (P1 top). Yellow bands = caution periods. Click a driver below to track their race.</p>

      <div className="w-full" style={{ height: isMobile ? 400 : 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: isMobile ? -20 : 0, bottom: 10 }}>
            <XAxis dataKey="lap" type="number" domain={[1, maxLap]} tick={{ fill: '#5a7a94', fontSize: isMobile ? 9 : 11, fontFamily: 'DM Mono' }} tickCount={isMobile ? 5 : 10} />
            <YAxis reversed domain={[1, 25]} tick={{ fill: '#5a7a94', fontSize: isMobile ? 9 : 11, fontFamily: 'DM Mono' }} tickCount={isMobile ? 7 : 13} width={isMobile ? 25 : 30} />
            {cautionRanges.map(([s, e], i) => (
              <ReferenceArea key={i} x1={s} x2={e} fill="#e8ff00" fillOpacity={0.08} />
            ))}
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1620', border: '1px solid #1e2e40', borderRadius: 4, padding: 8 }}
              labelFormatter={(v) => `Lap ${v}`}
              formatter={(value: number, name: string) => {
                const carNum = name.replace('car', '');
                return [`P${Math.round(value)}`, `#${carNum}`];
              }}
            />
            {cars.map(car => (
              <Line
                key={car}
                type="linear"
                dataKey={`car${car}`}
                stroke={DRIVER_COLORS[car] || '#888'}
                strokeWidth={highlightedCar === car ? 3 : isMobile ? 1 : 1.5}
                strokeOpacity={highlightedCar === null ? 0.7 : highlightedCar === car ? 1 : 0.7}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
                style={{ cursor: 'pointer' }}
                onClick={() => handleLineClick(car)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        {cars.map(car => (
          <button
            key={car}
            onClick={() => handleLineClick(car)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-body transition-all ${
              highlightedCar === car
                ? 'bg-racing-surface2 ring-1 ring-racing-yellow/50 opacity-100'
                : highlightedCar !== null
                  ? 'opacity-25 hover:opacity-60'
                  : 'opacity-100 hover:bg-racing-surface'
            }`}
          >
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: DRIVER_COLORS[car] }} />
            <span className="text-racing-text">#{car}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PositionChartTab;
