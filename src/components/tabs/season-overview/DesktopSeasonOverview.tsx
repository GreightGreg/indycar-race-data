import { Fragment, type ReactNode } from 'react';
import CarBadge from '@/components/racing/CarBadge';
import EngineIcon from '@/components/racing/EngineIcon';
import { formatDriverName } from '@/lib/formatName';

type TrackType = 'oval' | 'street' | 'road';

interface DriverStats {
  car_number: string;
  driver_name: string;
  avgFinish: number | null;
  avgQual: number | null;
  byTrackType: Record<TrackType, { avgFinish: number | null; avgQual: number | null }>;
}

interface TeamGroup {
  team: string;
  engine: string;
  drivers: DriverStats[];
  teamAvgFinish: number | null;
  teamAvgQual: number | null;
}

interface DesktopSeasonOverviewProps {
  teams: TeamGroup[];
  throughRound: number | null;
  trackTypes: TrackType[];
}

const TRACK_TYPE_LABELS: Record<TrackType, string> = {
  oval: 'Oval',
  street: 'Street',
  road: 'Road',
};

const LABEL_COLUMN_WIDTH = 120;
const DRIVER_COLUMN_WIDTH = 72;

const fmt = (v: number | null) => (v !== null ? v.toFixed(1) : '-');

const DesktopSeasonOverview = ({ teams, throughRound, trackTypes }: DesktopSeasonOverviewProps) => {
  const totalDrivers = teams.reduce((sum, team) => sum + team.drivers.length, 0);
  const gridTemplateColumns = `${LABEL_COLUMN_WIDTH}px repeat(${Math.max(totalDrivers, 1)}, ${DRIVER_COLUMN_WIDTH}px)`;
  const rowStyle = {
    gridTemplateColumns,
    minWidth: '100%',
    width: 'max-content',
  } as const;

  const renderStickyLabel = (content: ReactNode, bgClass: string, extraClassName = '') => (
    <div
      className={`sticky left-0 z-20 flex items-center px-3 text-[12px] text-racing-muted border-r border-racing-border/20 ${bgClass} ${extraClassName}`}
    >
      {content}
    </div>
  );

  const renderDriverCells = (
    rowKey: string,
    cellClassName: string,
    renderValue: (driver: DriverStats) => ReactNode,
  ) =>
    teams.flatMap((team) =>
      team.drivers.map((driver, index) => (
        <div
          key={`${rowKey}-${driver.car_number}`}
          className={`flex items-center justify-center px-2 ${cellClassName} ${index === 0 ? 'border-l border-racing-border/30' : ''}`}
        >
          {renderValue(driver)}
        </div>
      )),
    );

  return (
    <div className="space-y-2">
      <h2 className="font-heading text-racing-yellow text-lg">Season Overview</h2>
      <p className="font-mono text-[13px] text-racing-muted mb-2">
        Season averages through Round {throughRound} · Sorted by team avg finish
      </p>

      <div className="overflow-x-auto border border-racing-border rounded-lg">
        <div className="min-w-full">
          <div className="grid border-b border-racing-border bg-racing-surface2" style={rowStyle}>
            {renderStickyLabel('Avg Finish', 'bg-racing-surface2', 'z-30 py-2 font-condensed font-semibold min-h-11')}
            {teams.map((team) => (
              <div
                key={`team-header-${team.team}`}
                className="flex items-center justify-center gap-2 px-2 py-2 font-condensed font-semibold text-racing-text text-[13px] border-l border-racing-border min-h-11"
                style={{ gridColumn: `span ${team.drivers.length} / span ${team.drivers.length}` }}
              >
                <span>{team.team}</span>
                <EngineIcon engine={team.engine} size="sm" />
              </div>
            ))}
          </div>

          <div className="grid border-b border-racing-border bg-racing-surface" style={rowStyle}>
            {renderStickyLabel('Team', 'bg-racing-surface', 'py-1.5 min-h-9')}
            {teams.map((team) => (
              <div
                key={`team-finish-${team.team}`}
                className="flex items-center justify-center px-2 py-1.5 text-racing-yellow font-bold border-l border-racing-border min-h-9"
                style={{ gridColumn: `span ${team.drivers.length} / span ${team.drivers.length}` }}
              >
                {fmt(team.teamAvgFinish)}
              </div>
            ))}
          </div>

          <div className="grid border-b border-racing-border bg-racing-surface" style={rowStyle}>
            {renderStickyLabel('Driver', 'bg-racing-surface', 'py-1.5 min-h-9')}
            {renderDriverCells('driver-finish', 'py-1.5 min-h-9 text-racing-text', (driver) => fmt(driver.avgFinish))}
          </div>

          <div className="grid border-b border-racing-border bg-racing-surface2" style={rowStyle}>
            {renderStickyLabel('Driver', 'bg-racing-surface2', 'py-1.5 min-h-14')}
            {renderDriverCells('driver-label', 'py-1.5 min-h-14', (driver) => (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-racing-text text-[11px] leading-tight whitespace-nowrap">
                  {formatDriverName(driver.driver_name).split(' ').pop()?.toUpperCase()}
                </span>
                <CarBadge num={driver.car_number} size="sm" />
              </div>
            ))}
          </div>

          <div className="grid border-b border-racing-border/50 bg-racing-bg" style={rowStyle}>
            <div className="px-3 py-1.5" style={{ gridColumn: `1 / span ${totalDrivers + 1}` }}>
              <span className="font-condensed font-semibold text-racing-yellow text-[12px] uppercase tracking-wider">
                Season Avg.
              </span>
            </div>
          </div>

          <div className="grid border-b border-racing-border/30 bg-racing-bg" style={rowStyle}>
            {renderStickyLabel(
              <>
                <span className="text-racing-text">Driver</span> <span className="text-racing-muted">Q</span>
              </>,
              'bg-racing-bg',
              'py-1 min-h-8',
            )}
            {renderDriverCells('season-qual', 'py-1 min-h-8 text-racing-text', (driver) => fmt(driver.avgQual))}
          </div>

          <div className="grid border-b border-racing-border/30 bg-racing-bg" style={rowStyle}>
            {renderStickyLabel(
              <>
                <span className="text-racing-text">Driver</span> <span className="text-racing-muted">F</span>
              </>,
              'bg-racing-bg',
              'py-1 min-h-8',
            )}
            {renderDriverCells('season-finish', 'py-1 min-h-8 text-racing-text', (driver) => fmt(driver.avgFinish))}
          </div>

          <div className="grid border-b border-racing-border/30 bg-racing-bg" style={rowStyle}>
            {renderStickyLabel(
              <>
                <span className="text-racing-text">Team</span> <span className="text-racing-muted">Q</span>
              </>,
              'bg-racing-bg',
              'py-1 min-h-8',
            )}
            {teams.map((team) => (
              <div
                key={`team-qual-${team.team}`}
                className="flex items-center justify-center px-2 py-1 text-racing-text border-l border-racing-border/30 min-h-8"
                style={{ gridColumn: `span ${team.drivers.length} / span ${team.drivers.length}` }}
              >
                {fmt(team.teamAvgQual)}
              </div>
            ))}
          </div>

          <div className="grid border-b border-racing-border/50 bg-racing-bg" style={rowStyle}>
            {renderStickyLabel(
              <>
                <span className="text-racing-text">Team</span> <span className="text-racing-muted">F</span>
              </>,
              'bg-racing-bg',
              'py-1 min-h-8',
            )}
            {teams.map((team) => (
              <div
                key={`team-season-finish-${team.team}`}
                className="flex items-center justify-center px-2 py-1 text-racing-text border-l border-racing-border/30 min-h-8"
                style={{ gridColumn: `span ${team.drivers.length} / span ${team.drivers.length}` }}
              >
                {fmt(team.teamAvgFinish)}
              </div>
            ))}
          </div>

          {trackTypes.map((trackType) => (
            <Fragment key={trackType}>
              <div className="grid border-b border-racing-border/30 bg-racing-bg" style={rowStyle}>
                {renderStickyLabel(
                  <>
                    <span className="text-racing-text">{TRACK_TYPE_LABELS[trackType]}</span>{' '}
                    <span className="text-racing-muted">Q</span>
                  </>,
                  'bg-racing-bg',
                  'py-1 min-h-8',
                )}
                {renderDriverCells(`${trackType}-qual`, 'py-1 min-h-8 text-racing-text', (driver) =>
                  fmt(driver.byTrackType[trackType].avgQual),
                )}
              </div>

              <div className="grid border-b border-racing-border/50 bg-racing-bg" style={rowStyle}>
                {renderStickyLabel(
                  <>
                    <span className="text-racing-text">{TRACK_TYPE_LABELS[trackType]}</span>{' '}
                    <span className="text-racing-muted">F</span>
                  </>,
                  'bg-racing-bg',
                  'py-1 min-h-8',
                )}
                {renderDriverCells(`${trackType}-finish`, 'py-1 min-h-8 text-racing-text', (driver) =>
                  fmt(driver.byTrackType[trackType].avgFinish),
                )}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopSeasonOverview;