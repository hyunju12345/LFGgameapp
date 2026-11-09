import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export type Preferences = {
  looking: string;
  online: string;
  ready: boolean;
  notifications: boolean;
  games?: { game: string; rank: string; role: string }[];
};
const defaults: Preferences = {
  looking: "Friends to ply with",
  online: "Evening • 7–11 PM",
  ready: false,
  notifications: false,
};
const keyFor = (id: string) => `partyup.preferences.${id}`;

export async function savePreferences(id: string, value: Preferences) {
  const json = JSON.stringify(value);
  if (Platform.OS === "web") localStorage.setItem(keyFor(id), json);
  else await SecureStore.setItemAsync(keyFor(id), json);
}
export function usePreferences(id: string) {
  const [preferences, setPreferences] = useState(defaults);
  useFocusEffect(useCallback(() => {
    let active = true;
    async function read() {
      const raw = Platform.OS === "web"
        ? localStorage.getItem(keyFor(id))
        : await SecureStore.getItemAsync(keyFor(id));
      if (active) setPreferences(raw ? { ...defaults, ...JSON.parse(raw) } : defaults);
    }
    void read().catch(() => { if (active) setPreferences(defaults); });
    return () => { active = false; };
  }, [id]));
  return [preferences, setPreferences] as const;
}
