'use client';
import { useCallback, useRef, useState } from 'react';
import { emptyHistory, recordHistory, stepHistory, type BoardHistory } from '../application/history';
import type { Investigation } from '../domain/model';

/** Each investigation owns its session history; changing boards does not mix actions. */
export function useBoardHistory() {
  const [histories, setHistories] = useState<Record<string, BoardHistory>>({});
  const latest = useRef(histories);
  const record = useCallback((before: Investigation, after: Investigation, label: string) => {
    const previous = latest.current[before.id] ?? emptyHistory();
    const history = recordHistory(previous, before, after, label);
    if (history === previous) return;
    const next = { ...latest.current, [before.id]: history };
    latest.current = next; setHistories(next);
  }, []);
  const step = useCallback((board: Investigation, direction: 'undo' | 'redo', now: string) => {
    const result = stepHistory(latest.current[board.id] ?? emptyHistory(), board, direction, now);
    if (result) {
      const next = { ...latest.current, [board.id]: result.history };
      latest.current = next; setHistories(next);
    }
    return result;
  }, []);
  const reset = useCallback((id: string) => {
    const next = { ...latest.current, [id]: emptyHistory() };
    latest.current = next; setHistories(next);
  }, []);
  return { histories, record, step, reset };
}
