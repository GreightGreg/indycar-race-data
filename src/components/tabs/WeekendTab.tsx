import { useRaceContext } from '@/pages/Index';
import { useRaceDetails, useSessionStats, useSessionResults, useRaceResults } from '@/hooks/useRaceData';

const CarBadge = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const WeekendTab = () => {
  const { raceId } = useRaceContext();
  const { data: race } = useRaceDetails(raceId);
  const { data: sessionStats } = useSessionStats(raceId);
  const { data: sessionResults } = useSessionResults(raceId);
  const { data: results } = useRaceResults(raceId);

  if (!race) return <p className="text-racing-muted font-body">Loading…</p>;

  const practice1 = sessionResults?.filter(s => s.session_type === 'Practice 1').slice(0, 5) || [];
  const qualifying = sessionResults?.filter(s => s.session_type === 'Qualifying').slice(0, 5) || [];
  const practiceFinal = sessionResults?.filter(s => s.session_type === 'Practice Final').slice(0, 5) || [];

  const weekendStory = results?.map(r => ({
    car: r.car_number,
    driver: r.driver_name,
    qualPos: r.start_position,
    finishPos: r.finish_position,
    change: r.start_position - r.finish_position,
  })) || [];

  const SessionTop5 = ({ title, data, showLaps }: { title: string; data: typeof practice1; showLaps?: boolean }) => (
    <div className="bg-racing-surface rounded p-4">
      <h4 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.id} className="flex items-center gap-3">
            <span className="font-heading text-lg text-racing-muted w-5">{d.position}</span>
            <CarBadge num={d.car_number} />
            <span className="font-body text-sm text-racing-text flex-1">{d.driver_name}</span>
            <span className="font-mono text-xs text-racing-yellow">{d.best_time}s</span>
            <span className="font-mono text-xs text-racing-muted">{d.best_speed} mph</span>
            {showLaps && d.laps_run && <span className="font-mono text-[10px] text-racing-muted">{d.laps_run} laps</span>}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Race Weekend Summary — {race.track_name} — {new Date(race.race_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left">
          <thead>
            <tr className="border-b border-racing-border">
              {['Session','Laps','Miles','Time on Track'].map(h => (
                <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessionStats?.map(s => (
              <tr key={s.id} className={`border-b border-racing-border/50 ${s.session_type === 'Totals' ? 'bg-racing-surface' : ''}`}>
                <td className="px-3 py-2 font-condensed text-sm text-racing-text">{s.session_type}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{s.laps.toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-text">{Number(s.miles).toFixed(2)}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-text">{s.time_on_track}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-racing-surface rounded border-t-2 border-racing-blue p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Improved</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">{race.most_improved_driver} #{race.most_improved_car}</p>
          <p className="font-mono text-[10px] text-racing-muted">Gained {race.most_improved_positions} positions</p>
        </div>
        <div className="bg-racing-surface rounded border-t-2 border-racing-yellow p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Best Race Lap</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">{race.fastest_lap_driver} #{race.fastest_lap_car}</p>
          <p className="font-mono text-[10px] text-racing-muted">{race.fastest_lap_speed} mph · {race.fastest_lap_time} sec · Lap {race.fastest_lap_number}</p>
        </div>
        <div className="bg-racing-surface rounded border-t-2 border-racing-blue p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Best Lead Lap</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">{race.best_lead_lap_driver}</p>
          <p className="font-mono text-[10px] text-racing-muted">{race.best_lead_lap_speed} mph · {race.best_lead_lap_time} sec</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SessionTop5 title="Practice 1 Top 5" data={practice1} showLaps />
        <SessionTop5 title="Qualifying Top 5" data={qualifying} />
        <SessionTop5 title="Practice Final Top 5" data={practiceFinal} showLaps />
      </div>

      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Weekend Story</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left">
            <thead>
              <tr className="border-b border-racing-border">
                {['Car','Driver','Qual Pos','Race Finish','Change'].map(h => (
                  <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekendStory.map(w => (
                <tr key={w.car} className="border-b border-racing-border/50">
                  <td className="px-3 py-2"><CarBadge num={w.car} /></td>
                  <td className="px-3 py-2 font-body text-sm text-racing-text">{w.driver}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-muted">P{w.qualPos}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-text">P{w.finishPos}</td>
                  <td className={`px-3 py-2 font-mono text-xs font-bold ${w.change > 0 ? 'text-racing-green' : w.change < 0 ? 'text-racing-red' : 'text-racing-muted'}`}>
                    {w.change > 0 ? `+${w.change}` : w.change === 0 ? '0' : w.change}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WeekendTab;
