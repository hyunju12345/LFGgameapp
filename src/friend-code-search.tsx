import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Player } from "./data";
import { Avatar, ErrorText, Field, colors, styles } from "./ui";
import { DesignIcon } from "./figma-screens";
import { useStore } from "./store";
export function FriendCodeSearch() {
  const { data, demo, request, refresh } = useStore();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Player | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const incoming = data.users.filter(player => player.friendStatus === "pending" && player.incoming);
  const match = result ? data.users.find(player => player.id === result.id) || result : null;
  async function pasteCode() {
    try {
      const copied = (await Clipboard.getStringAsync()).replace(/[\s#-]/g, "").toUpperCase();
      if (!/^[A-F0-9]{8}$/.test(copied)) { setError("Copy a valid friend code first."); return; }
      setCode(`${copied.slice(0, 4)}-${copied.slice(4)}`); setResult(null); setError("");
    } catch { setError("Could not read the clipboard. Paste into the code field directly."); }
  }
  async function search() {
    if (loading) return;
    if (demo) { router.push("/auth"); return; }
    setLoading(true); setError(""); setResult(null);
    try { setResult(await request<Player>(`/friends/lookup?code=${encodeURIComponent(code.trim())}`)); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  async function add(player: Player) {
    if (busy) return;
    setBusy(player.id); setError("");
    try {
      await request("/friends", "POST", { userId: player.id });
      await refresh();
      if (result?.id === player.id) setResult(await request<Player>(`/friends/lookup?code=${encodeURIComponent(player.friendCode || code)}`));
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(""); }
  }
  function row(player: Player) {
    const accepted = player.friendStatus === "accepted";
    const sent = player.friendStatus === "pending" && !player.incoming;
    return <View key={player.id} style={[styles.card, styles.row]}>
      <Avatar name={player.name} size={48} />
      <View style={{ flex: 1, gap: 4 }}><Text style={styles.label}>{player.name}</Text>
        <Text selectable style={styles.muted}>{player.friendCode ? `${player.friendCode.slice(0,4)}-${player.friendCode.slice(4)}` : "Friend request"}</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${player.incoming ? "Accept" : "Add"} ${player.name}`} disabled={!!busy || accepted || sent} onPress={() => void add(player)}
        style={{ backgroundColor: colors.brand, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, opacity: accepted || sent ? .6 : 1 }}>
        <Text style={[styles.link, { color: "white" }]}>{busy === player.id ? "…" : accepted ? "Friends" : sent ? "Requested" : player.incoming ? "Accept" : "Add friend"}</Text>
      </Pressable>
    </View>;
  }
  return <View style={{ gap: 16 }}>
    <View style={[styles.row, { backgroundColor: colors.field, borderRadius: 12, paddingLeft: 8, gap: 8 }]}>
      <DesignIcon name="search" size={16} />
      <Field accessibilityLabel="Find friend by code" placeholder="Friend code" value={code} onChangeText={value => { setCode(value); setError(""); setResult(null); }}
        autoCapitalize="characters" autoCorrect={false} maxLength={12} returnKeyType="search" onSubmitEditing={() => void search()}
        style={{ flex: 1, minHeight: 36, paddingHorizontal: 0, paddingVertical: 8, fontSize: 14 }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Paste friend code" onPress={() => void pasteCode()} style={{ paddingVertical: 8, paddingHorizontal: 4 }}><Text style={styles.link}>Paste</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Find friend" disabled={loading || !code.trim()} onPress={() => void search()} style={{ padding: 8 }}>
        {loading ? <ActivityIndicator color={colors.brand} /> : <Text style={[styles.link, { color: code.trim() ? colors.brand : colors.muted }]}>Find</Text>}
      </Pressable>
    </View>
    <ErrorText message={error} />
    {match && row(match)}
    {!!incoming.length && <View style={{ gap: 16 }}><Text style={[styles.label, { paddingLeft: 4 }]}>Friend requests {incoming.length}</Text>{incoming.map(row)}</View>}
  </View>;
}
