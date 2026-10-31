import React from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { SvgUri } from "react-native-svg";
import { Asset } from "expo-asset";
import { avatarFor, gameById } from "./data";
import { useStore } from "./store";
import { iconSources } from "./icons";
export const colors = {
  bg: "#191919",
  card: "#303030",
  field: "#474747",
  brand: "#bd8aff",
  text: "#ffffff",
  muted: "#a1a1a1",
  green: "#22ef62",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 24, paddingBottom: 32 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  spread: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontFamily: "Pretendard-Bold",
    lineHeight: 28,
  },
  label: {
    color: colors.text,
    fontSize: 16,
    fontFamily: "Pretendard-SemiBold",
  },
  text: { color: colors.text, fontSize: 14, fontFamily: "Pretendard-Medium" },
  muted: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: "Pretendard-Medium",
    lineHeight: 17,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: colors.field,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Pretendard-Medium",
    minHeight: 44,
  },
  button: {
    backgroundColor: colors.brand,
    borderRadius: 18,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontFamily: "Pretendard-Bold" },
  section: { gap: 16 },
  link: {
    color: colors.brand,
    fontSize: 12,
    fontFamily: "Pretendard-SemiBold",
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chips: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  error: { backgroundColor: "#452b35", padding: 12, borderRadius: 10 },
  empty: { paddingVertical: 24, gap: 12, alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}
export function Button({
  title,
  onPress,
  busy = false,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={busy || disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.brand,
        },
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </Pressable>
  );
}
export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}
export function Avatar({
  name,
  size = 48,
  source,
  online = false,
}: {
  name: string;
  size?: number;
  source?: ImageSourcePropType;
  online?: boolean;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <Image
        accessibilityLabel={name}
        source={source || avatarFor(name)}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
      {online && (
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: size / 5,
            height: size / 5,
            borderRadius: size / 10,
            backgroundColor: colors.green,
            borderWidth: 2,
            borderColor: colors.bg,
          }}
        />
      )}
    </View>
  );
}
export function Icon({
  name,
  size = 28,
}: {
  name: keyof typeof iconSources;
  size?: number;
}) {
  return (
    <SvgUri
      uri={Asset.fromModule(iconSources[name]).uri}
      width={size}
      height={size}
    />
  );
}
export function Heading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.spread}>
      <Label>{title}</Label>
      {Boolean(action) && (
        <Pressable accessibilityRole="button" hitSlop={10} onPress={onPress}>
          <Text style={styles.link}>{action} ›</Text>
        </Pressable>
      )}
    </View>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.label}>{title}</Text>
      <Text style={[styles.muted, { textAlign: "center" }]}>{detail}</Text>
    </View>
  );
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <View accessibilityRole="alert" style={styles.error}>
      <Text style={styles.text}>{message}</Text>
    </View>
  ) : null;
}
export function Tags({
  tags,
  onToggle,
  selected,
}: {
  tags: string[];
  onToggle?: (tag: string) => void;
  selected?: string[];
}) {
  return (
    <View style={styles.chips}>
      {tags.map((tag) => (
        <Pressable
          accessibilityRole={onToggle ? "button" : "text"}
          accessibilityState={
            onToggle ? { selected: selected?.includes(tag) } : {}
          }
          key={tag}
          onPress={() => onToggle?.(tag)}
          style={[
            styles.chip,
            selected &&
              !selected.includes(tag) && { borderColor: colors.field },
          ]}
        >
          <Text
            style={[
              styles.link,
              selected && !selected.includes(tag) && { color: colors.muted },
            ]}
          >
            {tag}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
export function GameBanner({
  game,
  subtitle,
  height = 160,
}: {
  game: string;
  subtitle?: string;
  height?: number;
}) {
  const g = gameById(game);
  return (
    <ImageBackground
      source={g.image}
      imageStyle={{ borderRadius: 12, width: '100%', height: '100%' }}
      style={{
        height,
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "flex-end",
      }}
    >
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,.85)"]}
        style={{ padding: 16, paddingTop: 60, gap: 4 }}
      >
        <Label>{g.name}</Label>
        {Boolean(subtitle) && <Text style={styles.muted}>{subtitle}</Text>}
      </LinearGradient>
    </ImageBackground>
  );
}
export function Screen({
  title,
  children,
  scroll = true,
  back = true,
}: {
  title?: string;
  children: React.ReactNode;
  scroll?: boolean;
  back?: boolean;
}) {
  const { error, refresh } = useStore();
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      {Boolean(title) && (
        <View style={styles.header}>
          {back && (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              style={{ minWidth: 32, minHeight: 32, justifyContent: "center" }}
            >
              <Text style={{ color: "white", fontSize: 32, lineHeight: 34 }}>
                ‹
              </Text>
            </Pressable>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      {Boolean(error) && (
        <Pressable onPress={() => void refresh()} style={{ padding: 12 }}>
          <ErrorText message={error + " Tap to retry."} />
        </Pressable>
      )}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
