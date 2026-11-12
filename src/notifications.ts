import { useSyncExternalStore } from "react";
import { gameById } from "./data";
import { useStore } from "./store";

type Notification = { id: string; kind: "friend" | "party"; targetId: string; name: string; title: string; detail: string };
const previewNotifications: Notification[] = [
  { id: "friend-alex", kind: "friend", targetId: "alex", name: "Alex", title: "Alex sent you a friend request", detail: "Similar rank · Casual play" },
  { id: "party-may", kind: "party", targetId: "preview-party", name: "May", title: "May invited you to a party", detail: "May’s game · League of Legends" },
  { id: "friend-hailey", kind: "friend", targetId: "hailey", name: "Hailey", title: "Hailey sent you a friend request", detail: "Similar rank · Same goals" },
];
let completed: string[] = [];
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function useNotifications() {
  const { data, demo } = useStore();
  const dismissed = useSyncExternalStore(subscribe, () => completed, () => completed);
  const notifications: Notification[] = demo ? previewNotifications.filter(item => !dismissed.includes(item.id)) : [
    ...data.users.filter(user => user.incoming && user.friendStatus === "pending").map(user => ({
      id: `friend-${user.id}`, kind: "friend" as const, targetId: user.id, name: user.name,
      title: `${user.name} sent you a friend request`, detail: user.reason || "Connect and play together",
    })),
    ...data.parties.filter(party => party.invited && !party.members.some(member => member.id === data.user.id)).map(party => {
      const owner = data.users.find(user => user.id === party.owner)?.name || "A player";
      return { id: `party-${party.id}`, kind: "party" as const, targetId: party.id, name: owner,
        title: `${owner} invited you to a party`, detail: `${party.name} · ${gameById(party.game).name}` };
    }),
  ];
  return { notifications, completePreview: (id: string) => { completed = [...completed, id]; listeners.forEach(listener => listener()); } };
}
