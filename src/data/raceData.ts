export type Engine = 'Honda' | 'Chevy';
export type RaceStatus = 'Running' | 'Contact' | 'Mechanical';

export interface Driver {
  num: number; first: string; last: string; engine: Engine; rookie?: boolean;
}

export const drivers: Driver[] = [
  { num: 2, first: 'Josef', last: 'Newgarden', engine: 'Chevy' },
  { num: 3, first: 'Scott', last: 'McLaughlin', engine: 'Chevy' },
  { num: 4, first: 'Caio', last: 'Collet', engine: 'Chevy', rookie: true },
  { num: 5, first: 'Pato', last: "O'Ward", engine: 'Chevy' },
  { num: 6, first: 'Nolan', last: 'Siegel', engine: 'Chevy' },
  { num: 7, first: 'Christian', last: 'Lundgaard', engine: 'Chevy' },
  { num: 8, first: 'Kyffin', last: 'Simpson', engine: 'Honda' },
  { num: 9, first: 'Scott', last: 'Dixon', engine: 'Honda' },
  { num: 10, first: 'Alex', last: 'Palou', engine: 'Honda' },
  { num: 12, first: 'David', last: 'Malukas', engine: 'Chevy' },
  { num: 14, first: 'Santino', last: 'Ferrucci', engine: 'Chevy' },
  { num: 15, first: 'Graham', last: 'Rahal', engine: 'Honda' },
  { num: 18, first: 'Romain', last: 'Grosjean', engine: 'Honda' },
  { num: 19, first: 'Dennis', last: 'Hauger', engine: 'Honda', rookie: true },
  { num: 20, first: 'Alexander', last: 'Rossi', engine: 'Chevy' },
  { num: 21, first: 'Christian', last: 'Rasmussen', engine: 'Chevy' },
  { num: 26, first: 'Will', last: 'Power', engine: 'Honda' },
  { num: 27, first: 'Kyle', last: 'Kirkwood', engine: 'Honda' },
  { num: 28, first: 'Marcus', last: 'Ericsson', engine: 'Honda' },
  { num: 45, first: 'Louis', last: 'Foster', engine: 'Honda' },
  { num: 47, first: 'Mick', last: 'Schumacher', engine: 'Honda', rookie: true },
  { num: 60, first: 'Felix', last: 'Rosenqvist', engine: 'Honda' },
  { num: 66, first: 'Marcus', last: 'Armstrong', engine: 'Honda' },
  { num: 76, first: 'Rinus', last: 'VeeKay', engine: 'Chevy' },
  { num: 77, first: 'StingRay', last: 'Robb', engine: 'Chevy' },
];

export const driverMap: Record<number, Driver> = Object.fromEntries(drivers.map(d => [d.num, d]));

export const DRIVER_COLORS: Record<number, string> = {
  2: '#e74c3c', 3: '#2ecc71', 4: '#9b59b6', 5: '#ff8c00', 6: '#1abc9c',
  7: '#e67e22', 8: '#5dade2', 9: '#27ae60', 10: '#8e44ad', 12: '#c0392b',
  14: '#d4a017', 15: '#16a085', 18: '#95a5a6', 19: '#2980b9', 20: '#f1c40f',
  21: '#e91e63', 26: '#00bcd4', 27: '#4caf50', 28: '#ff5722', 45: '#795548',
  47: '#607d8b', 60: '#ab47bc', 66: '#00e676', 76: '#ff7043', 77: '#b0bec5',
};

export interface RaceResult {
  pos: number; sp: number; car: number; laps: number; gap: string;
  pits: number; elapsed: string; avgSpeed: number; status: RaceStatus;
  racePts: number; totalPts: number; champRank: number;
}

export const raceResults: RaceResult[] = [
  { pos:1, sp:2, car:2, laps:250, gap:'–.––', pits:5, elapsed:'01:51:14.4657', avgSpeed:134.842, status:'Running', racePts:51, totalPts:78, champRank:1 },
  { pos:2, sp:11, car:27, laps:250, gap:'+1.7937s', pits:3, elapsed:'01:51:16.2594', avgSpeed:134.806, status:'Running', racePts:41, totalPts:73, champRank:2 },
  { pos:3, sp:1, car:12, laps:250, gap:'+2.8412s', pits:4, elapsed:'01:51:17.3069', avgSpeed:134.785, status:'Running', racePts:39, totalPts:56, champRank:6 },
  { pos:4, sp:7, car:5, laps:250, gap:'+3.9318s', pits:5, elapsed:'01:51:18.3975', avgSpeed:134.763, status:'Running', racePts:33, totalPts:63, champRank:4 },
  { pos:5, sp:13, car:66, laps:250, gap:'+6.4815s', pits:3, elapsed:'01:51:20.9472', avgSpeed:134.711, status:'Running', racePts:31, totalPts:50, champRank:8 },
  { pos:6, sp:6, car:20, laps:250, gap:'+7.2911s', pits:6, elapsed:'01:51:21.7568', avgSpeed:134.695, status:'Running', racePts:28, totalPts:42, champRank:10 },
  { pos:7, sp:15, car:9, laps:250, gap:'+8.1647s', pits:4, elapsed:'01:51:22.6304', avgSpeed:134.678, status:'Running', racePts:27, totalPts:35, champRank:13 },
  { pos:8, sp:5, car:3, laps:250, gap:'+9.8786s', pits:5, elapsed:'01:51:24.3443', avgSpeed:134.643, status:'Running', racePts:24, totalPts:66, champRank:3 },
  { pos:9, sp:3, car:15, laps:250, gap:'+10.469s', pits:5, elapsed:'01:51:24.9347', avgSpeed:134.631, status:'Running', racePts:22, totalPts:34, champRank:15 },
  { pos:10, sp:19, car:8, laps:250, gap:'+12.1306s', pits:5, elapsed:'01:51:26.5963', avgSpeed:134.598, status:'Running', racePts:20, totalPts:35, champRank:14 },
  { pos:11, sp:21, car:14, laps:250, gap:'+16.836s', pits:5, elapsed:'01:51:31.3017', avgSpeed:134.503, status:'Running', racePts:19, totalPts:25, champRank:19 },
  { pos:12, sp:24, car:60, laps:250, gap:'+17.2139s', pits:4, elapsed:'01:51:31.6796', avgSpeed:134.495, status:'Running', racePts:18, totalPts:36, champRank:12 },
  { pos:13, sp:17, car:7, laps:250, gap:'+17.6584s', pits:5, elapsed:'01:51:32.1241', avgSpeed:134.486, status:'Running', racePts:18, totalPts:54, champRank:7 },
  { pos:14, sp:18, car:21, laps:250, gap:'+18.2862s', pits:5, elapsed:'01:51:32.7519', avgSpeed:134.474, status:'Running', racePts:17, totalPts:28, champRank:18 },
  { pos:15, sp:22, car:19, laps:250, gap:'+18.974s', pits:4, elapsed:'01:51:33.4397', avgSpeed:134.460, status:'Running', racePts:16, totalPts:36, champRank:11 },
  { pos:16, sp:25, car:26, laps:249, gap:'+1 lap', pits:4, elapsed:'01:51:33.1071', avgSpeed:133.929, status:'Running', racePts:15, totalPts:23, champRank:22 },
  { pos:17, sp:14, car:28, laps:249, gap:'+1 lap', pits:4, elapsed:'01:51:34.0977', avgSpeed:133.909, status:'Running', racePts:14, totalPts:43, champRank:9 },
  { pos:18, sp:4, car:47, laps:248, gap:'+2 laps', pits:3, elapsed:'01:51:34.9878', avgSpeed:133.353, status:'Running', racePts:12, totalPts:17, champRank:25 },
  { pos:19, sp:23, car:4, laps:248, gap:'+2 laps', pits:3, elapsed:'01:51:36.1321', avgSpeed:133.331, status:'Running', racePts:11, totalPts:24, champRank:21 },
  { pos:20, sp:9, car:6, laps:247, gap:'+3 laps', pits:5, elapsed:'01:51:35.3306', avgSpeed:132.809, status:'Running', racePts:10, totalPts:20, champRank:23 },
  { pos:21, sp:12, car:77, laps:246, gap:'+4 laps', pits:4, elapsed:'01:51:36.8855', avgSpeed:132.241, status:'Running', racePts:9, totalPts:18, champRank:24 },
  { pos:22, sp:8, car:76, laps:245, gap:'+5 laps', pits:4, elapsed:'01:51:32.6567', avgSpeed:131.786, status:'Running', racePts:8, totalPts:30, champRank:16 },
  { pos:23, sp:16, car:45, laps:140, gap:'+110 laps', pits:2, elapsed:'01:02:03.3776', avgSpeed:135.361, status:'Contact', racePts:7, totalPts:24, champRank:20 },
  { pos:24, sp:10, car:10, laps:21, gap:'+229 laps', pits:0, elapsed:'00:10:51.543', avgSpeed:116.032, status:'Contact', racePts:6, totalPts:59, champRank:5 },
  { pos:25, sp:20, car:18, laps:0, gap:'+250 laps', pits:0, elapsed:'00:00:00.000', avgSpeed:0, status:'Mechanical', racePts:5, totalPts:29, champRank:17 },
];

export const cautions = [
  { num: 1, startLap: 11, endLap: 19, laps: 9, reason: 'Spin: Car 19 on Backstretch' },
  { num: 2, startLap: 22, endLap: 29, laps: 8, reason: 'Contact: Cars 10 and 76 in Turn 4' },
  { num: 3, startLap: 142, endLap: 154, laps: 13, reason: 'Contact: Car 45 in Turn 4' },
  { num: 4, startLap: 207, endLap: 217, laps: 11, reason: 'Contact: Cars 21 and 26 in Turn 2' },
];

export const penalties = [
  { car: 21, infraction: 'Improper Pit Entry', lap: 20, penalty: 'Restart at Back of Field' },
  { car: 8, infraction: 'Improper Pit Entry', lap: 20, penalty: 'Restart at Back of Field' },
  { car: 14, infraction: 'Improper Pit Entry', lap: 20, penalty: 'Restart at Back of Field' },
  { car: 60, infraction: 'Improper Pit Entry', lap: 20, penalty: 'Restart at Back of Field' },
  { car: 6, infraction: 'Blocking', lap: 194, penalty: 'Drive-Through' },
  { car: 26, infraction: 'Emergency Service in Closed Pit', lap: 211, penalty: 'Restart at Back of Field' },
  { car: 77, infraction: 'Failure to Follow Direction of INDYCAR', lap: 218, penalty: 'Drive-Through' },
];

export const sessionStats = [
  { session: 'Practice 1', laps: 774, miles: 774.00, time: '1:00:15' },
  { session: 'Qualifying', laps: 47, miles: 47.00, time: '1:02:00' },
  { session: 'Practice Final', laps: 1762, miles: 1762.00, time: '0:50:27' },
  { session: 'Race', laps: 5643, miles: 5643.00, time: '1:51:42' },
  { session: 'Totals', laps: 8226, miles: 8226.00, time: '4:44:25' },
];

export const practice1Top5 = [
  { pos: 1, car: 12, time: '20.5005', speed: 175.605, laps: 17 },
  { pos: 2, car: 5, time: '20.6350', speed: 174.461, laps: 26 },
  { pos: 3, car: 2, time: '20.6829', speed: 174.057, laps: 19 },
  { pos: 4, car: 21, time: '20.6936', speed: 173.967, laps: 30 },
  { pos: 5, car: 26, time: '20.7100', speed: 173.829, laps: 29 },
];

export const qualifyingTop5 = [
  { pos: 1, car: 12, time: '20.4928', speed: 175.671, note: 'Pole' },
  { pos: 2, car: 2, time: '20.6046', speed: 174.718, note: '' },
  { pos: 3, car: 15, time: '20.6391', speed: 174.426, note: '' },
  { pos: 4, car: 47, time: '20.7163', speed: 173.776, note: '' },
  { pos: 5, car: 3, time: '20.6868', speed: 174.024, note: '' },
];

export const practiceFinalTop5 = [
  { pos: 1, car: 2, time: '21.4699', speed: 167.677, laps: 40 },
  { pos: 2, car: 66, time: '21.5361', speed: 167.161, laps: 64 },
  { pos: 3, car: 5, time: '21.5926', speed: 166.724, laps: 101 },
  { pos: 4, car: 10, time: '21.6611', speed: 166.197, laps: 83 },
  { pos: 5, car: 12, time: '21.7662', speed: 165.394, laps: 97 },
];

export const weekendStory = [
  { car: 2, qualPos: 2, finishPos: 1, change: 1 },
  { car: 27, qualPos: 11, finishPos: 2, change: 9 },
  { car: 12, qualPos: 1, finishPos: 3, change: -2 },
  { car: 5, qualPos: 7, finishPos: 4, change: 3 },
  { car: 66, qualPos: 13, finishPos: 5, change: 8 },
  { car: 20, qualPos: 6, finishPos: 6, change: 0 },
  { car: 9, qualPos: 15, finishPos: 7, change: 8 },
  { car: 3, qualPos: 5, finishPos: 8, change: -3 },
  { car: 15, qualPos: 3, finishPos: 9, change: -6 },
  { car: 8, qualPos: 19, finishPos: 10, change: 9 },
  { car: 14, qualPos: 21, finishPos: 11, change: 10 },
  { car: 60, qualPos: 24, finishPos: 12, change: 12 },
  { car: 7, qualPos: 17, finishPos: 13, change: 4 },
  { car: 21, qualPos: 18, finishPos: 14, change: 4 },
  { car: 19, qualPos: 22, finishPos: 15, change: 7 },
  { car: 26, qualPos: 25, finishPos: 16, change: 9 },
  { car: 28, qualPos: 14, finishPos: 17, change: -3 },
  { car: 47, qualPos: 4, finishPos: 18, change: -14 },
  { car: 4, qualPos: 23, finishPos: 19, change: 4 },
  { car: 6, qualPos: 9, finishPos: 20, change: -11 },
  { car: 77, qualPos: 12, finishPos: 21, change: -9 },
  { car: 76, qualPos: 8, finishPos: 22, change: -14 },
  { car: 45, qualPos: 16, finishPos: 23, change: -7 },
  { car: 10, qualPos: 10, finishPos: 24, change: -14 },
  { car: 18, qualPos: 20, finishPos: 25, change: -5 },
];

export const CAUTION_RANGES: [number, number][] = [[11,19],[22,29],[142,154],[207,217]];

export const positionSnapshots: { lap: number; order: number[] }[] = [
  { lap: 1, order: [12,2,20,15,76,10,47,3,5,27,66,6,77,9,28,45,19,21,8,4,7,60,26,14] },
  { lap: 2, order: [12,2,20,10,15,76,3,5,47,27,66,77,6,9,28,19,45,21,4,8,60,7,26,14] },
  { lap: 5, order: [12,2,20,10,76,15,3,5,27,47,66,77,9,28,6,45,21,19,4,8,7,60,26,14] },
  { lap: 10, order: [12,2,20,10,15,76,3,5,27,47,66,6,9,28,77,45,21,19,8,4,7,60,26,14] },
  { lap: 20, order: [12,2,20,15,3,5,10,76,27,47,66,28,6,77,9,45,21,19,7,60,4,8,26,14] },
  { lap: 30, order: [12,2,20,15,3,5,27,66,28,47,6,77,9,7,60,26,21,19,8,4,45,76,14,10] },
  { lap: 40, order: [12,2,20,15,5,3,27,66,28,47,6,9,7,77,60,26,21,19,8,45,4,76,14] },
  { lap: 50, order: [12,2,20,15,3,5,27,66,28,47,6,9,7,77,60,26,21,19,8,45,4,76,14] },
  { lap: 60, order: [12,2,20,15,5,3,27,66,28,9,47,6,7,77,60,26,21,19,8,45,4,76,14] },
  { lap: 70, order: [12,2,20,15,5,3,28,66,9,27,47,6,7,77,60,26,21,19,8,4,45,76,14] },
  { lap: 73, order: [21,20,12,2,66,9,5,3,60,27,14,6,19,7,28,77,8,4,45,47,76,15,26] },
  { lap: 77, order: [66,9,21,20,2,5,3,27,12,6,47,28,77,8,4,45,19,7,60,76,15,26,14] },
  { lap: 85, order: [9,66,21,20,19,2,5,27,3,12,28,15,7,6,77,60,8,4,14,45,47,76,26] },
  { lap: 97, order: [19,5,9,21,2,66,20,27,3,12,15,28,7,60,6,8,4,77,45,47,76,26,14] },
  { lap: 108, order: [21,5,2,12,20,27,3,15,9,66,7,28,8,14,6,4,77,60,45,19,47,76,26] },
  { lap: 126, order: [2,21,12,5,20,27,3,15,9,66,7,28,8,14,6,4,77,60,45,19,47,76,26] },
  { lap: 128, order: [7,21,2,12,5,20,27,3,15,9,66,28,8,14,6,4,77,60,45,19,47,76,26] },
  { lap: 136, order: [21,7,2,12,5,20,27,3,15,9,66,28,8,14,6,4,77,60,45,19,47,76,26] },
  { lap: 155, order: [27,21,9,66,5,2,12,20,3,15,8,14,60,7,19,28,47,4,6,77,45,76,26] },
  { lap: 191, order: [21,27,9,66,5,2,12,20,3,15,8,14,60,7,19,28,47,4,6,77,45,76,26] },
  { lap: 197, order: [26,21,27,9,66,5,2,12,20,3,15,8,14,60,7,19,28,47,4,6,77,76,45] },
  { lap: 218, order: [21,27,2,12,5,66,20,9,3,15,8,14,60,7,19,28,47,4,6,77,76,26] },
  { lap: 242, order: [27,21,2,12,5,66,20,9,3,15,8,14,60,7,19,28,47,4,6,77,76,26] },
  { lap: 244, order: [2,27,12,5,66,20,9,3,15,8,14,60,7,21,19,28,47,4,6,77,76,26] },
  { lap: 250, order: [2,27,12,5,66,20,9,3,15,8,14,60,7,21,19,26,28,47,4,6,77,76] },
];

export function generatePositionChartData() {
  const allCars = [...new Set(positionSnapshots.flatMap(s => s.order))];
  const snapData: { lap: number; [key: string]: number }[] = [];

  for (const snap of positionSnapshots) {
    const entry: Record<string, number> = { lap: snap.lap };
    snap.order.forEach((car, idx) => { entry[`car${car}`] = idx + 1; });
    snapData.push(entry as any);
  }

  // Insert caution period entries
  for (const [start, end] of CAUTION_RANGES) {
    const makeCautionEntry = (lap: number) => {
      const entry: Record<string, number> = { lap };
      allCars.forEach(car => { entry[`car${car}`] = 25; });
      return entry as any;
    };
    // Only add if not already a snapshot at that lap
    if (!snapData.find(d => d.lap === start)) snapData.push(makeCautionEntry(start));
    if (!snapData.find(d => d.lap === end)) snapData.push(makeCautionEntry(end));
  }

  snapData.sort((a, b) => a.lap - b.lap);
  return { data: snapData, cars: allCars };
}

export const lapsLedStats = [
  { car: 12, lapsLed: 73 }, { car: 21, lapsLed: 69 }, { car: 27, lapsLed: 47 },
  { car: 9, lapsLed: 12 }, { car: 5, lapsLed: 10 }, { car: 26, lapsLed: 10 },
  { car: 2, lapsLed: 8 }, { car: 66, lapsLed: 8 }, { car: 7, lapsLed: 8 },
  { car: 19, lapsLed: 3 }, { car: 28, lapsLed: 2 },
];

export const leaderSequence = [
  { car: 12, startLap: 1, endLap: 72 }, { car: 21, startLap: 73, endLap: 76 },
  { car: 66, startLap: 77, endLap: 84 }, { car: 9, startLap: 85, endLap: 96 },
  { car: 19, startLap: 97, endLap: 97 }, { car: 5, startLap: 98, endLap: 107 },
  { car: 21, startLap: 108, endLap: 125 }, { car: 2, startLap: 126, endLap: 126 },
  { car: 12, startLap: 127, endLap: 127 }, { car: 7, startLap: 128, endLap: 135 },
  { car: 21, startLap: 136, endLap: 141 }, { car: -1, startLap: 142, endLap: 154 },
  { car: 27, startLap: 155, endLap: 190 }, { car: 21, startLap: 191, endLap: 192 },
  { car: 19, startLap: 193, endLap: 194 }, { car: 28, startLap: 195, endLap: 196 },
  { car: 26, startLap: 197, endLap: 206 }, { car: -1, startLap: 207, endLap: 217 },
  { car: 21, startLap: 218, endLap: 241 }, { car: 27, startLap: 242, endLap: 243 },
  { car: 2, startLap: 244, endLap: 250 },
];

export const pitStopsByDriver: { car: number; stops: number[] }[] = [
  { car: 2, stops: [73,127,146,190,212] },
  { car: 27, stops: [71,128,192] },
  { car: 12, stops: [73,128,146,189] },
  { car: 5, stops: [69,121,146,190,212] },
  { car: 66, stops: [85,146,193] },
  { car: 20, stops: [75,114,146,152,185,212] },
  { car: 9, stops: [13,97,146,192] },
  { car: 3, stops: [69,128,146,192,212] },
  { car: 15, stops: [71,124,146,191,212] },
  { car: 8, stops: [13,100,146,195,212] },
  { car: 14, stops: [13,28,82,146,192] },
  { car: 60, stops: [13,97,146,193] },
  { car: 7, stops: [13,73,142,191,212] },
  { car: 21, stops: [13,77,126,146,193] },
  { car: 19, stops: [13,99,146,195] },
  { car: 26, stops: [72,128,191,209,216] },
  { car: 28, stops: [71,116,152,198,216] },
  { car: 47, stops: [72,142,216] },
  { car: 4, stops: [81,139,200,216] },
  { car: 6, stops: [74,126,152,195,197,213,216] },
  { car: 77, stops: [62,123,152,205,218,221] },
  { car: 76, stops: [32,92,153,207,216] },
  { car: 45, stops: [77,122] },
  { car: 10, stops: [] },
  { car: 18, stops: [] },
];

export const pitTransitTimes = [
  { rank:1, car:47, time:'18.2117', speed:57.206 },
  { rank:2, car:3, time:'18.2204', speed:57.178 },
  { rank:3, car:77, time:'18.2696', speed:57.024 },
  { rank:4, car:4, time:'18.3089', speed:56.902 },
  { rank:5, car:6, time:'18.3236', speed:56.856 },
  { rank:6, car:28, time:'18.3294', speed:56.838 },
  { rank:7, car:76, time:'18.3536', speed:56.764 },
  { rank:8, car:26, time:'18.3717', speed:56.708 },
  { rank:9, car:14, time:'27.3690', speed:38.066 },
  { rank:10, car:12, time:'27.5516', speed:37.813 },
  { rank:11, car:15, time:'28.0658', speed:37.120 },
  { rank:12, car:19, time:'28.1129', speed:37.058 },
  { rank:13, car:9, time:'28.3201', speed:36.787 },
  { rank:14, car:8, time:'28.3232', speed:36.783 },
  { rank:15, car:45, time:'28.3836', speed:36.705 },
  { rank:16, car:2, time:'28.5203', speed:36.529 },
  { rank:17, car:5, time:'28.6971', speed:36.304 },
  { rank:18, car:7, time:'28.7108', speed:36.287 },
  { rank:19, car:21, time:'28.7901', speed:36.187 },
  { rank:20, car:20, time:'28.9457', speed:35.992 },
  { rank:21, car:27, time:'29.2282', speed:35.644 },
  { rank:22, car:66, time:'29.5380', speed:35.270 },
  { rank:23, car:60, time:'29.6739', speed:35.109 },
];

export const fastestLaps = [
  { rank:1, car:26, time:'00:21.8686', speed:164.620, lap:192 },
  { rank:2, car:12, time:'00:21.9784', speed:163.797, lap:2 },
  { rank:3, car:5, time:'00:22.1306', speed:162.671, lap:191 },
  { rank:4, car:9, time:'00:22.2554', speed:161.758, lap:158 },
  { rank:5, car:27, time:'00:22.2597', speed:161.727, lap:158 },
  { rank:6, car:66, time:'00:22.2718', speed:161.639, lap:196 },
  { rank:7, car:20, time:'00:22.3103', speed:161.360, lap:115 },
  { rank:8, car:2, time:'00:22.3134', speed:161.338, lap:192 },
  { rank:9, car:21, time:'00:22.3818', speed:160.845, lap:161 },
  { rank:10, car:7, time:'00:22.4058', speed:160.673, lap:193 },
  { rank:11, car:15, time:'00:22.4344', speed:160.468, lap:192 },
  { rank:12, car:19, time:'00:22.4488', speed:160.365, lap:197 },
  { rank:13, car:3, time:'00:22.5091', speed:159.935, lap:194 },
  { rank:14, car:10, time:'00:22.5125', speed:159.911, lap:2 },
  { rank:15, car:14, time:'00:22.5297', speed:159.789, lap:83 },
  { rank:16, car:60, time:'00:22.5499', speed:159.646, lap:196 },
  { rank:17, car:76, time:'00:22.7136', speed:158.495, lap:6 },
  { rank:18, car:8, time:'00:22.7675', speed:158.120, lap:200 },
  { rank:19, car:45, time:'00:22.8736', speed:157.387, lap:83 },
  { rank:20, car:6, time:'00:22.8857', speed:157.303, lap:78 },
  { rank:21, car:28, time:'00:22.9366', speed:156.954, lap:200 },
  { rank:22, car:77, time:'00:23.0077', speed:156.469, lap:220 },
  { rank:23, car:47, time:'00:23.1155', speed:155.740, lap:74 },
  { rank:24, car:4, time:'00:23.1441', speed:155.547, lap:84 },
];

export const trackSections = [
  { name: 'Full Lap', distance: '1.000 mi' },
  { name: 'Dogleg', distance: '0.061 mi' },
  { name: 'Front Stretch', distance: '0.079 mi' },
  { name: 'Turn 1 Entry', distance: '0.138 mi' },
  { name: 'Turn 1 Exit', distance: '0.120 mi' },
  { name: 'Turn 2 Entry', distance: '0.120 mi' },
  { name: 'Turn 2 Exit', distance: '0.127 mi' },
  { name: 'Turn 3 Entry', distance: '0.140 mi' },
  { name: 'Turn 3 Exit', distance: '0.113 mi' },
  { name: 'Turn 4', distance: '0.102 mi' },
  { name: 'Turn 1 Full', distance: '0.278 mi' },
  { name: 'Turn 2 Full', distance: '0.240 mi' },
  { name: 'Back Stretch', distance: '0.266 mi' },
];

export const sectionResults: Record<string, { rank: number; car: number; time: string; speed: number; lap: number }[]> = {
  'Dogleg': [
    { rank:1, car:9, time:'1.2981', speed:170.180, lap:158 },
    { rank:2, car:15, time:'1.3066', speed:169.073, lap:156 },
    { rank:3, car:20, time:'1.3080', speed:168.892, lap:158 },
    { rank:4, car:21, time:'1.3110', speed:168.505, lap:156 },
    { rank:5, car:5, time:'1.3114', speed:168.454, lap:158 },
  ],
  'Front Stretch': [
    { rank:1, car:21, time:'1.6645', speed:171.223, lap:20 },
    { rank:2, car:9, time:'1.6646', speed:171.213, lap:158 },
    { rank:3, car:20, time:'1.6652', speed:171.151, lap:221 },
    { rank:4, car:15, time:'1.6734', speed:170.313, lap:156 },
    { rank:5, car:14, time:'1.6762', speed:170.028, lap:220 },
  ],
  'Turn 1 Entry': [
    { rank:1, car:5, time:'2.7420', speed:181.023, lap:222 },
    { rank:2, car:21, time:'2.7469', speed:180.700, lap:205 },
    { rank:3, car:2, time:'2.7472', speed:180.680, lap:223 },
    { rank:4, car:14, time:'2.7552', speed:180.155, lap:220 },
    { rank:5, car:12, time:'2.7636', speed:179.608, lap:90 },
  ],
  'Turn 1 Exit': [
    { rank:1, car:12, time:'2.5892', speed:167.215, lap:1 },
    { rank:2, car:26, time:'2.6516', speed:163.280, lap:191 },
    { rank:3, car:20, time:'2.6671', speed:162.331, lap:114 },
    { rank:4, car:10, time:'2.6760', speed:161.791, lap:1 },
    { rank:5, car:5, time:'2.6815', speed:161.460, lap:71 },
  ],
  'Turn 2 Entry': [
    { rank:1, car:5, time:'2.7406', speed:156.983, lap:190 },
    { rank:2, car:7, time:'2.7676', speed:155.452, lap:192 },
    { rank:3, car:26, time:'2.7781', speed:154.864, lap:191 },
    { rank:4, car:20, time:'2.7804', speed:154.736, lap:0 },
    { rank:5, car:12, time:'2.7805', speed:154.731, lap:1 },
  ],
  'Turn 2 Exit': [
    { rank:1, car:20, time:'2.6236', speed:173.860, lap:0 },
    { rank:2, car:26, time:'2.6572', speed:171.661, lap:191 },
    { rank:3, car:9, time:'2.6650', speed:171.159, lap:157 },
    { rank:4, car:12, time:'2.6659', speed:171.101, lap:0 },
    { rank:5, car:5, time:'2.6671', speed:171.024, lap:190 },
  ],
  'Turn 3 Entry': [
    { rank:1, car:26, time:'2.9068', speed:173.105, lap:191 },
    { rank:2, car:12, time:'2.9312', speed:171.664, lap:0 },
    { rank:3, car:5, time:'2.9377', speed:171.285, lap:191 },
    { rank:4, car:2, time:'2.9427', speed:170.994, lap:226 },
    { rank:5, car:21, time:'2.9517', speed:170.472, lap:198 },
  ],
  'Turn 3 Exit': [
    { rank:1, car:26, time:'2.6552', speed:153.559, lap:191 },
    { rank:2, car:5, time:'2.6820', speed:152.024, lap:68 },
    { rank:3, car:12, time:'2.7023', speed:150.882, lap:0 },
    { rank:4, car:20, time:'2.7117', speed:150.359, lap:114 },
    { rank:5, car:27, time:'2.7367', speed:148.986, lap:156 },
  ],
  'Turn 4': [
    { rank:1, car:9, time:'2.3235', speed:158.166, lap:157 },
    { rank:2, car:20, time:'2.3239', speed:158.139, lap:114 },
    { rank:3, car:27, time:'2.3395', speed:157.084, lap:156 },
    { rank:4, car:12, time:'2.3438', speed:156.796, lap:155 },
    { rank:5, car:5, time:'2.3469', speed:156.589, lap:69 },
  ],
  'Turn 1 Full': [
    { rank:1, car:5, time:'5.7349', speed:174.767, lap:222 },
    { rank:2, car:15, time:'5.7512', speed:174.272, lap:156 },
    { rank:3, car:14, time:'5.7524', speed:174.236, lap:220 },
    { rank:4, car:2, time:'5.7554', speed:174.145, lap:223 },
    { rank:5, car:20, time:'5.7672', speed:173.788, lap:221 },
  ],
  'Turn 2 Full': [
    { rank:1, car:12, time:'5.3697', speed:160.750, lap:1 },
    { rank:2, car:26, time:'5.4297', speed:158.974, lap:191 },
    { rank:3, car:5, time:'5.4352', speed:158.813, lap:190 },
    { rank:4, car:66, time:'5.5780', speed:154.747, lap:195 },
    { rank:5, car:7, time:'5.5851', speed:154.550, lap:192 },
  ],
  'Back Stretch': [
    { rank:1, car:26, time:'5.5640', speed:172.415, lap:191 },
    { rank:2, car:12, time:'5.5971', speed:171.395, lap:0 },
    { rank:3, car:2, time:'5.6188', speed:170.733, lap:226 },
    { rank:4, car:5, time:'5.6194', speed:170.715, lap:191 },
    { rank:5, car:21, time:'5.6341', speed:170.270, lap:198 },
  ],
};

export const championshipStandings = [
  { rank:1, car:2, r1:27, r2:51, total:78, gap:'—' },
  { rank:2, car:27, r1:32, r2:41, total:73, gap:'-5' },
  { rank:3, car:3, r1:42, r2:24, total:66, gap:'-12' },
  { rank:4, car:5, r1:30, r2:33, total:63, gap:'-15' },
  { rank:5, car:10, r1:53, r2:6, total:59, gap:'-19' },
  { rank:6, car:12, r1:17, r2:39, total:56, gap:'-22' },
  { rank:7, car:7, r1:36, r2:18, total:54, gap:'-24' },
  { rank:8, car:66, r1:19, r2:31, total:50, gap:'-28' },
  { rank:9, car:28, r1:29, r2:14, total:43, gap:'-35' },
  { rank:10, car:20, r1:14, r2:28, total:42, gap:'-36' },
  { rank:11, car:19, r1:20, r2:16, total:36, gap:'-42' },
  { rank:12, car:60, r1:18, r2:18, total:36, gap:'-42' },
  { rank:13, car:9, r1:8, r2:27, total:35, gap:'-43' },
  { rank:14, car:8, r1:15, r2:20, total:35, gap:'-43' },
  { rank:15, car:15, r1:12, r2:22, total:34, gap:'-44' },
  { rank:16, car:76, r1:22, r2:8, total:30, gap:'-48' },
  { rank:17, car:18, r1:24, r2:5, total:29, gap:'-49' },
  { rank:18, car:21, r1:11, r2:17, total:28, gap:'-50' },
  { rank:19, car:14, r1:6, r2:19, total:25, gap:'-53' },
  { rank:20, car:4, r1:13, r2:11, total:24, gap:'-54' },
  { rank:21, car:45, r1:17, r2:7, total:24, gap:'-54' },
  { rank:22, car:26, r1:8, r2:15, total:23, gap:'-55' },
  { rank:23, car:6, r1:10, r2:10, total:20, gap:'-58' },
  { rank:24, car:77, r1:9, r2:9, total:18, gap:'-60' },
  { rank:25, car:47, r1:5, r2:12, total:17, gap:'-61' },
];
