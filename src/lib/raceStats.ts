import type { Tables } from '@/integrations/supabase/types';

type RacePositionRow = Tables<'race_positions'>;
type RaceResultRow = Tables<'race_results'>;
type FastestLapRow = Tables<'fastest_laps'>;

const isBetterFastestLapRow = (candidate: FastestLapRow, current: FastestLapRow) => {
  const candidateTime = parseLapTimeToSeconds(candidate.section_time || candidate.time);
  const currentTime = parseLapTimeToSeconds(current.section_time || current.time);
  const candidateSpeed = Number(candidate.section_speed ?? candidate.speed ?? 0);
  const currentSpeed = Number(current.section_speed ?? current.speed ?? 0);

  if (currentTime === null) {
    return candidateTime !== null || candidateSpeed > currentSpeed;
  }

  if (candidateTime !== null) {
    return candidateTime < currentTime || (candidateTime === currentTime && candidateSpeed > currentSpeed);
  }

  return candidateSpeed > currentSpeed;
};

export const parseLapTimeToSeconds = (value?: string | null): number | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const minuteMatch = trimmed.match(/^(\d+):(\d{2}\.\d+)$/);
  if (minuteMatch) {
    return Number(minuteMatch[1]) * 60 + Number(minuteMatch[2]);
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : null;
};

export const buildLapsLedStats = (
  positions: RacePositionRow[] | null | undefined,
  results?: RaceResultRow[] | null,
) => {
  if (!positions?.length) return [];

  const leaderRows = positions
    .filter((row) => row.position === 1)
    .sort((a, b) => a.lap_number - b.lap_number);

  if (!leaderRows.length) return [];

  const driverNames = new Map((results || []).map((row) => [row.car_number, row.driver_name]));
  const stats = new Map<string, {
    car_number: string;
    driver_name: string | null;
    laps_led: number;
    stints: number;
    longest_consecutive: number;
    start_lap_of_longest: number | null;
  }>();

  let streakCar: string | null = null;
  let streakStartLap = 0;
  let streakLength = 0;

  const finalizeStreak = () => {
    if (!streakCar || streakLength === 0) return;
    const entry = stats.get(streakCar);
    if (!entry) return;

    if (streakLength > entry.longest_consecutive) {
      entry.longest_consecutive = streakLength;
      entry.start_lap_of_longest = streakStartLap;
    }
  };

  for (const row of leaderRows) {
    if (!stats.has(row.car_number)) {
      stats.set(row.car_number, {
        car_number: row.car_number,
        driver_name: driverNames.get(row.car_number) || null,
        laps_led: 0,
        stints: 0,
        longest_consecutive: 0,
        start_lap_of_longest: null,
      });
    }

    const entry = stats.get(row.car_number)!;
    entry.laps_led += 1;

    if (streakCar !== row.car_number) {
      finalizeStreak();
      streakCar = row.car_number;
      streakStartLap = row.lap_number;
      streakLength = 1;
      entry.stints += 1;
    } else {
      streakLength += 1;
    }
  }

  finalizeStreak();

  return Array.from(stats.values()).sort((a, b) => b.laps_led - a.laps_led || a.car_number.localeCompare(b.car_number));
};

export const aggregateFastestLapRows = (rows: FastestLapRow[] | null | undefined) => {
  if (!rows?.length) return [];

  const bestByCar = new Map<string, FastestLapRow>();

  for (const row of rows) {
    const current = bestByCar.get(row.car_number);
    if (!current) {
      bestByCar.set(row.car_number, row);
      continue;
    }

    if (isBetterFastestLapRow(row, current)) {
      bestByCar.set(row.car_number, row);
    }
  }

  return Array.from(bestByCar.values())
    .sort((a, b) => {
      const aTime = parseLapTimeToSeconds(a.section_time || a.time);
      const bTime = parseLapTimeToSeconds(b.section_time || b.time);

      if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
      if (aTime !== null && bTime === null) return -1;
      if (aTime === null && bTime !== null) return 1;

      const speedDiff = Number(b.section_speed ?? b.speed ?? 0) - Number(a.section_speed ?? a.speed ?? 0);
      if (speedDiff !== 0) return speedDiff;

      return a.car_number.localeCompare(b.car_number);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
};

export const aggregateFastestLapSectionsByCar = (rows: FastestLapRow[] | null | undefined) => {
  if (!rows?.length) return [] as Array<{
    car_number: string;
    driver_name: string | null;
    sections: Record<string, FastestLapRow>;
  }>;

  const grouped = new Map<string, {
    car_number: string;
    driver_name: string | null;
    sections: Record<string, FastestLapRow>;
  }>();

  for (const row of rows) {
    const entry = grouped.get(row.car_number) || {
      car_number: row.car_number,
      driver_name: row.driver_name,
      sections: {},
    };

    const current = entry.sections[row.section_name];
    if (!current || isBetterFastestLapRow(row, current)) {
      entry.sections[row.section_name] = row;
    }

    if (!entry.driver_name && row.driver_name) {
      entry.driver_name = row.driver_name;
    }

    grouped.set(row.car_number, entry);
  }

  return Array.from(grouped.values());
};