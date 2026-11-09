import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { gameById, games } from "../data";
import { DesignHeader, DesignIcon, PreviewStatusBar, GameRow, Portrait, PreferenceRow, design, portraits } from "../figma-screens";
import { savePreferences, usePreferences } from "../profile-preferences";
import { useStore } from "../store";
import { ErrorText, Field, styles } from "../ui";

const options = {
  style: ["Chill", "Competitive", "For fun"],
  looking: ["Friends to ply with", "A regular squad", "Competitive teammates"],
  online: ["Evening • 7–11 PM", "Afternoon", "Late night", "Weekends"],
  rank: ["Unranked", "Iron 3", "Bronze", "Silver 4", "Gold", "Platinum", "Diamond"],
};
export default function EditProfile() {
  const { data } = useStore();
  return <EditForm key={data.user.id} />;
}

function EditForm() {
  const { data, demo, request, refresh } = useStore();
  const user = data.user;
  const [preferences] = usePreferences(user.id);
  const [changes, setChanges] = useState<Partial<typeof preferences>>({});
  const [name, setName] = useState(user.name);
  const [style, setStyle] = useState(user.style);
  const [rank, setRank] = useState(demo ? "Silver 4" : user.rank);
  const [menu, setMenu] = useState<keyof typeof options | "game" | "name" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const values = { ...preferences, ...changes };
  const selectedGames = values.games ?? (demo
    ? [{ game: "lol", rank: "Silver 4", role: "Support" }, { game: "valorant", rank: "Unranked", role: "Sentinel" }]
    : [{ game: user.game, rank: user.rank, role: "" }]);

  async function complete() {
    if (demo) { router.push("/auth"); return; }
    setBusy(true);
    setError("");
    try {
      await request("/profile", "PATCH", { name, style, rank, game: selectedGames[0]?.game || user.game });
      await savePreferences(user.id, { ...values, games: selectedGames.map((g, index) => index === 0 ? { ...g, rank } : g) });
      await refresh();
      router.back();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <PreviewStatusBar />
      <DesignHeader title="Edit profile" action={
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void complete()} style={design.pill}>
          <Text style={design.rowText}>{busy ? "Saving…" : "Complete"}</Text>
        </Pressable>
      } />
      <ScrollView contentContainerStyle={[design.content, { paddingTop: 21.5 }]} keyboardShouldPersistTaps="handled">
        <View style={[design.identity, { gap: 13.5, marginBottom: 8 }]}>
          <Portrait name={user.name} source={demo ? portraits.Raina : undefined} edit />
          <Pressable accessibilityRole="button" accessibilityLabel="Edit name" onPress={() => setMenu(menu === "name" ? null : "name")} style={styles.row}>
            <Text style={design.identityName}>{name}</Text><DesignIcon name="edit" size={14} />
          </Pressable>
        </View>
        {menu === "name" && <Field accessibilityLabel="Display name" value={name} onChangeText={setName} maxLength={30} />}
        <View style={styles.section}>
          <Text style={design.title}>Play preferences</Text>
          <View style={design.card}>
            <PreferenceRow bright label="Play style" value={style === "Chill" ? "Casual • Chill" : style} onPress={() => setMenu("style")} />
            <PreferenceRow bright label="Looking for" value={values.looking} onPress={() => setMenu("looking")} />
            <PreferenceRow bright label="Usually online" value={values.online} onPress={() => setMenu("online")} last />
          </View>
          {menu && menu !== "game" && menu !== "name" && (
            <View style={design.card}>
              {options[menu].map((value, index) => <PreferenceRow key={value} label={value} last={index === options[menu].length - 1} onPress={() => {
                if (menu === "style") setStyle(value);
                else if (menu === "rank") setRank(value);
                else setChanges(current => ({ ...current, [menu]: value }));
                setMenu(null);
              }} />)}
            </View>
          )}
        </View>
        <View style={styles.section}>
          <View style={styles.spread}><Text style={design.title}>Game I play</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Add game" onPress={() => setMenu(menu === "game" ? null : "game")} hitSlop={8}><DesignIcon name="add" size={16} /></Pressable>
          </View>
          {selectedGames.map((g, index) => (
            <GameRow key={g.game} image={gameById(g.game).image} name={gameById(g.game).name}
              tags={[index === 0 ? rank : g.rank, g.role]}
              onPress={index === 0 ? () => setMenu("rank") : undefined}
              onRemove={() => {
                const remaining = selectedGames.filter(item => item.game !== g.game);
                if (index === 0) setRank(remaining[0]?.rank ?? user.rank);
                setChanges(current => ({ ...current, games: remaining }));
              }}
            />
          ))}
          {menu === "game" && <View style={design.card}>
            {games.filter(g => !selectedGames.some(item => item.game === g.id)).map(g => <PreferenceRow key={g.id} label={g.name} onPress={() => {
              setChanges(current => ({ ...current, games: [...selectedGames, { game: g.id, rank: "Unranked", role: "" }] }));
              setMenu(null);
            }} />)}
          </View>}
        </View>
        <ErrorText message={error} />
      </ScrollView>
    </SafeAreaView>
  );
}
