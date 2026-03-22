import { sessionStats, practice1Top5, qualifyingTop5, practiceFinalTop5, weekendStory, driverMap } from '@/data/raceData';

const CarBadge = ({ num }: { num: number }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const SessionTop5 = ({ title, data, showLaps }: { title: string; data: any[]; showLaps?: boolean }) => (
  <div className="bg-racing-surface rounded p-4">
    <h4 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">{title}</h4>
    <div className="space-y-2">
      {data.map(d => {
        const driver = driverMap[d.car];
        return (
          <div key={d.pos} className="flex items-center gap-3">
            <span className="font-heading text-lg text-racing-muted w-5">{d.pos}</span>
            <CarBadge num={d.car} />
            <span className="font-body text-sm text-racing-text flex-1">{driver.last} {driver.first}</span>
            <span className="font-mono text-xs text-racing-yellow">{d.time}s</span>
            <span className="font-mono text-xs text-racing-muted">{d.speed} mph</span>
            {showLaps && d.laps && <span className="font-mono text-[10px] text-racing-muted">{d.laps} laps</span>}
            {d.note && <span className="font-condensed text-[10px] text-racing-yellow">{d.note}</span>}
          </div>
        );
      })}
    </div>
  </div>
);

const WeekendTab = () => {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-2xl text-racing-text">Race Weekend Summary — Phoenix Raceway — March 7, 2026</h2>

      {/* Session Statistics */}
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
            {sessionStats.map(s => (
              <tr key={s.session} className={`border-b border-racing-border/50 ${s.session === 'Totals' ? 'bg-racing-surface' : ''}`}>
                <td className="px-3 py-2 font-condensed text-sm text-racing-text">{s.session}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{s.laps.toLocaleString()}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-text">{s.miles.toFixed(2)}</td>
                <td className="px-3 py-2 font-mono text-xs text-racing-text">{s.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-racing-surface rounded border-t-2 border-racing-blue p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Improved</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">Rosenqvist Felix #60</p>
          <p className="font-mono text-[10px] text-racing-muted">Started P24 · Finished P12 · Gained 12 positions</p>
        </div>
        <div className="bg-racing-surface rounded border-t-2 border-racing-yellow p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Best Race Lap</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">Power Will #26</p>
          <p className="font-mono text-[10px] text-racing-muted">164.620 mph · 21.8686 sec · Lap 192</p>
        </div>
        <div className="bg-racing-surface rounded border-t-2 border-racing-blue p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Best Lead Lap</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">Malukas David #12</p>
          <p className="font-mono text-[10px] text-racing-muted">163.797 mph · 21.9784 sec · Lap 2</p>
        </div>
      </div>

      {/* Session Top 5s */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SessionTop5 title="Practice 1 Top 5" data={practice1Top5} showLaps />
        <SessionTop5 title="Qualifying Top 5" data={qualifyingTop5} />
        <SessionTop5 title="Practice Final Top 5" data={practiceFinalTop5} showLaps />
      </div>

      {/* Weekend Story */}
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
              {weekendStory.map(w => {
                const d = driverMap[w.car];
                return (
                  <tr key={w.car} className="border-b border-racing-border/50">
                    <td className="px-3 py-2"><span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{w.car}</span></td>
                    <td className="px-3 py-2 font-body text-sm text-racing-text">{d.last} {d.first}</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-muted">P{w.qualPos}</td>
                    <td className="px-3 py-2 font-mono text-xs text-racing-text">P{w.finishPos}</td>
                    <td className={`px-3 py-2 font-mono text-xs font-bold ${w.change > 0 ? 'text-racing-green' : w.change < 0 ? 'text-racing-red' : 'text-racing-muted'}`}>
                      {w.change > 0 ? `+${w.change}` : w.change === 0 ? '0' : w.change}
                    </td>
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

export default WeekendTab;
