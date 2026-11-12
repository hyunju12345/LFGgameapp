import { useSyncExternalStore } from "react";
import { avatarFor, preview } from "./data";
export const previewConversations = [
  { id: "party", name: "Team Korea", count: 5, preview: "Let’s queue up!", time: "Now", unread: 0, image: require("../assets/figma/b64d6.png") },
  { id: "jessica", name: "Jessica", preview: "Are you up for a game?", time: "32 min", unread: 12, image: require("../assets/figma/485dc.png") },
  { id: "team", name: "Team Parsons", count: 6, preview: "Anyone playing tonight?", time: "3 hours", unread: 30, image: require("../assets/figma/45c8e.png") },
  { id: "may", name: "May", preview: "One more round after dinner?", time: "1 day ago", unread: 0, image: require("../assets/figma/ccbff.png") },
  { id: "lemon", name: "Lemon", preview: "Want to duo this weekend?", time: "3 days ago", unread: 0, image: require("../assets/figma/5f269.png") },
];
export function getPreviewConversation(id: string) {
  const existing = previewConversations.find(thread => thread.id === id);
  if (existing) return existing;
  const player = preview.users.find(user => user.id === id);
  if (!player) return undefined;
  return { id: player.id, name: player.name, preview: "Hey! Want to play a few rounds together?", time: "Now", unread: 0,
    image: avatarFor(player.name) };
}
export const teamMessages: {
  body: string;
  time: string;
  name?: string;
  image?: import("react-native").ImageSourcePropType;
  date?: string;
}[] = [
  { body: "Anyone free tonight?", time: "11:30 AM" },
  { body: "Let’s play a few rounds.", time: "11:30 AM" },
  { body: "I’m in! Give me five.", time: "5:00", name: "Jessica", image: require("../assets/figma/c4138.png") },
  { body: "Just finishing dinner.", time: "5:00", name: "Jessica" },
  { body: "Sounds good!", time: "6:29", name: "Ian", image: require("../assets/figma/750be.png") },
  { body: "I’ll join your lobby.", time: "6:30", name: "Ian" },
  { body: "Nice, we have a full squad.", time: "8:00" },
  { body: "Want to keep it casual?", time: "8:00" },
  { body: "Same time tomorrow?", time: "7:20", date: "Tue Oct 27" },
  { body: "Absolutely!", time: "7:43", name: "Marin", image: require("../assets/figma/7c68a.png") },
  { body: "I can play after seven.", time: "7:43", name: "Marin" },
  { body: "Let’s queue up!", time: "7:20" },
];

type SentPreviewMessage = { body: string; time: string };
let sentMessages: Record<string, SentPreviewMessage[]> = {};
const sentListeners = new Set<() => void>();
const subscribeSent = (listener: () => void) => { sentListeners.add(listener); return () => { sentListeners.delete(listener); }; };
const getSent = () => sentMessages;
export function usePreviewMessages() { return useSyncExternalStore(subscribeSent, getSent, getSent); }
export function sendPreviewMessage(id: string, body: string) {
  sentMessages = { ...sentMessages, [id]: [...(sentMessages[id] || []), { body, time: "Now" }] };
  sentListeners.forEach(listener => listener());
}
