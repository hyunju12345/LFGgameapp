import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { Asset } from "expo-asset";
import { Party, gameById } from "../data";
import { useStore } from "../store";
import { Avatar, ErrorText, Field, GameBanner, colors, styles } from "../ui";

const modeDetails: Record<string, string> = {
  "Normal Draft": "Summoner’s Rift • 5v5",
  ARAM: "Howling Abyss • 5v5",
  "Ranked Solo/Duo": "Competitive • Summoner’s Rift",
};
const crown = Asset.fromModule(require("../../assets/figma/80311.svg")).uri;
const chevron = Asset.fromModule(require("../../assets/figma/42bbd.svg")).uri;
const dropdown = Asset.fromModule(require("../../assets/figma/7209e.svg")).uri;
const plus = Asset.fromModule(require("../../assets/figma/c54d1.svg")).uri;

export default function CreateParty() {
  const params = useLocalSearchParams<{ game: string }>();
  const game = gameById(params.game);
  const [mode, setMode] = useState(game.modes[0]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(5);
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState(["Chill", "For fun", "Voice chat"]);
  const [menu, setMenu] = useState<"map" | "invite" | "tags" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, demo, request, refresh } = useStore();
  const members = demo
    ? [{ name: "Me", image: require("../../assets/figma/0ae32.png") }, { name: "Ian", image: require("../../assets/figma/1d51b.png") }, { name: "Martin", image: require("../../assets/figma/fc5bb.png") }]
    : [{ name: "Me", image: undefined }];

  async function submit() {
    if (demo) { router.push("/auth"); return; }
    if (busy) return;
    setBusy(true); setError("");
    try {
      const party = await request<Party>("/parties", "POST", {
        name, game: game.id, mode, tags, capacity, is_open: open,
      });
      await refresh();
      router.replace(`/party/${party.id}`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.back}>
          <View style={{ transform: [{ rotate: "180deg" }] }}><SvgUri uri={chevron} width={36} height={36} /></View>
        </Pressable>
        <Text style={styles.title}>Make party</Text>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        <View style={s.fields}>
          <View style={s.section}>
            <Text style={s.label}>Name</Text>
            <Field accessibilityLabel="Party name" placeholder="Enter party name" value={name} onChangeText={setName} maxLength={50} style={s.name} />
          </View>
          <View style={s.section}>
            <Text style={s.label}>Game to play</Text>
            <GameBanner game={game.id} height={160} />
          </View>
          <View style={s.section}>
            <View style={styles.spread}>
              <Text style={s.label}>Party members</Text>
              <Pressable accessibilityRole="button" disabled={capacity >= 10} onPress={() => setCapacity(v => Math.min(10, v + 1))} hitSlop={10}><Text style={[styles.link, capacity >= 10 && { opacity: .4 }]}>+ add spot</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.membersCard} contentContainerStyle={s.members}>
              {members.map((member, index) => <View key={member.name} style={s.member}>
                <View><Avatar name={index === 0 ? data.user.name : member.name} source={member.image} size={48} />{index === 0 && <View style={s.crown}><SvgUri uri={crown} width={13} height={10} /></View>}</View>
                <Text style={s.memberName}>{member.name}</Text>
              </View>)}
              {Array.from({ length: capacity - members.length }, (_, index) => <Pressable key={`invite-${index}`} accessibilityRole="button" accessibilityLabel="Invite player" onPress={() => setMenu("invite")} style={s.member}>
                <View style={s.inviteCircle}><SvgUri uri={plus} width={16} height={16} /></View>
                <Text style={[s.memberName, { color: colors.muted }]}>Invite</Text>
              </Pressable>)}
            </ScrollView>
          </View>
          <View style={s.section}>
            <Text style={s.label}>Game map</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Choose game map" onPress={() => setMenu("map")} style={s.map}>
              <View style={{ flex: 1, gap: 4 }}><Text style={s.mapName}>{mode}</Text><Text style={s.description}>{modeDetails[mode] || game.name}</Text></View>
              <SvgUri uri={dropdown} width={24} height={24} />
            </Pressable>
          </View>
          <View style={s.section}>
            <Text style={s.label}>Party’s playstyle</Text>
            <View style={s.tags}>
              {tags.map(tag => <Pressable key={tag} accessibilityRole="button" accessibilityLabel={`Remove ${tag}`} onPress={() => setTags(values => values.filter(value => value !== tag))} style={s.tag}><Text style={s.tagText}>{tag}</Text></Pressable>)}
              <Pressable accessibilityRole="button" accessibilityLabel="Add playstyle" onPress={() => setMenu("tags")} style={s.tag}><Text style={s.tagText}>+</Text></Pressable>
            </View>
          </View>
          <View style={s.section}>
            <Text style={s.label}>Party visibility</Text>
            <View style={s.visibility}>
              <View style={{ flex: 1, gap: 4 }}><Text style={s.mapName}>Open party</Text><Text style={s.description}>Let other players find your party and request to join.</Text></View>
              <Switch accessibilityLabel="Open party" value={open} onValueChange={setOpen} trackColor={{ true: colors.brand, false: "#b7b7b7" }} thumbColor="white" style={{ transform: [{ scale: .8 }] }} />
            </View>
          </View>
        </View>
        <ErrorText message={error} />
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={s.submit}>{busy ? <ActivityIndicator color="white" /> : <Text style={s.submitText}>Make party</Text>}</Pressable>
      </ScrollView>
      <Modal visible={menu !== null} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable style={s.overlay} onPress={() => setMenu(null)}>
          <Pressable style={s.sheet} onPress={() => {}} accessibilityViewIsModal>
            <Text style={styles.title}>{menu === "map" ? "Game map" : menu === "tags" ? "Party’s playstyle" : "Invite"}</Text>
            {menu === "map" && game.modes.map(value => <Pressable key={value} style={s.option} onPress={() => { setMode(value); setMenu(null); }}><Text style={[s.mapName, value === mode && { color: colors.brand }]}>{value}</Text><Text style={s.description}>{modeDetails[value] || game.name}</Text></Pressable>)}
            {menu === "tags" && ["Chill", "For fun", "Voice chat", "Competitive", "Every night"].map(value => <Pressable key={value} style={s.option} onPress={() => { setTags(values => values.includes(value) ? values.filter(v => v !== value) : [...values, value]); setMenu(null); }}><Text style={[s.mapName, tags.includes(value) && { color: colors.brand }]}>{value}</Text></Pressable>)}
            {menu === "invite" && <><Pressable style={s.option} onPress={() => { setMenu(null); router.push("/friends"); }}><Text style={s.mapName}>Invite Online Friends</Text></Pressable><Pressable style={s.option} onPress={() => { setMenu(null); router.push({ pathname: "/players", params: { game: game.id } }); }}><Text style={s.mapName}>Find Similar Players</Text></Pressable></>}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.card, flexDirection: "row", gap: 4, alignItems: "center" },
  back: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 32, gap: 32 },
  fields: { gap: 24 },
  section: { gap: 16 },
  label: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 16, paddingHorizontal: 4 },
  name: { minHeight: 38, height: 38, paddingVertical: 8, lineHeight: 22, fontFamily: "Pretendard-Bold" },
  membersCard: { backgroundColor: colors.card, borderRadius: 12 },
  members: { flexGrow: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 16 },
  member: { width: 48, alignItems: "center", gap: 8 },
  crown: { position: "absolute", top: -2, left: 0 },
  memberName: { color: "white", fontFamily: "Pretendard-Medium", fontSize: 12 },
  inviteCircle: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderStyle: "dashed", borderColor: "#959595", alignItems: "center", justifyContent: "center" },
  map: { backgroundColor: colors.card, borderRadius: 12, padding: 16, minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  mapName: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 16 },
  description: { color: "#959595", fontFamily: "Pretendard-Medium", fontSize: 12, lineHeight: 15 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tag: { borderWidth: 1, borderColor: colors.brand, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, minWidth: 40, alignItems: "center", justifyContent: "center" },
  tagText: { color: colors.brand, fontFamily: "Pretendard-Bold", fontSize: 12, lineHeight: 17 },
  visibility: { backgroundColor: colors.card, borderRadius: 12, minHeight: 72, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 20 },
  submit: { minHeight: 35, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" },
  submitText: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,.6)", justifyContent: "flex-end", alignItems: "center" },
  sheet: { backgroundColor: colors.bg, width: "100%", maxWidth: 402, padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, gap: 16 },
  option: { paddingVertical: 12, gap: 4 },
});
