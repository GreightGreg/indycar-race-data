import { pitStopsByDriver, pitTransitTimes, driverMap, raceResults } from '@/data/raceData';

const CarBadge = ({ num }: { num: number }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm shrink-0">{num}</span>
);

const PitStrategyTab = () => {
  const sortedPitStops = pitStopsByDriver.sort((a, b) => {
    const pa = raceResults.find(r => r.car === a.car)?.pos ?? 99;
    const pb = raceResults.find(r => r.car === b.car)?.pos ?? 99;
    return pa - pb;
  });

  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Pit Strategy</h2>

      {/* Pit Stop Timeline */}
      <div className="space-y-1">
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">Pit Stop Timeline</h3>
        {sortedPitStops.map(ps => {
          const d = driverMap[ps.car];
          if (!d) return null;
          return (
            <div key={ps.car} className="flex items-center gap-2 py-1">
              <div className="flex items-center gap-1.5 w-44 shrink-0">
                <CarBadge num={ps.car} />
                <span className="font-body text-xs text-racing-text truncate">{d.last}</span>
                <span className="font-mono text-[10px] text-racing-muted">{ps.stops.length}s</span>
              </div>
              <div className="flex-1 relative h-6 bg-racing-surface rounded">
                {ps.stops.map((lap, i) => (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-racing-orange border border-racing-bg"
                    style={{ left: `${(lap / 250) * 100}%` }}
                    title={`Stop ${i + 1} · Lap ${lap}`}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between mt-1">
          <span className="font-mono text-[10px] text-racing-muted">Lap 1</span>
          <span className="font-mono text-[10px] text-racing-muted">Lap 250</span>
        </div>
      </div>

      {/* Pit Stop Detail Table */}
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
              {sortedPitStops.map(ps => {
                const d = driverMap[ps.car];
                const pos = raceResults.find(r => r.car === ps.car)?.pos;
                return (
                  <tr key={ps.car} className="border-b border-racing-border/50">
                    <td className="px-3 py-2 font-mono text-xs text-racing-muted">P{pos}</td>
                    <td className="px-3 py-2"><CarBadge num={ps.car} /></td>
                    <td className="px-3 py-2 font-body text-sm text-racing-text">{d?.last} {d?.first}</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{ps.stops.length}</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-text">{ps.stops.join(', ') || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pit Lane Execution */}
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
              {pitTransitTimes.map(pt => {
                const d = driverMap[pt.car];
                return (
                  <tr key={pt.rank} className="border-b border-racing-border/50">
                    <td className="px-3 py-2 font-heading text-sm text-racing-muted">{pt.rank}</td>
                    <td className="px-3 py-2"><CarBadge num={pt.car} /></td>
                    <td className="px-3 py-2 font-body text-sm text-racing-text">{d?.last} {d?.first}</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{pt.time}s</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-text">{pt.speed.toFixed(3)} mph</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PitStrategyTab;
