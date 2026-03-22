import { useRaceContext } from '@/pages/Index';
import { useRaceResults, usePitStops, usePitExecution } from '@/hooks/useRaceData';

const CarBadge = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm shrink-0">{num}</span>
);

const PitStrategyTab = () => {
  const { raceId } = useRaceContext();
  const { data: results } = useRaceResults(raceId);
  const { data: pitStops } = usePitStops(raceId);
  const { data: pitExec } = usePitExecution(raceId);

  if (!results?.length || !pitStops) return <p className="text-racing-muted font-body">Loading…</p>;

  // Group pit stops by car, sorted by finish position
  const byDriver = results.map(r => {
    const stops = pitStops.filter(ps => ps.car_number === r.car_number).sort((a, b) => a.stop_number - b.stop_number);
    return { car: r.car_number, driver: r.driver_name, pos: r.finish_position, stops };
  });

  const totalLaps = 250;

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Pit Strategy</h2>

      <div className="space-y-1">
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Pit Stop Timeline</h3>
        {byDriver.map(d => (
          <div key={d.car} className="flex items-center gap-2 py-1">
            <div className="flex items-center gap-1.5 w-44 shrink-0">
              <CarBadge num={d.car} />
              <span className="font-body text-xs text-racing-text truncate">{d.driver?.split(' ')[0]}</span>
              <span className="font-mono text-[10px] text-racing-muted">{d.stops.length}s</span>
            </div>
            <div className="flex-1 relative h-6 bg-racing-surface rounded">
              {d.stops.map((s, i) => (
                <div key={i} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-racing-orange border border-racing-bg"
                  style={{ left: `${(s.lap_number / totalLaps) * 100}%` }}
                  title={`Stop ${s.stop_number} · Lap ${s.lap_number}`}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-racing-muted">Lap 1</span>
          <span className="font-mono text-[10px] text-racing-muted">Lap {totalLaps}</span>
        </div>
      </div>

      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Pit Stop Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left">
            <thead>
              <tr className="border-b border-racing-border">
                {['Finish','Car','Driver','Total Stops','Stop Laps'].map(h => (
                  <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDriver.map(d => (
                <tr key={d.car} className="border-b border-racing-border/50">
                  <td className="px-3 py-2 font-mono text-xs text-racing-muted">P{d.pos}</td>
                  <td className="px-3 py-2"><CarBadge num={d.car} /></td>
                  <td className="px-3 py-2 font-body text-sm text-racing-text">{d.driver}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{d.stops.length}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-text">{d.stops.map(s => s.lap_number).join(', ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-1">Pit Lane Execution</h3>
        <p className="font-mono text-[10px] text-racing-muted mb-3">Best pit lane transit time recorded per driver (pit entry to pit exit). Note: top 8 drivers used a faster pit entry route — times across entry routes are not directly comparable.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left">
            <thead>
              <tr className="border-b border-racing-border">
                {['Rank','Car','Driver','Best Transit Time','Pit Lane Speed'].map(h => (
                  <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pitExec?.map((pt, i) => (
                <tr key={pt.id} className="border-b border-racing-border/50">
                  <td className="px-3 py-2 font-heading text-sm text-racing-muted">{i + 1}</td>
                  <td className="px-3 py-2"><CarBadge num={pt.car_number} /></td>
                  <td className="px-3 py-2 font-body text-sm text-racing-text">{pt.driver_name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{Number(pt.best_transit_time).toFixed(4)}s</td>
                  <td className="px-3 py-2 font-mono text-xs text-racing-text">{Number(pt.pit_lane_speed).toFixed(3)} mph</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PitStrategyTab;
