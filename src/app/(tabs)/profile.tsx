import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useStore } from "../../store";
import { gameById } from "../../data";
import { DesignHeader, DesignIcon, DesignSwitch, PreviewStatusBar, GameRow, Portrait, PreferenceRow, design, portraits } from "../../figma-screens";
import { savePreferences, usePreferences } from "../../profile-preferences";
import { styles } from "../../ui";

export default function Profile() {
  const { data, demo } = useStore();
  const user = data.user;
  const [preferences, setPreferences] = usePreferences(user.id);
  const games = preferences.games ?? (demo
    ? [{ game: "lol", rank: "Silver 4", role: "Support" }, { game: "valorant", rank: "Unranked", role: "Sentinel" }]
    : [{ game: user.game, rank: user.rank, role: "" }]);
  function update(next: typeof preferences) {
    setPreferences(next);
    void savePreferences(user.id, next).catch(() => setPreferences(preferences));
  }
  return (
    <SafeAreaView edges={["top"]} style={styles.page}>
      <PreviewStatusBar />
      <DesignHeader title="My profile" variant="profile" back={false} action={
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push("/settings")} hitSlop={8}><DesignIcon name="menu" size={36} /></Pressable>
      } />
      <ScrollView contentContainerStyle={[design.content, { paddingHorizontal: 24, paddingTop: 21.5 }]}>
        <View style={[design.identity, { gap: 13.5, marginBottom: 8 }]}>
          <Portrait name={user.name} source={demo ? portraits.Raina : undefined} />
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={design.identityName}>{user.name}</Text>
          <Text style={design.handle}>{demo ? "@rainaryu" : `@${user.name.toLowerCase().replace(/\s+/g, "")}`}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push("/edit-profile")} style={[design.pill, { marginTop: -1.5 }]}><Text style={[design.pillText, { color: "#959595" }]}>Edit profile</Text></Pressable>
        </View>
        <View style={[design.card, styles.spread, { minHeight: 53 }]}>
          <Text style={design.rowText}>Ready to play</Text>
          <DesignSwitch label="Ready to play" value={preferences.ready} onChange={ready => update({ ...preferences, ready })} />
        </View>
        <View style={styles.section}>
          <Text style={design.title}>Play preferences</Text>
          <View style={design.card}>
            <PreferenceRow label="Play style" height={51} value={user.style === "Chill" ? "Casual • Chill" : user.style} />
            <PreferenceRow label="Looking for" height={51} value={preferences.looking} />
            <PreferenceRow label="Usually online" height={51} value={preferences.online} last />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={design.title}>Game I play</Text>
          {games.map(g => <GameRow key={g.game} image={gameById(g.game).image} name={gameById(g.game).name} tags={[g.rank, g.role]} onRemove={() => update({ ...preferences, games: games.filter(item => item.game !== g.game) })} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
