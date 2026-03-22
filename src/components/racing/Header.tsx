import { format } from 'date-fns';

interface Race {
  id: string;
  year: number;
  round_number: number;
  event_name: string;
  track_name: string;
  race_date: string;
  seasons?: { year: number; series_name: string } | null;
}

interface HeaderProps {
  races: Race[];
  selectedRaceId: string | null;
  onRaceChange: (id: string) => void;
  isLoading: boolean;
}

const Header = ({ races, selectedRaceId, onRaceChange, isLoading }: HeaderProps) => {
  // Group races by year
  const grouped: Record<number, Race[]> = {};
  for (const r of races) {
    (grouped[r.year] ||= []).push(r);
  }
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <header className="sticky top-0 z-50 bg-racing-bg border-b-2 border-racing-yellow">
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="shrink-0">
          <h1 className="font-heading text-[28px] leading-none text-racing-blue tracking-wide">RACEDAY PADDOCK</h1>
          <p className="font-condensed text-[10px] text-racing-muted uppercase tracking-[0.2em]">DATA CENTER</p>
        </div>
        <div className="text-right shrink min-w-0">
          <select
            className="bg-racing-surface border border-racing-border text-racing-text font-mono text-xs md:text-sm px-3 py-1.5 rounded cursor-pointer w-full max-w-md appearance-none"
            value={selectedRaceId || ''}
            onChange={e => onRaceChange(e.target.value)}
            disabled={isLoading}
          >
            {isLoading && <option>Loading races…</option>}
            {years.map(year => (
              <optgroup key={year} label={`${year} Season`}>
                {grouped[year].map(r => (
                  <option key={r.id} value={r.id}>
                    {r.event_name} — {r.track_name} — Round {r.round_number} — {format(new Date(r.race_date), 'MMMM d, yyyy')}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default Header;
