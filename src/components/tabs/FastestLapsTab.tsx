import { useState } from 'react';
import { useRaceContext } from '@/pages/Index';
import { useFastestLaps, useFastestLapSections } from '@/hooks/useRaceData';

const CarBadge = ({ num }: { num: string }) => (
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
  const { raceId } = useRaceContext();
  const [selectedSection, setSelectedSection] = useState('Full Lap');
  const { data: sections } = useFastestLapSections(raceId);
  const { data: laps } = useFastestLaps(raceId, selectedSection);

  const maxSpeed = laps?.length ? Math.max(...laps.map(f => Number(f.section_speed) || 0)) : 0;

  const sectionOptions = sections?.map(s => ({
    name: s.section_name,
    distance: s.section_length_miles ? `${Number(s.section_length_miles).toFixed(3)} mi` : '',
  })) || [];

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Fastest Laps</h2>

      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Track Section Breakdown</h3>
        <select
          value={selectedSection}
          onChange={e => setSelectedSection(e.target.value)}
          className="bg-racing-surface border border-racing-border text-racing-text font-body text-sm px-3 py-2 rounded mb-4"
        >
          {sectionOptions.map(s => (
            <option key={s.name} value={s.name}>{s.name} {s.distance ? `(${s.distance})` : ''}</option>
          ))}
        </select>
      </div>

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
                <td className="px-3 py-2 font-body text-sm text-racing-text">{f.driver_name}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-text">{f.section_time}{selectedSection !== 'Full Lap' ? 's' : ''}</td>
                <td className="px-3 py-2"><SpeedBar speed={Number(f.section_speed) || 0} max={maxSpeed} /></td>
                <td className="px-3 py-2 font-mono text-xs text-racing-muted">L{f.lap_number}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FastestLapsTab;
