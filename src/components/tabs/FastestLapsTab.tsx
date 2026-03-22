import { useState } from 'react';
import { fastestLaps, trackSections, sectionResults, driverMap } from '@/data/raceData';

const CarBadge = ({ num }: { num: number }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const SpeedBar = ({ speed, max }: { speed: number; max: number }) => (
  <div className="flex items-center gap-2 min-w-[140px]">
    <div className="flex-1 h-1.5 bg-racing-surface2 rounded overflow-hidden">
      <div className="h-full bg-racing-yellow rounded" style={{ width: `${(speed / max) * 100}%` }} />
    </div>
    <span className="font-mono text-xs text-racing-yellow whitespace-nowrap">{speed.toFixed(3)}</span>
  </div>
);

const FastestLapsTab = () => {
  const [selectedSection, setSelectedSection] = useState('Full Lap');
  const maxSpeed = Math.max(...fastestLaps.map(f => f.speed));
  const sectionData = selectedSection === 'Full Lap' ? null : sectionResults[selectedSection];
  const sectionMaxSpeed = sectionData ? Math.max(...sectionData.map(s => s.speed)) : 0;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Fastest Laps</h2>

      {/* Main Table */}
      {selectedSection === 'Full Lap' && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-racing-border">
                {['Rank','Car','Driver','Lap Time','Speed','Lap'].map(h => (
                  <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fastestLaps.map(f => {
                const d = driverMap[f.car];
                return (
                  <tr key={f.rank} className="border-b border-racing-border/50">
                    <td className="px-3 py-2 font-heading text-sm text-racing-muted">{f.rank}</td>
                    <td className="px-3 py-2"><CarBadge num={f.car} /></td>
                    <td className="px-3 py-2 font-body text-sm text-racing-text">{d?.last} {d?.first}</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-text">{f.time}</td>
                    <td className="px-3 py-2"><SpeedBar speed={f.speed} max={maxSpeed} /></td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-muted">L{f.lap}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Section Breakdown */}
      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Track Section Breakdown</h3>
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded mb-4"
        >
          {trackSections.map(s => (
            <option key={s.name} value={s.name}>{s.name} ({s.distance})</option>
          ))}
        </select>

        {sectionData && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-b border-racing-border">
                  {['Rank','Car','Driver','Time','Speed','Lap'].map(h => (
                    <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionData.map(s => {
                  const d = driverMap[s.car];
                  return (
                    <tr key={s.rank} className="border-b border-racing-border/50">
                      <td className="px-3 py-2 font-heading text-sm text-racing-muted">{s.rank}</td>
                      <td className="px-3 py-2"><CarBadge num={s.car} /></td>
                      <td className="px-3 py-2 font-body text-sm text-racing-text">{d?.last} {d?.first}</td>
                      <td className="px-3 py-2 font-mono text-xs text-racing-text">{s.time}s</td>
                      <td className="px-3 py-2"><SpeedBar speed={s.speed} max={sectionMaxSpeed} /></td>
                      <td className="px-3 py-2 font-mono text-xs text-racing-muted">L{s.lap}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FastestLapsTab;
