import { useRaceContext } from '@/pages/Index';
import { useRaceDetails, useSessionStats, useRaceResults } from '@/hooks/useRaceData';
import { useSessionFullResults, useQualifyingResults, useCombinedPracticeResults } from '@/hooks/useSessionData';
import { formatDriverName } from '@/lib/formatName';
import { useIsMobile } from '@/hooks/use-mobile';

const CarBadge = ({ num }: { num: string }) => (
  <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-sm w-8 h-6 rounded-sm">{num}</span>
);

const EngineText = ({ engine }: { engine: string }) => (
  <span className={`font-mono text-xs ${engine === 'Honda' ? 'text-racing-honda' : 'text-racing-chevy'}`}>{engine}</span>
);

const WeekendTab = () => {
  const { raceId } = useRaceContext();
  const { data: race } = useRaceDetails(raceId);
  const { data: sessionStats } = useSessionStats(raceId);
  const { data: results } = useRaceResults(raceId);
  const { data: p1Results } = useSessionFullResults(raceId, 'Practice 1');
  const { data: pfResults } = useSessionFullResults(raceId, 'Practice Final');
  const { data: qualResults } = useQualifyingResults(raceId);
  const { data: combinedPractice } = useCombinedPracticeResults(raceId);
  const isMobile = useIsMobile();

  if (!race) return <p className="text-racing-muted font-body">Loading…</p>;

  const weekendStory = results?.map(r => ({
    car: r.car_number,
    driver: formatDriverName(r.driver_name),
    qualPos: r.start_position,
    finishPos: r.finish_position,
    change: r.start_position - r.finish_position,
  })) || [];

  return (
    <div className="space-y-8">
      <h2 className="font-heading text-2xl text-racing-text">Race Weekend Summary — {race.track_name} — {new Date(race.race_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h2>

      {/* Session Statistics */}
      {isMobile ? (
        <div className="space-y-1.5">
          {sessionStats?.map(s => (
            <div key={s.id} className={`rounded p-3 ${s.session_type === 'Totals' ? 'bg-racing-surface2 border border-racing-border' : 'bg-racing-surface'}`}>
              <p className="font-condensed text-sm text-racing-text">{s.session_type}</p>
              <div className="flex gap-4 mt-1">
                <span className="font-mono text-xs text-racing-yellow">{s.laps.toLocaleString()} laps</span>
                <span className="font-mono text-xs text-racing-text">{Number(s.miles).toFixed(0)} mi</span>
                <span className="font-mono text-xs text-racing-muted">{s.time_on_track}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
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
      )}

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-racing-surface rounded border-t-2 border-racing-blue p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Most Improved</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">{formatDriverName(race.most_improved_driver)} #{race.most_improved_car}</p>
          <p className="font-mono text-[10px] text-racing-muted">Gained {race.most_improved_positions} positions</p>
        </div>
        <div className="bg-racing-surface rounded border-t-2 border-racing-yellow p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Best Race Lap</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">{formatDriverName(race.fastest_lap_driver)} #{race.fastest_lap_car}</p>
          <p className="font-mono text-[10px] text-racing-muted">{race.fastest_lap_speed} mph · {race.fastest_lap_time} sec · Lap {race.fastest_lap_number}</p>
        </div>
        <div className="bg-racing-surface rounded border-t-2 border-racing-blue p-4">
          <p className="font-condensed text-xs text-racing-muted uppercase">Best Lead Lap</p>
          <p className="font-heading text-xl text-racing-yellow mt-1">{formatDriverName(race.best_lead_lap_driver)}</p>
          <p className="font-mono text-[10px] text-racing-muted">{race.best_lead_lap_speed} mph · {race.best_lead_lap_time} sec</p>
        </div>
        {combinedPractice?.[0] && (
          <div className="bg-racing-surface rounded border-t-2 border-racing-yellow p-4">
            <p className="font-condensed text-xs text-racing-muted uppercase">Combined Practice Best</p>
            <p className="font-heading text-xl text-racing-yellow mt-1">{formatDriverName(combinedPractice[0].driver_name)} #{combinedPractice[0].car_number}</p>
            <p className="font-mono text-[10px] text-racing-muted">{Number(combinedPractice[0].best_speed).toFixed(3)} mph · {combinedPractice[0].best_session}</p>
          </div>
        )}
      </div>

      {/* Practice Results */}
      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Practice Results</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SessionResultsView title="Practice 1" data={p1Results || []} isMobile={isMobile} />
          <SessionResultsView title="Practice Final" data={pfResults || []} isMobile={isMobile} />
        </div>
      </div>

      {/* Combined Practice */}
      {combinedPractice && combinedPractice.length > 0 && (
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Combined Practice Results</h3>
          <p className="font-mono text-[10px] text-racing-muted mb-2">Best time across all practice sessions per driver.</p>
          {isMobile ? (
            <div className="space-y-1.5">
              {combinedPractice.map(d => (
                <div key={d.id} className="bg-racing-surface rounded p-3 flex items-center gap-2.5">
                  <span className="font-heading text-sm text-racing-muted w-5 shrink-0">{d.rank}</span>
                  <CarBadge num={d.car_number} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm text-racing-text">{formatDriverName(d.driver_name)}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="font-mono text-[10px] text-racing-yellow">{d.best_time}s</span>
                      <span className="font-mono text-[10px] text-racing-text">{Number(d.best_speed).toFixed(3)} mph</span>
                      <span className="font-mono text-[10px] text-racing-muted">{d.best_session}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-racing-border">
                    {['Rank','Car','Driver','Engine','Best Time','Speed','Session','Total Laps'].map(h => (
                      <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {combinedPractice.map(d => (
                    <tr key={d.id} className="border-b border-racing-border/50">
                      <td className="px-3 py-2 font-heading text-sm text-racing-muted">{d.rank}</td>
                      <td className="px-3 py-2"><CarBadge num={d.car_number} /></td>
                      <td className="px-3 py-2 font-body text-sm text-racing-text">{formatDriverName(d.driver_name)}</td>
                      <td className="px-3 py-2"><EngineText engine={d.engine || ''} /></td>
                      <td className="px-3 py-2 font-mono text-xs text-racing-yellow">{d.best_time}s</td>
                      <td className="px-3 py-2 font-mono text-xs text-racing-text">{Number(d.best_speed).toFixed(3)} mph</td>
                      <td className="px-3 py-2 font-mono text-xs text-racing-muted">{d.best_session}</td>
                      <td className="px-3 py-2 font-mono text-xs text-racing-muted">{d.total_laps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Qualifying Results */}
      {qualResults && qualResults.length > 0 && (
        <div>
          <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-1">Qualifying Results</h3>
          <p className="font-mono text-[10px] text-racing-muted mb-3">Oval qualifying: average of two flying laps. Total time determines grid position.</p>
          {isMobile ? (
            <div className="space-y-1.5">
              {qualResults.map(q => {
                const l1 = q.lap1_time ? parseFloat(q.lap1_time) : null;
                const l2 = q.lap2_time ? parseFloat(q.lap2_time) : null;
                const fasterLap = l1 !== null && l2 !== null ? (l1 <= l2 ? 1 : 2) : l1 !== null ? 1 : null;
                const isDNQ = q.comment === 'DNQ';
                return (
                  <div key={q.id} className={`bg-racing-surface rounded p-3 ${isDNQ ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-heading text-sm text-racing-muted w-6 shrink-0">P{q.qual_position}</span>
                      <CarBadge num={q.car_number} />
                      <span className="font-body text-sm text-racing-text">{formatDriverName(q.driver_name)}</span>
                      <EngineText engine={q.engine || ''} />
                      {isDNQ && <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-heading bg-racing-orange/20 text-racing-orange">DNQ</span>}
                    </div>
                    <div className="flex gap-3 font-mono text-[10px]">
                      <span className={fasterLap === 1 ? 'text-racing-yellow font-bold' : 'text-racing-text'}>L1: {q.lap1_time ? `${q.lap1_time}s` : '—'}</span>
                      <span className={fasterLap === 2 ? 'text-racing-yellow font-bold' : 'text-racing-text'}>L2: {q.lap2_time ? `${q.lap2_time}s` : isDNQ ? 'DNQ' : '—'}</span>
                      <span className="text-racing-muted">{q.avg_speed ? `${Number(q.avg_speed).toFixed(3)} mph` : '—'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b border-racing-border">
                    {['Qual Pos','Car','Driver','Engine','Lap 1','Lap 2','Total Time','Avg Speed','Comment'].map(h => (
                      <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qualResults.map(q => {
                    const l1 = q.lap1_time ? parseFloat(q.lap1_time) : null;
                    const l2 = q.lap2_time ? parseFloat(q.lap2_time) : null;
                    const fasterLap = l1 !== null && l2 !== null ? (l1 <= l2 ? 1 : 2) : l1 !== null ? 1 : null;
                    const isDNQ = q.comment === 'DNQ';
                    return (
                      <tr key={q.id} className={`border-b border-racing-border/50 ${isDNQ ? 'opacity-70' : ''}`}>
                        <td className="px-3 py-2 font-heading text-sm text-racing-muted">P{q.qual_position}</td>
                        <td className="px-3 py-2"><CarBadge num={q.car_number} /></td>
                        <td className="px-3 py-2 font-body text-sm text-racing-text">{formatDriverName(q.driver_name)}</td>
                        <td className="px-3 py-2"><EngineText engine={q.engine || ''} /></td>
                        <td className={`px-3 py-2 font-mono text-xs ${fasterLap === 1 ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                          {q.lap1_time ? `${q.lap1_time}s` : 'No Time'}
                        </td>
                        <td className={`px-3 py-2 font-mono text-xs ${fasterLap === 2 ? 'text-racing-yellow font-bold' : 'text-racing-text'}`}>
                          {q.lap2_time ? `${q.lap2_time}s` : isDNQ ? 'DNQ' : 'No Time'}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-racing-text">{q.total_time ? `${q.total_time}s` : '—'}</td>
                        <td className="px-3 py-2 font-mono text-xs text-racing-text">{q.avg_speed ? `${Number(q.avg_speed).toFixed(3)} mph` : '—'}</td>
                        <td className="px-3 py-2">
                          {isDNQ && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-heading bg-racing-orange/20 text-racing-orange">DNQ</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Weekend Story */}
      <div>
        <h3 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-3">Weekend Story</h3>
        {isMobile ? (
          <div className="space-y-1.5">
            {weekendStory.map(w => (
              <div key={w.car} className="bg-racing-surface rounded p-3 flex items-center gap-2.5">
                <CarBadge num={w.car} />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm text-racing-text">{w.driver}</p>
                  <div className="flex gap-3 mt-0.5 font-mono text-[10px]">
                    <span className="text-racing-muted">Q: P{w.qualPos}</span>
                    <span className="text-racing-text">F: P{w.finishPos}</span>
                    <span className={`font-bold ${w.change > 0 ? 'text-racing-green' : w.change < 0 ? 'text-racing-red' : 'text-racing-muted'}`}>
                      {w.change > 0 ? `+${w.change}` : w.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

const SessionResultsView = ({ title, data, isMobile }: { title: string; data: any[]; isMobile: boolean }) => {
  if (!data.length) return null;
  return (
    <div>
      <h4 className="font-condensed font-semibold text-sm text-racing-text uppercase mb-2">{title}</h4>
      {isMobile ? (
        <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
          {data.map(d => (
            <div key={d.id} className="bg-racing-surface rounded p-2.5 flex items-center gap-2">
              <span className="font-heading text-sm text-racing-muted w-5 shrink-0">{d.rank}</span>
              <span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-xs w-7 h-5 rounded-sm shrink-0">{d.car_number}</span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-xs text-racing-text truncate">{formatDriverName(d.driver_name)}</p>
                <div className="flex gap-2 mt-0.5">
                  <span className="font-mono text-[10px] text-racing-yellow">{d.best_time}s</span>
                  <span className="font-mono text-[10px] text-racing-text">{Number(d.best_speed).toFixed(3)} mph</span>
                  <span className="font-mono text-[10px] text-racing-muted">{d.total_laps} laps</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead className="sticky top-0 bg-racing-bg">
              <tr className="border-b border-racing-border">
                {['Rank','Car','Driver','Engine','Best Time','Speed','Diff','Gap','Best Lap','Total Laps'].map(h => (
                  <th key={h} className="font-condensed font-semibold text-xs text-racing-muted uppercase px-2 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id} className="border-b border-racing-border/50">
                  <td className="px-2 py-1.5 font-heading text-sm text-racing-muted">{d.rank}</td>
                  <td className="px-2 py-1.5"><span className="inline-flex items-center justify-center bg-racing-blue text-white font-heading text-xs w-7 h-5 rounded-sm">{d.car_number}</span></td>
                  <td className="px-2 py-1.5 font-body text-xs text-racing-text">{formatDriverName(d.driver_name)}</td>
                  <td className="px-2 py-1.5"><span className={`font-mono text-[10px] ${d.engine === 'Honda' ? 'text-racing-honda' : 'text-racing-chevy'}`}>{d.engine}</span></td>
                  <td className="px-2 py-1.5 font-mono text-xs text-racing-yellow">{d.best_time}s</td>
                  <td className="px-2 py-1.5 font-mono text-xs text-racing-text">{Number(d.best_speed).toFixed(3)} mph</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] text-racing-muted">{d.diff_to_leader || '—'}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] text-racing-muted">{d.gap_to_ahead || '—'}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] text-racing-muted">L{d.best_lap_number}</td>
                  <td className="px-2 py-1.5 font-mono text-[10px] text-racing-muted">{d.total_laps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WeekendTab;