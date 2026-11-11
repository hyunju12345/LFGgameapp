import React, { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, useWindowDimensions } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { Asset } from "expo-asset";
import { GlassSurface, OnlineFriendsPicker, invitePhotos } from "../invite-picker";
import { addDraftInvitee, createInviteDraft, useDraftInvitees } from "../party-invite-draft";
import { Party, Player } from "../data";
import { PreviewStatusBar } from "../figma-screens";
import { useResolvedGame } from "../game-library";
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
  const { width, height } = useWindowDimensions();
  const heldSpot = useRef(false);
  const memberAnchor = useRef<React.ComponentRef<typeof View>>(null);
  const [draft] = useState(createInviteDraft);
  const invited = useDraftInvitees(draft);
  const [onlinePicker, setOnlinePicker] = useState(false);
  const [popover, setPopover] = useState({ left: 20, top: 300 });
  const params = useLocalSearchParams<{ game: string }>();
  const { game, error: gameError } = useResolvedGame(params.game);
  const [mode, setMode] = useState(game.modes[0]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState(5);
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState(["Chill", "For fun", "Voice chat"]);
  const [menu, setMenu] = useState<"map" | "invite" | "remove-spot" | "tags" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { data, demo, request, refresh } = useStore();
  const baseMembers = demo
    ? [{ id: "me", name: "Me", image: require("../../assets/figma/0ae32.png") }, { id: "ian", name: "Ian", image: require("../../assets/figma/1d51b.png") }, { id: "martin", name: "Martin", image: require("../../assets/figma/fc5bb.png") }]
    : [{ id: "me", name: "Me", image: undefined }];

  const members = [...baseMembers, ...invited.map(player => ({ id: player.id, name: player.name, image: invitePhotos[player.name] }))];
  const limit = capacity - baseMembers.length;
  const onlineFriends: Player[] = demo
    ? [...data.users.filter(p => p.friendStatus === "accepted").map((p, i) => ({ ...p, reason: ["Similar rank • Casual play", "Similar rank • Same goals", "Casual play • Same map"][i] })),
      { id: "lia", name: "Lia", game: game.id, online: false, style: "Chill", rank: "Casual", reason: "Casual play • Same map" },
      { id: "uttara", name: "Uttara", game: game.id, online: false, style: "Chill", rank: "Casual", reason: "Casual play • Same map" }]
    : data.users.filter(p => p.friendStatus === "accepted" && p.online);
  function openMemberMenu(kind: "invite" | "remove-spot") {
    memberAnchor.current?.measureInWindow((x, y, cardWidth, cardHeight) => {
      const desiredTop = y + cardHeight + 16;
      setPopover({ left: Math.max(16, Math.min(width - 200, x + cardWidth - 184)), top: desiredTop + (kind === "remove-spot" ? 53 : 86) <= height - 16 ? desiredTop : Math.max(16, y - 102) });
      setMenu(kind);
    });
  }

  async function submit() {
    if (demo) { router.push("/auth"); return; }
    if (busy) return;
    setBusy(true); setError("");
    try {
      const party = await request<Party>("/parties", "POST", {
        name, game: game.id, mode, tags, capacity, is_open: open, invitees: invited.map(player => player.id),
      });
      await refresh();
      router.replace(`/party/${party.id}`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <PreviewStatusBar />
      <View style={s.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={s.back}>
          <View style={{ transform: [{ rotate: "180deg" }] }}><SvgUri uri={chevron} width={36} height={36} /></View>
        </Pressable>
        <Text style={styles.title}>Make party</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
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
            <View ref={memberAnchor} collapsable={false}><ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.membersCard} contentContainerStyle={s.members}>
              {members.map((member, index) => <View key={member.id} style={s.member}>
                <View><Avatar name={index === 0 ? data.user.name : member.name} source={member.image} size={48} />{index === 0 && <View style={s.crown}><SvgUri uri={crown} width={13} height={10} /></View>}</View>
                <Text style={s.memberName}>{member.name}</Text>
              </View>)}
              {Array.from({ length: capacity - members.length }, (_, index) => <Pressable key={`invite-${index}`} accessibilityRole="button" accessibilityLabel="Invite player" accessibilityHint="Tap to invite. Hold to remove this spot." delayLongPress={500} onPressIn={() => { heldSpot.current = false; }} onLongPress={() => { heldSpot.current = true; openMemberMenu("remove-spot"); }} onPress={() => { if (!heldSpot.current) openMemberMenu("invite"); }} style={s.member}>
                <View style={s.inviteCircle}><SvgUri uri={plus} width={16} height={16} /></View>
                <Text style={[s.memberName, { color: colors.muted }]}>Invite</Text>
              </Pressable>)}
            </ScrollView></View>
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
        <ErrorText message={error || gameError} />
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void submit()} style={s.submit}>{busy ? <ActivityIndicator color="white" /> : <Text style={s.submitText}>Make party</Text>}</Pressable>
      </ScrollView>
      <Modal visible={menu === "map" || menu === "tags"} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <Pressable style={s.overlay} onPress={() => setMenu(null)}>
          <Pressable style={s.sheet} onPress={() => {}} accessibilityViewIsModal>
            <Text style={styles.title}>{menu === "map" ? "Game map" : menu === "tags" ? "Party’s playstyle" : "Invite"}</Text>
            {menu === "map" && game.modes.map(value => <Pressable key={value} style={s.option} onPress={() => { setMode(value); setMenu(null); }}><Text style={[s.mapName, value === mode && { color: colors.brand }]}>{value}</Text><Text style={s.description}>{modeDetails[value] || game.name}</Text></Pressable>)}
            {menu === "tags" && ["Chill", "For fun", "Voice chat", "Competitive", "Every night"].map(value => <Pressable key={value} style={s.option} onPress={() => { setTags(values => values.includes(value) ? values.filter(v => v !== value) : [...values, value]); setMenu(null); }}><Text style={[s.mapName, tags.includes(value) && { color: colors.brand }]}>{value}</Text></Pressable>)}

          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={menu === "invite" || menu === "remove-spot"} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
          <Pressable accessibilityRole="button" accessibilityLabel="Close invite menu" onPress={() => setMenu(null)} style={StyleSheet.absoluteFill} />
          <GlassSurface style={[s.invitePopover, { left: popover.left, top: popover.top }]}>
            {menu === "remove-spot" ? <Pressable accessibilityRole="button" accessibilityLabel="Remove spot" onPress={() => { setCapacity(value => Math.max(members.length, 1, value - 1)); setMenu(null); }} style={s.inviteOption}><Text style={[s.inviteText, { color: "#ff6b6b" }]}>Remove spot</Text></Pressable> : <>
            <Pressable accessibilityRole="button" onPress={() => { setMenu(null); setOnlinePicker(true); }} style={s.inviteOption}><Text style={s.inviteText}>Invite Online Friends</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => { setMenu(null); router.push({ pathname: "/players", params: { game: game.id, draft, limit: String(limit) } }); }} style={s.inviteOption}><Text style={[s.inviteText, { color: colors.brand }]}>Find Similar Players</Text></Pressable></>}
          </GlassSurface>
        </View>
      </Modal>
      <OnlineFriendsPicker visible={onlinePicker} players={onlineFriends} selected={invited} full={invited.length >= limit} onClose={() => setOnlinePicker(false)} onAdd={player => addDraftInvitee(draft, player, limit)} />

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  invitePopover: { position: "absolute", width: 184, paddingHorizontal: 16, paddingVertical: 8 },
  inviteOption: { paddingVertical: 8 },
  inviteText: { color: "white", fontFamily: "Pretendard-Regular", fontSize: 16, lineHeight: 19 },
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
