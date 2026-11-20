import React, { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { DesignIcon } from "./figma-screens";
import { colors, styles } from "./ui";

export function PartyOptions({ onDelete, title, detail, onOpenChat, disabled = false }: {
  onDelete: () => void | Promise<void>; title: string; detail: string; onOpenChat?: () => void; disabled?: boolean;
}) {
  const anchor = useRef<React.ComponentRef<typeof View>>(null);
  const { width, height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ left: 16, top: 96 });
  function show() {
    anchor.current?.measureInWindow((x, y, w, h) => {
      setPosition({ left: Math.max(16, Math.min(width - 196, x + w - 180)), top: Math.min(height - (onOpenChat ? 128 : 72), y + h + 8) });
      setConfirm(false); setError(""); setOpen(true);
    });
  }
  function close() { if (!busy) { setOpen(false); setConfirm(false); setError(""); } }
  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    try { await onDelete(); setOpen(false); setConfirm(false); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <>
    <View ref={anchor} collapsable={false}><Pressable accessibilityRole="button" accessibilityLabel="More party options" disabled={disabled} onPress={show} hitSlop={8} style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}><DesignIcon name="menu" size={32} /></Pressable></View>
    <Modal transparent visible={open} animationType="fade" onRequestClose={close}>
      <View style={[StyleSheet.absoluteFill, confirm && { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,.6)", padding: 24 }]} accessibilityViewIsModal>
        <Pressable accessibilityRole="button" accessibilityLabel="Close party options" onPress={close} style={StyleSheet.absoluteFill} />
        {confirm ? <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 24, gap: 16, width: "100%", maxWidth: 354 }}>
          <Text style={styles.title}>{title}</Text><Text style={styles.muted}>{detail}</Text>
          {!!error && <Text accessibilityLiveRegion="polite" style={{ color: "#ff7575" }}>{error}</Text>}
          <View style={{ flexDirection: "row", gap: 16 }}>
            <Pressable accessibilityRole="button" disabled={busy} onPress={close} style={s.action}><Text style={s.cancel}>Cancel</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Confirm delete" disabled={busy} onPress={() => void remove()} style={[s.action, { backgroundColor: "#ff7575" }]}>{busy ? <ActivityIndicator color="black" /> : <Text style={s.confirm}>Delete</Text>}</Pressable>
          </View>
        </View> : <View style={[s.menu, position]}>
          {onOpenChat && <Pressable accessibilityRole="button" onPress={() => { close(); onOpenChat(); }} style={{ paddingHorizontal: 16, paddingVertical: 16 }}><Text style={{ color: "white", fontFamily: "Pretendard-Medium", fontSize: 14 }}>Open party chat</Text></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={() => setConfirm(true)} style={{ paddingHorizontal: 16, paddingVertical: 16 }}><Text style={{ color: "#ff7575", fontFamily: "Pretendard-Medium", fontSize: 16 }}>Delete</Text></Pressable>
        </View>}
      </View>
    </Modal>
  </>;
}
const s = StyleSheet.create({
  menu: { position: "absolute", width: 180, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: "#474747" },
  action: { flex: 1, minHeight: 40, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cancel: { color: "white", fontFamily: "Pretendard-SemiBold", fontSize: 14 },
  confirm: { color: "black", fontFamily: "Pretendard-Bold", fontSize: 14 },
});
