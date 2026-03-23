import { createContext, useContext } from 'react';

interface RaceContextType {
  raceId: string | null;
  setRaceId: (id: string) => void;
}

export const RaceContext = createContext<RaceContextType>({ raceId: null, setRaceId: () => {} });
export const useRaceContext = () => useContext(RaceContext);
