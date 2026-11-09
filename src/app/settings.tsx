import React, { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Constants from "expo-constants";
import { avatarFor } from "../data";
import { DesignHeader, DesignIcon, DesignSwitch, PreviewStatusBar, PreferenceRow, design, portraits } from "../figma-screens";
import { savePreferences, usePreferences } from "../profile-preferences";
import { useStore } from "../store";
import { Button, styles } from "../ui";

export default function Settings() {
  const { data, demo, signOut } = useStore();
  const [preferences, setPreferences] = usePreferences(data.user.id);
  const [selected, setSelected] = useState("");
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <PreviewStatusBar dark />
      <DesignHeader title="Settings" variant="settings" />
      <ScrollView contentContainerStyle={[design.content, { paddingTop: 24 }]}>
        <View style={{ gap: 8 }}>
          <Text style={design.title}>My account</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/edit-profile")} style={[styles.card, styles.row, { gap: 16 }]}>
            <Image source={demo ? portraits.Raina : avatarFor(data.user.name)} style={{ width: 48, height: 48, borderRadius: 14, borderColor: "white", borderWidth: 2 }} />
            <View style={{ gap: 2 }}><Text style={styles.title}>{data.user.name}</Text><Text style={styles.link}>Edit profile ›</Text></View>
          </Pressable>
          <Pressable accessibilityRole="button" style={[styles.card, styles.spread]} onPress={() => setSelected(selected === "Manage account" ? "" : "Manage account")}>
            <View style={{ flex: 1, gap: 4 }}><Text style={design.rowText}>Manage account</Text><Text style={design.caption}>Contact info • Linked account • account settings</Text></View>
            <DesignIcon name="next" size={24} />
          </Pressable>
          {selected === "Manage account" && <Button secondary title={demo ? "Sign in" : "Sign out"} onPress={() => {
            if (demo) router.push("/auth");
            else void signOut().then(() => router.replace("/"));
          }} />}
        </View>
        <View style={{ gap: 8 }}>
          <Text style={design.title}>Notification</Text>
          <View style={[design.card, styles.spread, { minHeight: 53 }]}>
            <Text style={design.rowText}>Notification settings</Text>
            <DesignSwitch label="Notification settings" value={preferences.notifications} onChange={notifications => {
              const next = { ...preferences, notifications };
              setPreferences(next);
              void savePreferences(data.user.id, next).catch(() => setPreferences(preferences));
            }} />
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={design.title}>Support</Text>
          <View style={design.card}>
            <PreferenceRow label="Announcement" onPress={() => setSelected("Announcement")} />
            <PreferenceRow label="Help center" onPress={() => setSelected("Help center")} last />
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Text style={design.title}>About</Text>
          <View style={design.card}>
            <PreferenceRow label="Terms of service" onPress={() => setSelected("Terms of service")} />
            <PreferenceRow label="Privacy policy" onPress={() => setSelected("Privacy policy")} />
            <PreferenceRow label="App version" value={demo ? "v1.1.10" : `v${Constants.expoConfig?.version ?? "1.0.0"}`} onPress={() => setSelected("App version")} last />
          </View>
        </View>
        {Boolean(selected) && selected !== "Manage account" && (
          <View style={styles.card}>
            <Text style={styles.label}>{selected}</Text>
            <Text style={styles.muted}>{selected === "App version" ? Constants.expoConfig?.version ?? "1.0.0" : "This page is not available in the current build."}</Text>
            <Pressable accessibilityRole="button" onPress={() => setSelected("")}><Text style={styles.link}>Close</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
