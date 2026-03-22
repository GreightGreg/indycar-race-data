import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { generatePositionChartData, CAUTION_RANGES, DRIVER_COLORS, driverMap } from '@/data/raceData';

const PositionChartTab = () => {
  const [highlightedCar, setHighlightedCar] = useState<number | null>(null);
  const { data, cars } = useMemo(() => generatePositionChartData(), []);

  const activeCars = cars.filter(c => c !== 18); // Exclude Grosjean (0 laps)

  const handleLegendClick = (car: number) => {
    setHighlightedCar(prev => prev === car ? null : car);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-racing-text">Position Chart</h2>
      <p className="font-mono text-xs text-racing-muted">Y-axis: Position (P1 top). Yellow bands = caution periods. Click legend to highlight a driver.</p>

      <div className="w-full" style={{ height: 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <XAxis
              dataKey="lap"
              type="number"
              domain={[1, 250]}
              tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }}
              tickCount={10}
              label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#5a7a94', fontFamily: 'Barlow Condensed', fontSize: 12 }}
            />
            <YAxis
              reversed
              domain={[1, 25]}
              tick={{ fill: '#5a7a94', fontSize: 11, fontFamily: 'DM Mono' }}
              tickCount={13}
              label={{ value: 'Position', angle: -90, position: 'insideLeft', fill: '#5a7a94', fontFamily: 'Barlow Condensed', fontSize: 12 }}
            />
            {CAUTION_RANGES.map(([s, e], i) => (
              <ReferenceArea key={i} x1={s} x2={e} fill="#e8ff00" fillOpacity={0.08} />
            ))}
            <Tooltip
              contentStyle={{ backgroundColor: '#0d1620', border: '1px solid #1e2e40', borderRadius: 4, padding: 8 }}
              labelStyle={{ color: '#dce8f0', fontFamily: 'Barlow Condensed', fontSize: 12 }}
              labelFormatter={(v) => `Lap ${v}`}
              formatter={(value: number, name: string) => {
                const carNum = parseInt(name.replace('car', ''));
                const d = driverMap[carNum];
                return [`P${Math.round(value)}`, d ? `#${carNum} ${d.last}` : name];
              }}
            />
            {activeCars.map(car => (
              <Line
                key={car}
                type="linear"
                dataKey={`car${car}`}
                stroke={DRIVER_COLORS[car] || '#888'}
                strokeWidth={highlightedCar === car ? 3 : 1.5}
                strokeOpacity={highlightedCar === null ? 0.7 : highlightedCar === car ? 1 : 0.12}
                dot={false}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {activeCars.map(car => {
          const d = driverMap[car];
          if (!d) return null;
          const isActive = highlightedCar === car;
          return (
            <button
              key={car}
              onClick={() => handleLegendClick(car)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-body transition-opacity ${
                highlightedCar !== null && !isActive ? 'opacity-30' : 'opacity-100'
              } hover:opacity-100`}
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: DRIVER_COLORS[car] }} />
              <span className="text-racing-text">#{car} {d.last}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PositionChartTab;
