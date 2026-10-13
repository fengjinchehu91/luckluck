import { useEffect, useState, useSyncExternalStore } from "react";
import { mock } from "../services";
import type { Round } from "../types";
export const useApp = () =>
  useSyncExternalStore(mock.subscribe, mock.getSnapshot);
export function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function remaining(round: Round, now: number) {
  const seconds = Math.max(0, Math.floor((round.closesAt - now) / 1000));
  return {
    hours: Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0"),
    minutes: Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0"),
    seconds: (seconds % 60).toString().padStart(2, "0"),
  };
}
