import React from "react";
import { ImageSourcePropType, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { Player } from "./data";
import { Avatar, Empty, colors, styles } from "./ui";
import { DesignIcon } from "./figma-screens";
export const invitePhotos: Record<string, ImageSourcePropType> = {
  May: require("../assets/figma/51e41.png"), Jessica: require("../assets/figma/73f21.png"), Lemon: require("../assets/figma/df5f2.png"),
  Lia: require("../assets/figma/dab7e.png"), Uttara: require("../assets/figma/928a7.png"),
};
export function GlassSurface({ children, style }: { children: React.ReactNode; style?: React.ComponentProps<typeof View>["style"] }) {
  return <View style={[s.glass, style]}>
    <BlurView intensity={65} tint="dark" style={StyleSheet.absoluteFill} />
    <LinearGradient colors={["rgba(255,255,255,.13)", "rgba(255,255,255,.015)", "rgba(255,255,255,.09)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
    {children}
  </View>;
}
export function InvitePlayerRow({ player, onlineList = false, selected = false, disabled = false, onAdd, onProfile }: {
  player: Player; onlineList?: boolean; selected?: boolean; disabled?: boolean; onAdd: () => void; onProfile?: () => void;
}) {
  const body = <><View style={{ width: 48, height: 48 }}><Avatar name={player.name} size={48} source={onlineList ? invitePhotos[player.name] : undefined} />
    {player.online && <View style={s.dot}><SvgUri uri={Asset.fromModule(onlineList ? require("../assets/figma/e8931.svg") : require("../assets/figma/85772.svg")).uri} width={12} height={12} /></View>}</View>
    <View style={{ flex: 1, gap: 4 }}><View style={[styles.row, { gap: 12 }]}><Text style={s.name}>{player.name}</Text>{!onlineList && player.match !== undefined && <Text style={s.match}>{player.match}% match</Text>}</View>
      <Text numberOfLines={1} style={s.reason}>{player.reason || "Same game"}</Text></View></>;
  return <View style={[s.row, onlineList && { backgroundColor: "black" }]}>
    {onProfile ? <Pressable accessibilityRole="button" accessibilityLabel={`${player.name} profile`} onPress={onProfile} style={[styles.row, { flex: 1, gap: 12 }]}>{body}</Pressable> : <View style={[styles.row, { flex: 1, gap: 12 }]}>{body}</View>}
    <Pressable accessibilityRole="button" accessibilityLabel={`${selected ? "Added" : "Add"} ${player.name}`} accessibilityState={{ disabled: disabled || selected }} disabled={disabled || selected} onPress={onAdd} style={s.add}>
      {!selected && <View style={{ width: 8, height: 8 }}><View style={{ position: "absolute", left: -1, top: -1 }}><DesignIcon name="friendAdd" size={10} /></View></View>}<Text style={s.addText}>{selected ? "Added" : "add"}</Text>
    </Pressable>
  </View>;
}
export function OnlineFriendsPicker({ visible, players, selected, full, onClose, onAdd }: {
  visible: boolean; players: Player[]; selected: Player[]; full: boolean; onClose: () => void; onAdd: (p: Player) => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={s.overlay} accessibilityViewIsModal>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss online friends" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={s.picker} accessibilityLabel="Online friends picker">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, gap: 24 }} keyboardShouldPersistTaps="handled">
          {players.map(player => <InvitePlayerRow key={player.id} player={player} onlineList selected={selected.some(p => p.id === player.id)} disabled={full} onAdd={() => onAdd(player)} />)}
          {!players.length && <Empty title="No online friends" detail="Your online friends will appear here." />}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  glass: { backgroundColor: "rgba(132,132,132,.16)", borderWidth: 1, borderColor: "rgba(255,255,255,.28)", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: .28, shadowRadius: 20 },
  row: { backgroundColor: colors.card, borderRadius: 12, padding: 16, minHeight: 80, flexDirection: "row", gap: 8, alignItems: "center" },
  dot: { position: "absolute", left: 36, top: 36 }, name: { color: "white", fontFamily: "Pretendard-SemiBold", fontSize: 16, lineHeight: 19 },
  match: { color: colors.brand, fontFamily: "Pretendard-Bold", fontSize: 12, lineHeight: 14 },
  reason: { color: "#959595", fontFamily: "Pretendard-Medium", fontSize: 12, lineHeight: 14 },
  add: { backgroundColor: colors.brand, padding: 8, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 4 },
  addText: { color: "white", fontFamily: "Pretendard-Bold", fontSize: 12, lineHeight: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(255,255,255,.2)", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  picker: { width: "100%", maxWidth: 402, height: "66%", maxHeight: 650, borderRadius: 16, backgroundColor: colors.card, overflow: "hidden" },
});
