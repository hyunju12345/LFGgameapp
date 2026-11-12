import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Bootstrap, preview, registerGames } from "./data";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const publicApi = process.env.EXPO_PUBLIC_API_URL;
export const apiUrl = publicApi || (Platform.OS === "web" && !__DEV__ ? "" : `http://${host}:8787`);
type Store = {
  data: Bootstrap;
  demo: boolean;
  loading: boolean;
  error: string;
  request: <T>(route: string, method?: string, body?: unknown) => Promise<T>;
  refresh: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};
const Context = createContext<Store | null>(null);
const storage = {
  get: () =>
    Platform.OS === "web"
      ? Promise.resolve(sessionStorage.getItem("partyup-token"))
      : SecureStore.getItemAsync("partyup-token"),
  set: (v: string) =>
    Platform.OS === "web"
      ? Promise.resolve(sessionStorage.setItem("partyup-token", v))
      : SecureStore.setItemAsync("partyup-token", v),
  remove: () =>
    Platform.OS === "web"
      ? Promise.resolve(sessionStorage.removeItem("partyup-token"))
      : SecureStore.deleteItemAsync("partyup-token"),
};
export function Provider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Bootstrap>(preview);
  const [token, setToken] = useState("");
  const tokenRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const request = useCallback(
    async <T,>(route: string, method = "GET", body?: unknown): Promise<T> => {
      if (!apiUrl) throw new Error("Online features need a connected server. You can explore this site in guest mode.");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(apiUrl + route, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(tokenRef.current
              ? { Authorization: `Bearer ${tokenRef.current}` }
              : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 401 && tokenRef.current) {
            tokenRef.current = "";
            setToken("");
            setData(preview);
            await storage.remove();
          }
          throw new Error(result.error || "Request failed.");
        }
        return result as T;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError")
          throw new Error("Server took too long to respond. Please retry.");
        if (e instanceof TypeError)
          throw new Error(
            "Cannot reach the server. Check that your phone and computer are on the same Wi-Fi and the API is running.",
          );
        throw e;
      } finally {
        clearTimeout(timer);
      }
    },
    [],
  );
  const refresh = useCallback(async () => {
    if (!tokenRef.current) return;
    const activeToken = tokenRef.current;
    try {
      const next = await request<Bootstrap>("/bootstrap");
      if (next.gameCatalog) registerGames(next.gameCatalog);
      if (alive.current && activeToken === tokenRef.current) {
        setData(next);
        setError("");
      }
    } catch (e) {
      if (alive.current) setError((e as Error).message);
    }
  }, [request]);
  useEffect(() => {
    alive.current = true;
    storage
      .get()
      .then(async (saved) => {
        if (saved) {
          tokenRef.current = saved;
          setToken(saved);
          await refresh();
        }
      })
      .catch(() => setError("Could not restore your session. Please sign in."))
      .finally(() => setLoading(false));
    return () => {
      alive.current = false;
    };
  }, [refresh]);
  useEffect(() => {
    if (!token) return;
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 5000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [token, refresh]);
  const signIn = async (value: string) => {
    await storage.set(value);
    tokenRef.current = value;
    setToken(value);
    await refresh();
  };
  const signOut = async () => {
    try {
      await request("/auth/logout", "POST");
    } catch {}
    await storage.remove();
    tokenRef.current = "";
    setToken("");
    setData(preview);
    setError("");
  };
  return (
    <Context.Provider
      value={{
        data,
        demo: data.user.id === "preview",
        loading,
        error,
        request,
        refresh,
        signIn,
        signOut,
        clearError: () => setError(""),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Provider missing");
  return value;
}
