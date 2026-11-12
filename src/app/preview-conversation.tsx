import React, { useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getPreviewConversation, teamMessages, usePreviewMessages, sendPreviewMessage } from "../conversation-preview";
import { DesignHeader, DesignIcon, PreviewStatusBar, design } from "../figma-screens";
import { Empty, Field, colors, styles } from "../ui";
import { useStore } from "../store";

type PreviewMessage = (typeof teamMessages)[number];
const suggestedMessages = ["Hey! Want to play?", "Ready for a game?", "Can I join your party?"];
const receiptGaps = [11, 17, 16, 17, 9, 9, 27, 20, 4, 9, 9, 4];

export default function PreviewConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { demo } = useStore();
  const party = id === "party";
  const thread = getPreviewConversation(id || "");
  const count = id === "team" ? 6 : undefined;
  const transcript = party || id === "team";
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [draft, setDraft] = useState("");
  const sent: PreviewMessage[] = usePreviewMessages()[id || ""] || [];
  const [menu, setMenu] = useState(false);
  const messages: PreviewMessage[] = transcript ? teamMessages : thread?.preview
    ? [{ body: thread.preview, time: thread.time, name: thread.name, image: thread.image }]
    : [];

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <View style={s.hero}>
        {thread && <Image source={thread.image} resizeMode={party ? "cover" : "stretch"}
          style={party ? [StyleSheet.absoluteFill, { width: "100%", height: "100%" }] : s.teamCover} />}
        <LinearGradient colors={["rgba(0,0,0,.45)", "rgba(0,0,0,.7)"]}>
          <PreviewStatusBar />
          <DesignHeader variant="conversation"
            title={thread ? <>{thread.name}{count ? <Text style={{ color: colors.brand }}> {count}</Text> : null}</> : "Chat"}
            subtitle={party ? "Your party • League of Legends" : undefined}
            action={<Pressable accessibilityRole="button" accessibilityLabel="Conversation details"
              onPress={() => setMenu(!menu)}><DesignIcon name="menu" size={36} /></Pressable>} />
        </LinearGradient>
      </View>
      {demo && menu && <View style={[styles.card, { margin: 12 }]}>
        <Text style={design.caption}>Design preview · Messages stay on this screen.</Text>
      </View>}
      <ScrollView ref={scroll} onContentSizeChange={() => { if (sent.length) scroll.current?.scrollToEnd({ animated: true }); }} showsVerticalScrollIndicator={false} contentContainerStyle={s.transcript} keyboardShouldPersistTaps="handled">
        {demo && [...messages, ...sent].map((message, index) => {
          const received = Boolean(message.name);
          const example = transcript && index < messages.length;
          return (
            <React.Fragment key={index}>
              {Boolean(message.date) && <Text style={s.date}>{message.date}</Text>}
              <View style={[s.messageRow, received ? s.received : s.sent]}>
                {received && (message.image
                  ? <Image source={message.image} style={s.avatar} />
                  : <View style={{ width: 32 }} />)}
                <View style={s.message}>
                  {received && message.image && <Text style={s.sender}>{message.name}</Text>}
                  <View style={[s.bubbleLine, !received && { flexDirection: "row-reverse" }, { gap: example ? receiptGaps[index] : 8 }]}>
                    <View style={[s.bubble, received ? s.incomingBubble : s.outgoingBubble, example && Boolean(message.date) && { minWidth: 209 }]}>
                      <Text style={s.messageText}>{message.body}</Text>
                    </View>
                    <View style={[s.receipt, { alignItems: received ? "flex-start" : "flex-end" }]}>
                      {example && <Text style={s.unread}>1</Text>}
                      <Text style={s.time}>{message.time}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </React.Fragment>
          );
        })}
        {!demo && <Empty title="No conversation yet" detail="Send a message to start a conversation." />}
      </ScrollView>
      {demo && thread && (
        <View style={s.composeArea}>
        <View style={s.suggestions}>
          {suggestedMessages.map(message => <Pressable key={message} accessibilityRole="button" accessibilityLabel={`Send: ${message}`} onPress={() => sendPreviewMessage(id || "", message)} style={s.suggestion}><Text style={s.suggestionText}>{message}</Text></Pressable>)}
        </View>
        <View style={s.composer}>
          <Pressable accessibilityRole="button" accessibilityLabel="Conversation details" onPress={() => setMenu(!menu)} style={[s.iconButton, { backgroundColor: "#8741e1" }]}>
            <DesignIcon name="plus" size={16} />
          </Pressable>
          <Field accessibilityLabel="Message" placeholder="Type a message..." value={draft} onChangeText={setDraft} maxLength={2000} style={s.input} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send preview message" disabled={!draft.trim()} onPress={() => {
            sendPreviewMessage(id || "", draft.trim());
            setDraft("");
          }} style={[s.iconButton, { backgroundColor: "#959595", paddingLeft: 4 }]}>
            <DesignIcon name="send" size={20} />
          </Pressable>
        </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { overflow: "hidden", zIndex: 1 },
  teamCover: { position: "absolute", width: "100%", height: 713, top: -166.34 },
  transcript: { paddingHorizontal: 16.5, paddingTop: 24, paddingBottom: 24, gap: 12 },
  date: { fontFamily: "Pretendard-Regular", color: "#8e8e93", fontSize: 12, lineHeight: 14, textAlign: "center", marginVertical: 4 },
  messageRow: { flexDirection: "row", gap: 8, minHeight: 36 },
  received: { justifyContent: "flex-start" },
  sent: { justifyContent: "flex-end" },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  message: { gap: 8, maxWidth: "100%", flexShrink: 1 },
  sender: { fontFamily: "Pretendard-Medium", color: "white", fontSize: 12, lineHeight: 14 },
  bubbleLine: { flexDirection: "row", alignItems: "flex-end", minHeight: 36 },
  bubble: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, alignSelf: "flex-start", flexShrink: 1 },
  incomingBubble: { backgroundColor: colors.field, borderTopLeftRadius: 4 },
  outgoingBubble: { backgroundColor: "#8741e1", borderBottomRightRadius: 4 },
  messageText: { fontFamily: "Pretendard-Regular", color: "white", fontSize: 16, lineHeight: 19 },
  receipt: { minHeight: 26, justifyContent: "flex-end" },
  unread: { fontFamily: "Pretendard-SemiBold", color: "#8741e1", fontSize: 10, lineHeight: 12 },
  time: { fontFamily: "Pretendard-Regular", color: "#959595", fontSize: 10, lineHeight: 14 },

  composeArea: { gap: 8 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  suggestion: { borderWidth: 1, borderColor: colors.brand, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  suggestionText: { color: colors.brand, fontFamily: "Pretendard-Medium", fontSize: 12, lineHeight: 16 },
  composer: { marginHorizontal: 9, marginBottom: 16, padding: 8, borderRadius: 24, backgroundColor: "white", flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  input: { backgroundColor: "white", color: "#191919", minHeight: 32, paddingVertical: 4, paddingHorizontal: 8, flex: 1, fontFamily: "Pretendard-Regular", fontSize: 16, lineHeight: 19 },
});
