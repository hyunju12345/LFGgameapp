import React from "react";
import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri } from "react-native-svg";
import { router } from "expo-router";
import { Avatar, colors, styles } from "./ui";

const art = {
  back: require("../assets/figma/2440b.svg"),
  next: require("../assets/figma/77055.svg"),
  menu: require("../assets/figma/10e0b.svg"),
  more: require("../assets/figma/06736.svg"),
  edit: require("../assets/figma/0d6a1.svg"),
  photo: require("../assets/figma/ea0f7.svg"),
  editNext: require("../assets/figma/436c2.svg"),
  add: require("../assets/figma/0dc6c.svg"),
  remove: require("../assets/figma/706e4.svg"),
  search: require("../assets/figma/37068.svg"),
  send: require("../assets/figma/e5cbe.svg"),
  plus: require("../assets/figma/564d8.svg"),
  friendAdd: require("../assets/figma/00143.svg"),
  online: require("../assets/figma/1a83c.svg"),
  microphone: require("../assets/figma/7049e.svg"),
};
export function DesignIcon({ name, size = 24 }: { name: keyof typeof art; size?: number }) {
  return <SvgUri uri={Asset.fromModule(art[name]).uri} width={name === "more" ? 3.5 : name === "microphone" ? 22 : size} height={name === "more" ? 18.1667 : name === "microphone" ? 28.6667 : size} />;
}

export function DesignSwitch({ label, value, onChange }: {
  label: string; value: boolean; onChange: (value: boolean) => void;
}) {
  const off = require("../assets/figma/502d0.svg");
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }}
      hitSlop={8} onPress={() => onChange(!value)}>
      {value
        ? <View style={design.switchOn}><View style={design.switchThumb} /></View>
        : <SvgUri uri={Asset.fromModule(off).uri} width={41} height={20.8254} />}
    </Pressable>
  );
}

export const portraits = {
  Raina: require("../assets/figma/4c2a6.png"),
  May: require("../assets/figma/ccbff.png"),
};
export const friendPhotos: Record<string, ImageSourcePropType> = {
  May: require("../assets/figma/fb3cf.png"),
  Jessica: require("../assets/figma/73f21.png"),
  Lemon: require("../assets/figma/0f032.png"),
  Lia: require("../assets/figma/5e79b.png"),
};

export function PreviewStatusBar({ dark = false }: { dark?: boolean }) {
  if (Platform.OS !== "web") return null;
  const time = dark ? require("../assets/figma/0a4ac.svg") : require("../assets/figma/40242.svg");
  const status = dark ? require("../assets/figma/27084.svg") : require("../assets/figma/3913f.svg");
  return (
    <View aria-hidden style={design.statusBar}>
      <View style={design.statusTime}><SvgUri uri={Asset.fromModule(time).uri} width={55.411} height={21.549} /></View>
      <View style={design.statusIcons}><SvgUri uri={Asset.fromModule(status).uri} width={68.403} height={11.632} /></View>
    </View>
  );
}

export function DesignHeader({ title, back = true, action, variant = "compact", subtitle }: {
  title: React.ReactNode; back?: boolean; action?: React.ReactNode;
  variant?: "compact" | "profile" | "settings" | "conversation";
  subtitle?: string;
}) {
  return (
    <View style={[design.header, variant === "profile" && design.profileHeader,
      variant === "settings" && design.settingsHeader, variant === "conversation" && design.conversationHeader]}>
      {back && (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/")}>
          <View style={{ transform: [{ rotate: "180deg" }] }}><DesignIcon name="back" size={36} /></View>
        </Pressable>
      )}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={design.heading}>{title}</Text>
        {Boolean(subtitle) && <Text style={design.caption}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

export function Portrait({ name, source, online, edit }: {
  name: string; source?: ImageSourcePropType; online?: boolean; edit?: boolean;
}) {
  return (
    <View style={design.portrait}>
      {source ? <Image source={source} style={design.portraitImage} /> : <Avatar name={name} size={100} />}
      {online && <View style={design.online}><DesignIcon name="online" size={22} /></View>}
      {edit && <View style={design.photoEdit}><DesignIcon name="photo" size={24} /></View>}
    </View>
  );
}

export function PreferenceRow({ label, value, onPress, last = false, height = 56, bright = false }: {
  label: string; value?: string; onPress?: () => void; last?: boolean; height?: number; bright?: boolean;
}) {
  const body = (
    <>
      <Text style={design.rowText}>{label}</Text>
      <View style={design.rowEnd}>
        {Boolean(value) && <Text style={design.rowText}>{value}</Text>}
        {onPress && <DesignIcon name={bright ? "editNext" : "next"} size={24} />}
      </View>
    </>
  );
  const row = [design.preference, { minHeight: height }, !last && design.divider];
  return onPress
    ? <Pressable accessibilityRole="button" onPress={onPress} style={row}>{body}</Pressable>
    : <View style={row}>{body}</View>;
}

export function GameRow({ image, name, tags, onRemove, onPress }: {
  image: ImageSourcePropType; name: string; tags: string[]; onRemove?: () => void; onPress?: () => void;
}) {
  const body = (
    <>
      <Image source={image} style={design.thumbnail} />
      <View style={{ flex: 1, gap: 8 }}>
        <Text style={design.rowText}>{name}</Text>
        <View style={design.badges}>
          {tags.filter(Boolean).map(tag => <Text key={tag} style={design.badge}>{tag}</Text>)}
        </View>
      </View>
    </>
  );
  const bodyStyle = [styles.row, { flex: 1, gap: 16 }];
  return (
    <View style={[styles.card, design.gameRow]}>
      {onPress
        ? <Pressable accessibilityRole="button" onPress={onPress} style={bodyStyle}>{body}</Pressable>
        : <View style={bodyStyle}>{body}</View>}
      {onRemove && <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${name}`} onPress={onRemove} hitSlop={8}><DesignIcon name="remove" size={20} /></Pressable>}
    </View>
  );
}

export const design = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  profileHeader: { paddingHorizontal: 28, paddingTop: 24, minHeight: 60 },
  settingsHeader: { paddingLeft: 18, paddingRight: 19, paddingTop: 28.8, paddingBottom: 8, gap: 4 },
  conversationHeader: { paddingHorizontal: 20, paddingTop: 17.8, paddingBottom: 16, gap: 4 },
  switchOn: { width: 41, height: 20.8254, padding: 3, alignItems: "flex-end", justifyContent: "center", borderRadius: 12, backgroundColor: colors.brand },
  switchThumb: { width: 15, height: 15, borderRadius: 8, backgroundColor: "white" },
  statusBar: { height: 47.202, position: "relative" },
  statusTime: { position: "absolute", left: 42, top: 12.31 },
  statusIcons: { position: "absolute", right: 35.65, top: 17.78 },
  heading: { ...styles.title, lineHeight: 24 },
  caption: { ...styles.muted, lineHeight: 14 },
  content: { paddingHorizontal: 20, paddingBottom: 28, gap: 24 },
  title: { ...styles.label, lineHeight: 19, marginLeft: 4 },
  portrait: { width: 110, height: 110, borderWidth: 5, borderColor: "white", borderRadius: 33, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  portraitImage: { width: 100, height: 100, borderRadius: 27 },
  online: { position: "absolute", right: -5, top: -5 },
  photoEdit: { position: "absolute", right: -3, bottom: -3 },
  identity: { alignItems: "center", gap: 16 },
  identityName: { ...styles.title, lineHeight: 24 },
  handle: { fontFamily: "Pretendard-Regular", color: colors.brand, fontSize: 16, lineHeight: 19 },
  card: { backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16 },
  preference: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.field },
  rowText: { ...styles.text, fontSize: 16, lineHeight: 19 },
  rowEnd: { flexDirection: "row", gap: 8, alignItems: "center", flexShrink: 1 },
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
  gameRow: { flexDirection: "row", alignItems: "center", minHeight: 85, gap: 16 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { ...styles.muted, color: "white", fontFamily: "Pretendard-Regular", lineHeight: 14, backgroundColor: colors.field, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 8 },
  pill: { backgroundColor: colors.field, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18 },
  pillText: { ...styles.muted, fontFamily: "Pretendard-SemiBold", lineHeight: 14, color: "white" },
});
