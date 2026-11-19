import type { Player } from "./data";

type Preferences = { games: string[]; rank: number; goal: "For fun" | "Competitive"; hours: [number, number]; voice: boolean };
const yours: Preferences = { games: ["League of Legends", "Valorant", "Overwatch"], rank: 3, goal: "For fun", hours: [20, 24], voice: true };
// Demo preferences belong to each player; the UI renders the comparison result.
const profiles: Record<string, Preferences> = {
  alex: { games: [...yours.games], rank: 3, goal: "For fun", hours: [21, 24], voice: false },
  hailey: { games: ["League of Legends", "Valorant"], rank: 2.5, goal: "For fun", hours: [20, 24], voice: true },
  eric: { games: ["League of Legends", "Overwatch"], rank: 2, goal: "For fun", hours: [22, 24], voice: false },
  phill: { games: ["League of Legends"], rank: 3, goal: "For fun", hours: [19, 23], voice: true },
  luke: { games: [...yours.games], rank: 6, goal: "Competitive", hours: [20, 24], voice: true },
  gloria: { games: ["Valorant", "Overwatch"], rank: 2, goal: "For fun", hours: [18, 22], voice: true },
};
export function previewMatchFor(id: string): Pick<Player, "match" | "reason" | "compatibility" | "playPreferences"> {
  const other = profiles[id];
  if (!other) return {};
  const common = yours.games.filter(game => other.games.includes(game));
  const rankDistance = Math.abs(yours.rank - other.rank);
  const overlap = Math.max(0, Math.min(yours.hours[1], other.hours[1]) - Math.max(yours.hours[0], other.hours[0]));
  const availability = overlap / (yours.hours[1] - yours.hours[0]);
  const sameGoal = yours.goal === other.goal;
  const sameVoice = yours.voice === other.voice;
  const rankScore = rankDistance === 0 ? 1 : rankDistance <= 1 ? 1 - rankDistance * .2 : 0;
  const match = Math.round(30 * common.length / yours.games.length + 20 * rankScore + 27 * Number(sameGoal) + 20 * availability + 3 * Number(sameVoice));
  const compatibility: NonNullable<Player["compatibility"]> = [
    { label: `${common.length} ${common.length === 1 ? "game" : "games"} in common`, status: common.length ? "match" : "different" },
    { label: rankDistance === 0 ? `Same rank in ${common[0] || "your games"}` : rankDistance <= 1 ? "Similar rank, slightly different tier" : "Different competitive ranks", status: rankDistance === 0 ? "match" : rankDistance <= 1 ? "partial" : "different" },
    { label: sameGoal ? "Both play for fun" : "Prefers competitive play", status: sameGoal ? "match" : "different" },
    { label: availability === 1 ? "Same evening play schedule" : availability > 0 ? `Play schedules overlap for ${overlap} ${overlap === 1 ? "hour" : "hours"}` : "Different play schedules", status: availability === 1 ? "match" : availability > 0 ? "partial" : "different" },
    { label: sameVoice ? "Both prefer voice chat" : "Prefers playing without voice chat", status: sameVoice ? "match" : "different" },
  ];
  const reason = compatibility.filter(item => item.status === "match").slice(0, 2).map(item => item.label).join(" • ") || "Discover a different playstyle";
  return { match, compatibility, reason, playPreferences: [other.goal, `${other.hours[0]}:00–${other.hours[1]}:00`, other.voice ? "Voice chat" : "No mic"] };
}
