import { useCallback, useSyncExternalStore } from "react";
import { Player } from "./data";
const drafts = new Map<string, Player[]>();
const listeners = new Set<() => void>();
const empty: Player[] = [];
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
let next = 0;
export const createInviteDraft = () => `party-draft-${++next}`;
export function useDraftInvitees(id: string) {
  const snapshot = useCallback(() => drafts.get(id) || empty, [id]);
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
export function addDraftInvitee(id: string, player: Player, limit: number) {
  const current = drafts.get(id) || empty;
  if (current.some(p => p.id === player.id) || current.length >= limit) return;
  drafts.set(id, [...current, player]);
  listeners.forEach(listener => listener());
}
