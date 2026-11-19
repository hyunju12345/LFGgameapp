import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { DesignIcon, PreviewStatusBar } from "../../figma-screens";
import { ActivePartyCard } from "../../active-party-card";
import { usePreviewParties } from "../../party-preview";
import { useStore } from "../../store";
import { gameById } from "../../data";
import { Empty, Field, colors, styles } from "../../ui";
export default function Parties() {
  const { data, demo } = useStore();
  const previewParties = usePreviewParties();
  const [query, setQuery] = useState("");
  const parties = demo ? previewParties : data.parties.filter(party => party.members.some(member => member.id === data.user.id));
  const filtered = parties.filter(party => `${party.name} ${gameById(party.game).name}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <SafeAreaView edges={["top"]} style={styles.page}>
    <PreviewStatusBar />
    <View style={s.header}><Text style={styles.title}>Parties</Text></View>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={s.search}><DesignIcon name="search" size={16} /><Field accessibilityLabel="Search parties" placeholder="Search" value={query} onChangeText={setQuery} style={s.input} /></View>
      <View style={{ gap: 16 }}>{filtered.map(party => <ActivePartyCard key={party.id} party={{ ...party, active: demo ? party.active : party.id === data.currentPartyId }} demo={demo} compact />)}</View>
      {!filtered.length && <Empty title={query ? "No matching parties" : "Your parties live here"} detail={query ? "Try a party or game name." : "Make a party to find your next teammates."} />}
    </ScrollView>
    <Pressable accessibilityRole="button" accessibilityLabel="Make Party" onPress={() => router.push("/create-party")} style={s.make}>
      <SvgUri uri={Asset.fromModule(require("../../../assets/figma/97dc5.svg")).uri} width={16} height={16} /><Text style={s.makeText}>Make Party</Text>
    </Pressable>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.card },
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 96, gap: 32 },
  search: { backgroundColor: colors.field, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, height: 27 },
  input: { flex: 1, padding: 0, minHeight: 19, backgroundColor: "transparent", fontFamily: "Pretendard-SemiBold", fontSize: 16, lineHeight: 19 },
  make: { position: "absolute", bottom: 24, right: 20, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.brand, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12 },
  makeText: { color: "black", fontFamily: "Pretendard-Medium", fontSize: 16, lineHeight: 19 },
});
